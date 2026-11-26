# ZoomPhant Blogs (Authoring Folder)

This folder is the **authoring workspace** for all ZoomPhant blog posts. Astro does **not** build files directly from `blogs/`, so half-finished drafts can stay safely in Git without ever appearing on the live website.

## Folder Organization

Organize posts by category subfolder (recommended) or place `.md` / `.mdx` files directly here:

```text
blogs/
├── _template.md                  # Copy-paste starter (ignored by publish script)
├── engineering/                  # Default category: Engineering
│   └── 2026-11-26-all-you-need-is-an-agent-first-tsdb/
│       ├── index.md
│       └── assets/
│           └── quota-warning-do-rows-read.png
├── product/                      # Default category: Product
├── guides/                       # Default category: Guides
├── case-studies/                 # Default category: Case Study
└── announcements/                # Default category: Announcements
```

- **Prefixing folder/file names with `YYYY-MM-DD-`** keeps posts sorted chronologically in your editor; the publish script automatically strips the date prefix to produce clean URLs like `/blog/all-you-need-is-an-agent-first-tsdb/`.
- **Per-blog `assets/` folder:** Put images, diagrams, videos, or downloadable files inside `<post-folder>/assets/` and reference them with standard relative paths (`![Alt text](./assets/diagram.png)`). They preview natively in Markdown editors and `publish:blogs` automatically syncs them to `/blog-assets/<slug>/` and rewrites URLs at publish time.
- **Ignored files:** `README.md` and any file or folder starting with `_` or `.` are never published.

## Frontmatter Fields

| Field | Required | Notes |
|---|---|---|
| `title` | Yes | Article headline |
| `subtitle` | No | Secondary line shown under the title |
| `description` | Yes | Summary for cards, SEO meta description, and social previews |
| `date` | Yes | Publish date in `YYYY-MM-DD` format |
| `category` | No | `Engineering`, `Product`, `Guides`, `Case Study`, or `Announcements` (inferred from folder name if omitted) |
| `author` | No | Defaults to `ZoomPhant Engineering` |
| `authorRole` | No | Optional role/team subtitle |
| `tags` | No | Array of short tags, e.g. `["AI Agents", "TSDB", "Observability"]` |
| `draft` | No | Set `draft: true` while writing; set `draft: false` (or remove) when ready |
| `featured` | No | Set `featured: true` to highlight on `/blog/` |
| `slug` | No | Optional custom URL slug |

## Publishing & Unpublishing (True Sync)

Preview what will change:

```bash
npm run publish:blogs -- --dry-run
```

Sync ready posts to the website (`src/content/blog/`):

```bash
npm run publish:blogs
```

`publish:blogs` performs a **true sync**:
- Posts with `draft: false` (or omitted) are published/updated in `src/content/blog/`.
- Posts with `draft: true` are skipped—and if previously published, **removed** from `src/content/blog/`.
- Deleting a file from `blogs/` and running `npm run publish:blogs` **removes** it from the website automatically.
