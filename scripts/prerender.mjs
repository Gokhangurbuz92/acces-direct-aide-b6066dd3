/**
 * SSG Prerender — generates static HTML for key routes.
 *
 * Static routes: /, /aides
 * Dynamic routes: top N published aide pages (via Drizzle DB)
 *
 * If DATABASE_URL is not available, only static routes are prerendered.
 * Individual aide page failures are non-fatal (logged and skipped).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig({ path: path.resolve(process.cwd(), '.env.local') });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, '../dist');
const serverOutDir = path.resolve(__dirname, '../dist/server');

const DEFAULT_LIMIT = 50;

// ---------------------------------------------------------------------------
// Fetch top N aide slugs + titles from DB (graceful)
// ---------------------------------------------------------------------------

/**
 * @param {number} limit
 * @returns {Promise<Array<{ slug: string, titre: string }>>}
 */
async function fetchTopAides(limit) {
    try {
        const { db } = await import('../src/db/index.ts');
        const { Aide } = await import('../src/db/schema.ts');
        const { isNotNull, eq, desc } = await import('drizzle-orm');

        const aides = await db.select({ slug: Aide.slug, titre: Aide.titre })
            .from(Aide)
            .where(isNotNull(Aide.slug))
            .where(eq(Aide.statut, 'publie'))
            .orderBy(desc(Aide.date_verification), desc(Aide.updatedAt))
            .limit(limit);

        return aides.filter((a) => a.slug);
    } catch (error) {
        console.warn(`⚠ Cannot connect to DB for aide slugs: ${error.message}`);
        console.warn('  Only static routes will be prerendered.');
        return [];
    }
}

/**
 * Fetch theme x territory combinations for programmatic SEO.
 * @returns {Promise<{ categories: string[], territories: string[] }>}
 */
async function fetchSeoCombinations() {
    try {
        const { db } = await import('../src/db/index.ts');
        const { AidCategory } = await import('../src/db/schema.ts');

        const cats = await db.select({ slug: AidCategory.slug }).from(AidCategory);

        // Key territories for SEO rollout
        const territories = ['paris', 'strasbourg', 'lyon', 'marseille', 'bas-rhin', 'haute-garonne', 'gironde'];

        return { categories: cats.map(c => c.slug).filter(Boolean), territories };
    } catch (error) {
        console.warn(`⚠ Cannot connect to DB for SEO combinations: ${error.message}`);
        return { categories: [], territories: [] };
    }
}

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
// Main
// ---------------------------------------------------------------------------

async function prerender() {
    const { limit } = parseArgs();
    console.log("Starting SSG Prerender...");

    // 1. Build the server bundle
    // logLevel 'silent' prevents chunk-size warnings from flooding Vercel logs
    // (the SSR bundle bundles all node_modules → large chunks are expected)
    await build({
        logLevel: 'silent',
        build: {
            ssr: 'src/entry-server.jsx',
            outDir: 'dist/server',
            emptyOutDir: true,
            chunkSizeWarningLimit: 5000,
        },
        ssr: { noExternal: true },
    });

    // 2. Load the exported render function and seo object
    const serverPath = path.resolve(serverOutDir, 'entry-server.js');
    const { render, seo } = await import(serverPath);

    // 3. Read the client-built index.html as a template
    const templatePath = path.resolve(distPath, 'index.html');
    const template = fs.readFileSync(templatePath, 'utf-8');

    // 4. Static routes first
    const staticRoutes = ['/', '/aides'];

    for (const url of staticRoutes) {
        try {
            console.log(`Prerendering ${url} ...`);
            const html = renderRoute(url, template, render, seo);
            writeHtml(url, await html);
        } catch (e) {
            console.error(`Error prerendering ${url}:`, e);
            process.exit(1);
        }
    }

    // 5. Dynamic aide routes (non-fatal per page)
    const aides = await fetchTopAides(limit);
    let rendered = 0;
    let skipped = 0;

    for (const aide of aides) {
        const url = `/aides/${aide.slug}`;
        try {
            console.log(`Prerendering ${url} ...`);

            // Dynamic SEO for individual aide pages
            const aideSeo = {
                title: `${aide.titre} — AccesDirectAide`,
                description: `Détails de l'aide : ${aide.titre}. Accédez à vos droits simplement.`,
            };

            const html = await renderRoute(url, template, render, seo, aideSeo);
            writeHtml(url, html);
            rendered++;
        } catch (e) {
            console.warn(`⚠ Skipping ${url}: ${e.message || e}`);
            skipped++;
        }
    }

    // 5.1 Programmatic SEO routes
    const { categories, territories } = await fetchSeoCombinations();
    for (const cat of categories) {
        // Theme only
        const urlCat = `/aides/theme/${cat}`;
        console.log(`Prerendering SEO Route ${urlCat} ...`);
        try {
            const html = await renderRoute(urlCat, template, render, seo, {
                title: `Aides : ${cat} | AccesDirectAide`,
                description: `Toutes les aides sociales de la catégorie ${cat}. Trouvez l'accompagnement adapté à vos besoins.`
            });
            writeHtml(urlCat, html);
            rendered++;
        } catch (e) { skipped++; }

        // Theme + Territory
        for (const terr of territories) {
            const urlCatTerr = `/aides/theme/${cat}/${terr}`;
            console.log(`Prerendering SEO Route ${urlCatTerr} ...`);
            try {
                const html = await renderRoute(urlCatTerr, template, render, seo, {
                    title: `Aides ${cat} en ${terr} | AccesDirectAide`,
                    description: `Découvrez toutes les aides ${cat} disponibles en ${terr}. Accédez aux démarches et accompagnements locaux.`
                });
                writeHtml(urlCatTerr, html);
                rendered++;
            } catch (e) { skipped++; }
        }
    }

    // 6. Cleanup the temporary server bundle
    fs.rmSync(serverOutDir, { recursive: true, force: true });

    console.log("SSG Prerender complete.");
    console.log(`  Static: ${staticRoutes.length}`);
    console.log(`  Aides: ${rendered} rendered, ${skipped} skipped`);
    console.log(`  Total: ${staticRoutes.length + rendered}`);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * @param {string} url
 * @param {string} template
 * @param {Function} render
 * @param {Record<string, { title: string, description: string }>} seo
 * @param {{ title: string, description: string }} [overrideSeo]
 * @returns {Promise<string>}
 */
async function renderRoute(url, template, render, seo, overrideSeo) {
    const appHtml = await render(url);

    let html = template.replace(
        '<div id="root"></div>',
        `<div id="root">${appHtml}</div>`
    );

    const routeSeo = overrideSeo || seo[url] || {
        title: "AccesDirectAide",
        description: "Accéder à vos droits simplement."
    };

    html = html.replace(
        /<title>.*?<\/title>/,
        `<title>${escapeHtml(routeSeo.title)}</title>`
    );

    const descTag = `<meta name="description" content="${escapeHtml(routeSeo.description)}" />`;
    if (html.includes('<meta name="description"')) {
        html = html.replace(/<meta\s+name="description"[\s\S]*?>/, descTag);
    } else {
        html = html.replace('</head>', `  ${descTag}\n</head>`);
    }

    return html;
}

/**
 * @param {string} url
 * @param {string} html
 */
function writeHtml(url, html) {
    const isHome = url === '/';
    const outputDir = isHome ? distPath : path.resolve(distPath, url.substring(1));

    if (!isHome) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const filePath = path.resolve(outputDir, 'index.html');
    fs.writeFileSync(filePath, html);
    console.log(`✓ Prerendered ${filePath}`);
}

/**
 * @param {string} str
 */
function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

prerender();
