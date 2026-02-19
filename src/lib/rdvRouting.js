/**
 * @param {unknown} value
 * @param {string=} fallback
 */
export function normalizeNextPath(value, fallback = '/') {
  if (typeof value !== 'string') return fallback;

  const trimmed = value.trim();
  if (!trimmed) return fallback;

  let decoded = trimmed;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    decoded = trimmed;
  }

  if (!decoded.startsWith('/')) return fallback;
  if (decoded.startsWith('//')) return fallback;

  return decoded;
}

/**
 * @param {string} path
 * @param {string | null | undefined} nextPath
 */
export function appendNext(path, nextPath) {
  const safeNext = normalizeNextPath(nextPath || '', '');
  if (!safeNext) return path;
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}next=${encodeURIComponent(safeNext)}`;
}

/**
 * @param {{ id?: string | null, slug?: string | null } | null | undefined} structure
 */
export function buildPublicRdvPath(structure) {
  const slug = String(structure?.slug || '').trim();
  if (slug) {
    return `/rdv/${encodeURIComponent(slug)}`;
  }

  const id = String(structure?.id || '').trim();
  if (!id) return '/annuaire';

  const encodedId = encodeURIComponent(id);
  return `/rdv/${encodedId}?structureId=${encodedId}`;
}
