import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const SITE = 'https://www.zoomphant.com';

const STATIC_PAGES: Array<{ path: string; priority: string; changefreq: string }> = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/solutions/ai-agent-observability/', priority: '0.9', changefreq: 'weekly' },
  { path: '/solutions/cloudflare-tsdb/', priority: '0.9', changefreq: 'weekly' },
  { path: '/solutions/gpu-monitoring/', priority: '0.9', changefreq: 'weekly' },
  { path: '/docs/', priority: '0.9', changefreq: 'weekly' },
  { path: '/compare/', priority: '0.9', changefreq: 'monthly' },
  { path: '/gadgets/', priority: '0.8', changefreq: 'weekly' },
  { path: '/trial/', priority: '0.8', changefreq: 'monthly' },
  { path: '/about/', priority: '0.7', changefreq: 'monthly' },
  { path: '/register/', priority: '0.6', changefreq: 'monthly' },
  { path: '/privacy/', priority: '0.3', changefreq: 'yearly' },
  { path: '/terms/', priority: '0.3', changefreq: 'yearly' },
];

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const GET: APIRoute = async () => {
  const docs = await getCollection('docs');
  const lastmod = new Date().toISOString().split('T')[0];

  const docEntries = docs
    .map((doc) => ({
      path: `/docs/${doc.slug}/`,
      priority: doc.data.parent ? '0.6' : '0.8',
      changefreq: 'monthly',
    }))
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));

  const allUrls = [...STATIC_PAGES, ...docEntries];

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...allUrls.map(
      (u) =>
        `  <url>\n    <loc>${escapeXml(`${SITE}${u.path}`)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
    ),
    '</urlset>',
    '',
  ].join('\n');

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
