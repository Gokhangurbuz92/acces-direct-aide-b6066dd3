/**
 * generate-sitemap.mjs — Build-time sitemap generation.
 *
 * Runs AFTER vite build + prerender. Produces dist/sitemap.xml.
 *
 * Slug source: Prisma DB (top N published aides with slugs).
 * If DATABASE_URL is not set, generates sitemap with static routes only.
 *
 * Usage: node scripts/generate-sitemap.mjs [--limit N]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, '../dist');

const BASE_URL = 'https://www.accesdirectaide.fr';
const DEFAULT_LIMIT = 50;

// ---------------------------------------------------------------------------
// Parse CLI args
// ---------------------------------------------------------------------------

function parseArgs() {
    const args = process.argv.slice(2);
    let limit = DEFAULT_LIMIT;
    const limitIdx = args.indexOf('--limit');
    if (limitIdx !== -1 && args[limitIdx + 1]) {
        const n = parseInt(args[limitIdx + 1], 10);
        if (Number.isFinite(n) && n > 0) limit = n;
    }
    return { limit };
}

// ---------------------------------------------------------------------------
// Fetch slugs from DB (graceful degradation)
// ---------------------------------------------------------------------------

/**
 * @param {number} limit
 * @returns {Promise<Array<{ slug: string, date_verification: Date | null, updatedAt: Date }>>}
 */
async function fetchSlugsFromDB(limit) {
    try {
        const prismaModule = await import('../api/_utils/prisma.js');
        const prisma = prismaModule.default;

        const aides = await prisma.aide.findMany({
            where: {
                slug: { not: null },
                statut: 'publie',
            },
            select: {
                slug: true,
                date_verification: true,
                updatedAt: true,
            },
            orderBy: [
                { date_verification: 'desc' },
                { updatedAt: 'desc' },
            ],
            take: limit,
        });

        await prisma.$disconnect();
        return aides.filter((a) => a.slug);
    } catch (error) {
        console.warn(`⚠ Cannot connect to DB for slugs: ${error.message}`);
        console.warn('  Sitemap will contain static routes only.');
        return [];
    }
}

// ---------------------------------------------------------------------------
// XML builder
// ---------------------------------------------------------------------------

/**
 * @param {string} loc
 * @param {string} [lastmod]
 * @param {string} [changefreq]
 * @param {string} [priority]
 */
function urlEntry(loc, lastmod, changefreq = 'weekly', priority = '0.5') {
    let xml = `  <url>\n    <loc>${loc}</loc>\n`;
    if (lastmod) xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <changefreq>${changefreq}</changefreq>\n`;
    xml += `    <priority>${priority}</priority>\n`;
    xml += `  </url>`;
    return xml;
}

/**
 * @param {Date | null | undefined} date
 * @param {string} fallback
 */
function toISODate(date, fallback) {
    if (!date) return fallback;
    try {
        return date.toISOString().split('T')[0];
    } catch {
        return fallback;
    }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
    const { limit } = parseArgs();
    const buildDate = new Date().toISOString().split('T')[0];

    console.log(`Generating sitemap (limit=${limit})...`);

    // Static routes
    const entries = [
        urlEntry(`${BASE_URL}/`, buildDate, 'daily', '1.0'),
        urlEntry(`${BASE_URL}/aides`, buildDate, 'daily', '0.9'),
    ];

    // Dynamic aide routes
    const aides = await fetchSlugsFromDB(limit);
    for (const aide of aides) {
        const lastmod = toISODate(aide.date_verification, toISODate(aide.updatedAt, buildDate));
        entries.push(
            urlEntry(`${BASE_URL}/aides/${encodeURIComponent(aide.slug)}`, lastmod, 'weekly', '0.7')
        );
    }

    const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...entries,
        '</urlset>',
        '',
    ].join('\n');

    // Write to dist/
    fs.mkdirSync(distPath, { recursive: true });
    const sitemapPath = path.resolve(distPath, 'sitemap.xml');
    fs.writeFileSync(sitemapPath, xml, 'utf-8');

    console.log(`✓ Sitemap written to ${sitemapPath}`);
    console.log(`  Static routes: 2`);
    console.log(`  Aide routes: ${aides.length}`);
    console.log(`  Total URLs: ${entries.length}`);
}

main().catch((err) => {
    console.error('Sitemap generation failed:', err);
    // Non-fatal: don't kill the build
    process.exit(0);
});
