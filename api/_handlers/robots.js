
export default async function handler(req, res) {
    const baseUrl = 'https://accesdirectaide.fr';
    const txt = `User-agent: *
Disallow: /admin
Disallow: /pro
Disallow: /__dev
Disallow: /api/admin

Sitemap: ${baseUrl}/sitemap.xml
`;
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=3600');
    res.status(200).send(txt);
}
