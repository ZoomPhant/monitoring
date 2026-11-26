#!/usr/bin/env node
/**
 * Sync publishable blogs from `website/blogs/` into `website/src/content/blog/`.
 *
 * - Ignores `README.md`, files/folders starting with `_` or `.`, and posts with `draft: true`.
 * - True sync: any previously published post removed from `blogs/` (or marked `draft: true`)
 *   is automatically removed from `src/content/blog/` so it disappears from the website.
 * - Supports both flat files (`blogs/engineering/2026-11-26-my-post.md`) and folder-based posts
 *   (`blogs/engineering/2026-11-26-my-post/index.md` with `assets/` subfolder or co-located files).
 * - Folder assets are synced to `public/blog-assets/<slug>/` and relative markdown/HTML paths
 *   like `./assets/foo.png`, `assets/foo.png`, or `./foo.png` are rewritten automatically to
 *   `/blog-assets/<slug>/foo.png`.
 *
 * Usage:
 *   npm run publish:blogs
 *   npm run publish:blogs -- --dry-run
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
  copyFileSync,
} from 'node:fs';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SOURCE_DIR = join(ROOT, 'blogs');
const TARGET_DIR = join(ROOT, 'src', 'content', 'blog');
const ASSETS_DIR = join(ROOT, 'public', 'blog-assets');

const DRY_RUN = process.argv.includes('--dry-run');

const CATEGORY_MAP = {
  engineering: 'Engineering',
  product: 'Product',
  guide: 'Guides',
  guides: 'Guides',
  'case-study': 'Case Study',
  'case-studies': 'Case Study',
  announcement: 'Announcements',
  announcements: 'Announcements',
};

const ASSET_EXTS = new Set([
  '.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.avif',
  '.mp4', '.webm', '.pdf', '.csv', '.json', '.txt',
]);

/**
 * Collect assets for a folder-based post.
 * Supports both `<postDir>/assets/<file>` (preferred) and `<postDir>/<file>` (co-located).
 * Returns array of `{ srcPath, destName }`.
 */
function collectPostAssets(postDir) {
  const results = [];
  const seenNames = new Set();

  const addFromDir = (dir, prefix = '') => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir)) {
      if (entry.startsWith('.') || entry.startsWith('_')) continue;
      const full = join(dir, entry);
      const st = statSync(full);
      if (st.isDirectory()) {
        // Recurse inside assets/ subdirectories, or into assets/ itself
        if (prefix === '' && entry === 'assets') {
          addFromDir(full, '');
        } else if (prefix !== '' || dir.endsWith(`${join('', 'assets')}`)) {
          addFromDir(full, prefix ? `${prefix}/${entry}` : entry);
        }
        continue;
      }
      if (ASSET_EXTS.has(extname(entry).toLowerCase())) {
        const destName = prefix ? `${prefix}/${entry}` : entry;
        if (!seenNames.has(destName)) {
          seenNames.add(destName);
          results.push({ srcPath: full, destName });
        }
      }
    }
  };

  // Prefer `assets/` first so it takes precedence if same filename exists
  addFromDir(join(postDir, 'assets'), '');
  for (const entry of readdirSync(postDir)) {
    if (entry.startsWith('.') || entry.startsWith('_') || entry === 'assets') continue;
    const full = join(postDir, entry);
    if (statSync(full).isFile() && ASSET_EXTS.has(extname(entry).toLowerCase())) {
      if (!seenNames.has(entry)) {
        seenNames.add(entry);
        results.push({ srcPath: full, destName: entry });
      }
    }
  }
  return results;
}

/**
 * Rewrite relative asset references (`./assets/foo.png`, `assets/foo.png`, `./foo.png`, `foo.png`)
 * to `/blog-assets/<slug>/foo.png` when those files exist in the post's collected assets.
 */
function rewriteAssetUrls(text, slug, assetNames) {
  if (!text || !assetNames.size) return text;

  const resolveRel = (rawUrl) => {
    const trimmed = rawUrl.trim();
    if (/^(https?:|data:|mailto:|#|\/)/i.test(trimmed)) return null;
    const cleaned = trimmed.replace(/^\.\//, '').replace(/^assets\//, '');
    if (assetNames.has(cleaned)) {
      return `/blog-assets/${slug}/${cleaned}`;
    }
    return null;
  };

  // Markdown links & images: ![alt](url "title") or [text](url)
  let out = text.replace(/(!?\[[^\]]*\]\()([^)\s]+)((?:\s+"[^"]*")?\))/g, (full, pre, url, post) => {
    const mapped = resolveRel(url);
    return mapped ? `${pre}${mapped}${post}` : full;
  });

  // HTML src="..." / href="..."
  out = out.replace(/(\b(?:src|href)=["'])([^"']+)(["'])/gi, (full, pre, url, post) => {
    const mapped = resolveRel(url);
    return mapped ? `${pre}${mapped}${post}` : full;
  });

  return out;
}

function parseScalar(raw) {
  const s = raw.trim();
  if (s === 'true') return true;
  if (s === 'false') return false;
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, "'");
  }
  if (s.startsWith('[') && s.endsWith(']')) {
    const inner = s.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(',').map((item) => parseScalar(item));
  }
  return s;
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: null, body: content };
  const lines = match[1].split(/\r?\n/);
  const data = {};
  let currentListKey = null;

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const listMatch = line.match(/^\s+-\s+(.*)$/);
    if (listMatch && currentListKey) {
      data[currentListKey].push(parseScalar(listMatch[1]));
      continue;
    }
    const kvMatch = line.match(/^([A-Za-z0-9_]+)\s*:\s*(.*)$/);
    if (!kvMatch) continue;
    const [, key, rest] = kvMatch;
    if (rest.trim() === '') {
      data[key] = [];
      currentListKey = key;
    } else {
      currentListKey = null;
      data[key] = parseScalar(rest);
    }
  }
  return { data, body: match[2] };
}

function yamlValue(v) {
  if (typeof v === 'boolean' || typeof v === 'number') return String(v);
  if (Array.isArray(v)) {
    return `[${v.map((item) => JSON.stringify(String(item))).join(', ')}]`;
  }
  return JSON.stringify(String(v));
}

function serializePost(data, body) {
  const orderedKeys = [
    'title',
    'subtitle',
    'description',
    'date',
    'updatedDate',
    'author',
    'authorRole',
    'category',
    'tags',
    'readingTime',
    'featured',
    'coverImage',
  ];
  const lines = ['---'];
  for (const k of orderedKeys) {
    if (data[k] === undefined || data[k] === null || data[k] === '') continue;
    lines.push(`${k}: ${yamlValue(data[k])}`);
  }
  for (const [k, v] of Object.entries(data)) {
    if (orderedKeys.includes(k) || k === 'draft' || k === 'slug') continue;
    if (v === undefined || v === null || v === '') continue;
    lines.push(`${k}: ${yamlValue(v)}`);
  }
  lines.push('---', '');
  return lines.join('\n') + body.replace(/^\r?\n/, '');
}

function estimateReadingTime(body) {
  const words = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[^\w\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / 220));
  return `${mins} min read`;
}

function inferCategory(relPath) {
  const parts = relPath.split(/[\\/]/);
  if (parts.length > 1) {
    const mapped = CATEGORY_MAP[parts[0].toLowerCase()];
    if (mapped) return mapped;
  }
  return null;
}

function normalizeCategory(raw, relPath) {
  if (raw && typeof raw === 'string') {
    const mapped = CATEGORY_MAP[raw.trim().toLowerCase()];
    return mapped || raw.trim();
  }
  return inferCategory(relPath) || 'Engineering';
}

function deriveSlug(filePath, data) {
  if (data.slug && typeof data.slug === 'string') return data.slug.trim();
  const ext = extname(filePath);
  const name = basename(filePath, ext);
  const raw = name.toLowerCase() === 'index' ? basename(dirname(filePath)) : name;
  return raw
    .replace(/^\d{4}-\d{2}-\d{2}-/, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function collectMarkdownFiles(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('.') || entry.startsWith('_')) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      collectMarkdownFiles(full, out);
    } else if ((entry.endsWith('.md') || entry.endsWith('.mdx')) && entry.toLowerCase() !== 'readme.md') {
      out.push(full);
    }
  }
  return out;
}

function main() {
  if (!existsSync(SOURCE_DIR)) {
    console.error(`Source folder not found: ${SOURCE_DIR}`);
    process.exit(1);
  }

  const sourceFiles = collectMarkdownFiles(SOURCE_DIR).sort();
  const publishable = new Map(); // filename (`<slug>.md` or `<slug>.mdx`) -> { slug, rel, content, assetDir }
  const seenSlugs = new Map();
  const skippedDrafts = [];
  const errors = [];

  for (const filePath of sourceFiles) {
    const rel = relative(SOURCE_DIR, filePath);
    const raw = readFileSync(filePath, 'utf8');
    const { data, body } = parseFrontmatter(raw);
    if (!data) {
      errors.push(`${rel}: missing YAML frontmatter (--- ... ---)`);
      continue;
    }
    if (data.draft === true) {
      skippedDrafts.push(rel);
      continue;
    }
    for (const req of ['title', 'description', 'date']) {
      if (!data[req]) errors.push(`${rel}: missing required frontmatter field "${req}"`);
    }
    const slug = deriveSlug(filePath, data);
    if (!slug) {
      errors.push(`${rel}: could not derive a valid slug`);
      continue;
    }
    if (seenSlugs.has(slug)) {
      errors.push(`${rel}: duplicate slug "${slug}" (also used by ${seenSlugs.get(slug)})`);
      continue;
    }
    seenSlugs.set(slug, rel);

    const ext = extname(filePath);
    const isFolderPost = basename(filePath, ext).toLowerCase() === 'index';
    const assetDir = isFolderPost ? dirname(filePath) : null;
    const assets = assetDir ? collectPostAssets(assetDir) : [];
    const assetNames = new Set(assets.map((a) => a.destName));

    let rewrittenCover = data.coverImage;
    if (rewrittenCover && assetNames.size) {
      const cleaned = String(rewrittenCover).trim().replace(/^\.\//, '').replace(/^assets\//, '');
      if (assetNames.has(cleaned)) rewrittenCover = `/blog-assets/${slug}/${cleaned}`;
    }

    const rewrittenBody = rewriteAssetUrls(body, slug, assetNames);

    const normalized = {
      ...data,
      ...(rewrittenCover ? { coverImage: rewrittenCover } : {}),
      category: normalizeCategory(data.category, rel),
      tags: Array.isArray(data.tags) ? data.tags : [],
      author: data.author || 'ZoomPhant Engineering',
      readingTime: data.readingTime || estimateReadingTime(rewrittenBody),
      featured: Boolean(data.featured),
    };

    publishable.set(`${slug}${ext}`, {
      slug,
      rel,
      content: serializePost(normalized, rewrittenBody),
      assets,
    });
  }

  if (errors.length) {
    console.error('❌ Blog publish aborted due to validation errors:\n');
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  if (!DRY_RUN) {
    mkdirSync(TARGET_DIR, { recursive: true });
  }

  const existingFiles = existsSync(TARGET_DIR)
    ? readdirSync(TARGET_DIR).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'))
    : [];

  let written = 0;
  let unchanged = 0;
  let removed = 0;

  // 1. Write / update publishable posts
  for (const [targetName, post] of publishable) {
    const targetPath = join(TARGET_DIR, targetName);
    const prev = existsSync(targetPath) ? readFileSync(targetPath, 'utf8') : null;
    if (prev === post.content) {
      unchanged++;
    } else {
      written++;
      if (!DRY_RUN) writeFileSync(targetPath, post.content, 'utf8');
      console.log(`  ${prev === null ? '+' : '~'} ${targetName}  (from blogs/${post.rel})`);
    }
  }

  // 2. Remove posts that are no longer publishable (deleted from blogs/ or flipped to draft: true)
  for (const existing of existingFiles) {
    if (!publishable.has(existing)) {
      removed++;
      if (!DRY_RUN) rmSync(join(TARGET_DIR, existing), { force: true });
      console.log(`  - ${existing}  (removed)`);
    }
  }

  // 3. Sync folder assets (`assets/` and co-located files) into public/blog-assets/<slug>/
  const activeAssetSlugs = new Set();
  for (const post of publishable.values()) {
    if (!post.assets.length) continue;
    activeAssetSlugs.add(post.slug);
    if (!DRY_RUN) {
      const destDir = join(ASSETS_DIR, post.slug);
      rmSync(destDir, { recursive: true, force: true });
      for (const a of post.assets) {
        const destPath = join(destDir, a.destName);
        mkdirSync(dirname(destPath), { recursive: true });
        copyFileSync(a.srcPath, destPath);
      }
    }
  }
  if (existsSync(ASSETS_DIR) && !DRY_RUN) {
    for (const dir of readdirSync(ASSETS_DIR)) {
      if (!activeAssetSlugs.has(dir)) rmSync(join(ASSETS_DIR, dir), { recursive: true, force: true });
    }
  }

  const mode = DRY_RUN ? ' (dry-run)' : '';
  console.log(
    `\n✅ Blog sync complete${mode}: ${publishable.size} live (${written} updated, ${unchanged} unchanged), ${removed} removed, ${skippedDrafts.length} draft(s) skipped.`
  );
  if (skippedDrafts.length) {
    for (const d of skippedDrafts) console.log(`   [draft] blogs/${d}`);
  }
}

main();
