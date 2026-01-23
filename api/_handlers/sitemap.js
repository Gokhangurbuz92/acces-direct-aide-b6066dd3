/* eslint-disable no-undef */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Determine BASE_URL dynamically
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const BASE_URL = host ? `${protocol}://${host}` : (process.env.PUBLIC_BASE_URL || 'https://www.accesdirectaide.fr');

    try {
        // Fetch published content
        const [aides, demarches, structures, guides, tools, actualites] = await Promise.all([
            prisma.aide.findMany({ where: { statut: 'publie' }, select: { slug: true, updatedAt: true } }),
            prisma.demarche.findMany({ where: { statut: 'publie' }, select: { slug: true, updatedAt: true } }),
            prisma.structure.findMany({ where: { statut: 'publie' }, select: { slug: true, updatedAt: true } }),
            prisma.guide.findMany({ where: { statut: 'publie' }, select: { slug: true, updatedAt: true } }),
            prisma.toolboxItem.findMany({ where: { statut: 'publie' }, select: { slug: true, updatedAt: true } }),
            prisma.actualite.findMany({ where: { statut: 'publie' }, select: { slug: true, updatedAt: true } })
        ]);

        // Static pages
        const staticPages = [
            { loc: '/', priority: '1.0' },
            { loc: '/aides', priority: '0.9' },
            { loc: '/demarches', priority: '0.9' },
            { loc: '/annuaire', priority: '0.9' },
            { loc: '/bonnes-pratiques', priority: '0.8' },
            { loc: '/outils', priority: '0.8' },
            { loc: '/actualites', priority: '0.7' },
            { loc: '/impact', priority: '0.8' },
            { loc: '/notre-mission', priority: '0.8' },
            { loc: '/notre-methode', priority: '0.7' },
            { loc: '/sources', priority: '0.7' },
            { loc: '/securite-et-rgpd', priority: '0.7' },
            { loc: '/accessibilite', priority: '0.7' },
            { loc: '/partenaires', priority: '0.8' },
            { loc: '/proposer-une-structure', priority: '0.6' },
            { loc: '/apropos', priority: '0.5' },
            { loc: '/contact', priority: '0.6' },
            { loc: '/mentionslegales', priority: '0.3' },
            { loc: '/confidentialite', priority: '0.3' }
        ];

        // Build URL entries
        let urls = staticPages.map(p =>
            `  <url><loc>${BASE_URL}${p.loc}</loc><priority>${p.priority}</priority></url>`
        );

        // Add dynamic content
        aides.filter(a => a.slug).forEach(a => {
            urls.push(`  <url><loc>${BASE_URL}/aide/${a.slug}</loc><lastmod>${a.updatedAt.toISOString().split('T')[0]}</lastmod><priority>0.7</priority></url>`);
        });

        demarches.filter(d => d.slug).forEach(d => {
            urls.push(`  <url><loc>${BASE_URL}/demarche/${d.slug}</loc><lastmod>${d.updatedAt.toISOString().split('T')[0]}</lastmod><priority>0.7</priority></url>`);
        });

        structures.filter(s => s.slug).forEach(s => {
            urls.push(`  <url><loc>${BASE_URL}/structure/${s.slug}</loc><lastmod>${s.updatedAt.toISOString().split('T')[0]}</lastmod><priority>0.6</priority></url>`);
        });

        guides.filter(g => g.slug).forEach(g => {
            urls.push(`  <url><loc>${BASE_URL}/bonnes-pratiques/${g.slug}</loc><lastmod>${g.updatedAt.toISOString().split('T')[0]}</lastmod><priority>0.6</priority></url>`);
        });

        tools.filter(t => t.slug).forEach(t => {
            urls.push(`  <url><loc>${BASE_URL}/outils/${t.slug}</loc><lastmod>${t.updatedAt.toISOString().split('T')[0]}</lastmod><priority>0.6</priority></url>`);
        });

        actualites.filter(a => a.slug).forEach(a => {
            urls.push(`  <url><loc>${BASE_URL}/actualites/${a.slug}</loc><lastmod>${a.updatedAt.toISOString().split('T')[0]}</lastmod><priority>0.5</priority></url>`);
        });

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Cache-Control', 'no-store'); // TEMPORARY: Force regeneration to verify fix
        res.writeHead(200);
        res.end(xml);

    } catch (e) {
        console.error('Sitemap error:', e);
        res.status(500).json({ error: 'Failed to generate sitemap' });
    }
}
