import slugify from '@sindresorhus/slugify';

export function toSlug(text) {
  if (!text) return '';
  return slugify(text, { lowercase: true, decamelize: false });
}

export function fromSlug(slug) {
  if (!slug) return '';
  return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export function createPageUrl(pageName) {
  return '/' + toSlug(pageName);
}
