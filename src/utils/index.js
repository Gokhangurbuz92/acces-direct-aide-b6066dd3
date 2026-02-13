import slugify from '@sindresorhus/slugify';

export function toSlug(text) {
  if (!text) return '';
  return slugify(text, { lowercase: true, decamelize: false });
}

export function fromSlug(slug) {
  if (!slug) return '';
  return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

const PAGE_URL_MAP = {
  Home: '/',
  Aides: '/aides',
  AideDetail: '/aide/view',
  Demarches: '/demarches',
  DemarcheDetail: '/demarches/view',
  StructureDetail: '/structures/view',
  Actualites: '/actualites',
  Contact: '/contact',
  AppointmentRequest: '/appointments/request',
  AdminAides: '/admin/aides',
  AdminAideEdit: '/admin/aides/:id',
  AdminDemarches: '/admin/demarches',
  AdminDemarcheEdit: '/admin/demarches/:id',
  AdminRecentSyncs: '/admin/sync/recent',
};

function fillRouteParams(routeTemplate, params = {}) {
  return routeTemplate.replace(/:([A-Za-z0-9_]+)/g, (_match, key) => {
    const value = params[key];
    const normalizedValue = value === undefined || value === null || value === '' ? 'new' : String(value);
    return encodeURIComponent(normalizedValue);
  });
}

export function createPageUrl(pageName, params = {}) {
  const routeTemplate = PAGE_URL_MAP[pageName];
  if (routeTemplate) {
    return fillRouteParams(routeTemplate, params);
  }
  return '/' + toSlug(pageName);
}
