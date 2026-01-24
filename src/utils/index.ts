import slugify from '@sindresorhus/slugify';

export function toSlug(text: string): string {
  if (!text) return '';
  return slugify(text, { lowercase: true, decamelize: false });
}

export function fromSlug(slug: string): string {
  if (!slug) return '';
  return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export function createPageUrl(pageName: string): string {
  return '/' + toSlug(pageName);
}
