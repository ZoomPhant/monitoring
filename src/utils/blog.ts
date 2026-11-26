export const BLOG_CATEGORIES = [
  'Engineering',
  'Product',
  'Guides',
  'Case Study',
  'Announcements',
] as const;

const CATEGORY_STYLES: Record<string, string> = {
  Engineering: 'bg-brand-50 text-brand-700 border-brand-200',
  Product: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Guides: 'bg-amber-50 text-amber-700 border-amber-200',
  'Case Study': 'bg-violet-50 text-violet-700 border-violet-200',
  Announcements: 'bg-sky-50 text-sky-700 border-sky-200',
};

export function categoryBadgeClass(category: string): string {
  return CATEGORY_STYLES[category] || 'bg-slate-100 text-slate-700 border-slate-200';
}

export function categorySlug(category: string): string {
  return category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function formatBlogDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
