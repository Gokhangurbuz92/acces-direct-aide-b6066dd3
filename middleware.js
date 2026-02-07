import { next } from '@vercel/edge';

export default function middleware(request) {
  const host = request.headers.get('host') || '';
  const domain = host.split(':')[0];
  const url = new URL(request.url);

  // Define Canonical Domains
  const isCanonical = domain === 'accesdirectaide.fr' || domain === 'www.accesdirectaide.fr';
  const isProductionEnv = process.env.VERCEL_ENV === 'production';

  // P0.6: Enforce Canonical in Production
  // If we are in the Production Environment, but accessing via a non-canonical domain (e.g. .vercel.app),
  // we must redirect to the canonical domain to avoid duplicate content penalties.
  if (isProductionEnv && !isCanonical) {
    url.hostname = 'www.accesdirectaide.fr';
    url.port = ''; // Clear port if any
    url.protocol = 'https'; // Force HTTPS
    return Response.redirect(url.toString(), 301);
  }

  // Prevent Indexing on Non-Production Domains (Previews, Staging, Localhost)
  // If we are NOT in the strict production environment, we discourage indexing.
  if (!isProductionEnv) {
    return next({
      headers: {
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  }

  return next();
}

export const config = {
  matcher: [
    '/((?!api/|assets/|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
