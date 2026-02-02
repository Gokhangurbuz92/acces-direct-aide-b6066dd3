/**
 * URL UTILITIES FOR ACTUALITES
 *
 * Normalisation des URLs pour déduplication et traçabilité
 */

import crypto from 'crypto';

/**
 * Normalise une URL en supprimant les paramètres inutiles (UTM, etc.)
 * et en standardisant le format
 *
 * @param {string} rawUrl - URL brute
 * @returns {string} - URL normalisée
 */
export function normalizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return '';
  }

  try {
    // Trim whitespace
    let url = rawUrl.trim();

    // Ensure HTTPS protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const parsed = new URL(url);

    // Remove tracking parameters
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'msclkid', '_ga', '_gl',
      'mc_cid', 'mc_eid', 'ref', 'source', 'campaign'
    ];

    trackingParams.forEach(param => {
      parsed.searchParams.delete(param);
    });

    // Normalize trailing slash
    let pathname = parsed.pathname;
    if (pathname.endsWith('/') && pathname.length > 1) {
      pathname = pathname.slice(0, -1);
    }
    parsed.pathname = pathname;

    // Sort remaining query params for consistency
    const sortedParams = new URLSearchParams(
      [...parsed.searchParams.entries()].sort((a, b) => a[0].localeCompare(b[0]))
    );
    parsed.search = sortedParams.toString();

    // Remove fragment (hash)
    parsed.hash = '';

    return parsed.toString();
  } catch (error) {
    console.error('URL normalization error:', error);
    return rawUrl;
  }
}

/**
 * Extrait le domaine d'une URL
 *
 * @param {string} url - URL
 * @returns {string} - Domaine (ex: "service-public.fr")
 */
export function extractDomain(url) {
  if (!url) return '';

  try {
    const parsed = new URL(url);
    return parsed.hostname.replace('www.', '');
  } catch {
    return '';
  }
}

/**
 * Génère un ID stable pour déduplication
 * Basé sur l'URL canonique ou un hash du contenu
 *
 * @param {Object} params
 * @param {string} params.canonical_url - URL canonique normalisée
 * @param {string} params.source_url - URL source
 * @param {string} params.title - Titre
 * @param {string} params.source_published_at - Date de publication (optionnel)
 * @returns {string} - ID stable (hash MD5)
 */
export function generateStableId({ canonical_url, source_url, title, source_published_at }) {
  // Priority 1: canonical_url
  if (canonical_url) {
    return crypto.createHash('md5').update(canonical_url).digest('hex');
  }

  // Priority 2: source_url
  if (source_url) {
    return crypto.createHash('md5').update(source_url).digest('hex');
  }

  // Priority 3: hash(domain + normalized_title + published_at)
  const domain = extractDomain(source_url || '');
  const normalizedTitle = (title || '').toLowerCase().trim().replace(/\s+/g, ' ');
  const dateStr = source_published_at ? new Date(source_published_at).toISOString().split('T')[0] : '';

  const composite = `${domain}|${normalizedTitle}|${dateStr}`;
  return crypto.createHash('md5').update(composite).digest('hex');
}

/**
 * Valide qu'une URL est sûre (pas de javascript:, data:, etc.)
 *
 * @param {string} url - URL à valider
 * @returns {boolean}
 */
export function isSafeUrl(url) {
  if (!url || typeof url !== 'string') return false;

  const lower = url.toLowerCase().trim();

  // Reject dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  if (dangerousProtocols.some(p => lower.startsWith(p))) {
    return false;
  }

  // Accept only http(s)
  if (!lower.startsWith('http://') && !lower.startsWith('https://')) {
    return false;
  }

  return true;
}
