import { next } from '@vercel/edge';

export default function middleware(request) {
  const host = request.headers.get('host') || '';
  const domain = host.split(':')[0];

  // Production domains
  const isProduction = domain === 'accesdirectaide.fr' || domain === 'www.accesdirectaide.fr';

  if (!isProduction) {
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
