import { next } from '@vercel/edge';

export default function middleware(request) {
  const host = request.headers.get('host') || '';
  const domain = host.split(':')[0]; // Remove port if present

  // --- PRODUCTION DOMAIN ENFORCEMENT ---
  // Only apply canonical redirect in production environments
  const isProductionDomain =
    domain === 'accesdirectaide.fr' ||
    domain === 'www.accesdirectaide.fr';

  if (isProductionDomain) {
    // Redirect apex to www (canonical)
    if (domain === 'accesdirectaide.fr') {
      const canonicalUrl = new URL(request.url);
      canonicalUrl.host = 'www.accesdirectaide.fr';

      return Response.redirect(canonicalUrl.toString(), 308);
    }

    // www domain: allow through (production = indexable)
    return next();
  }

  // --- NON-PRODUCTION (PREVIEW / STAGING) ---
  // Apply noindex to prevent search engine indexing
  return next({
    headers: {
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

export const config = {
  matcher: [
    '/((?!api/|assets/|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
