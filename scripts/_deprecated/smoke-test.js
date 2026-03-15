/**
 * smoke-test.js
 *
 * Post-deployment health check for ADA.
 * Tests critical endpoints and reports results with colored output.
 *
 * Usage:
 *   PROD_URL=https://ada.vercel.app node scripts/smoke-test.js
 *   node scripts/smoke-test.js  (defaults to http://localhost:3000)
 */

const API_URL = (process.env.VITE_APP_URL || process.env.PROD_URL || 'http://localhost:3000').replace(/\/$/, '');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

let passed = 0;
let failed = 0;

async function checkEndpoint(name, url, { expectJson = true } = {}) {
    const start = Date.now();
    try {
        const res = await fetch(url, {
            signal: AbortSignal.timeout(10_000),
            headers: { 'User-Agent': 'ADA-SmokeTest/1.0' },
        });
        const duration = Date.now() - start;

        if (res.status >= 400) {
            console.log(`  ${RED}✗${RESET} ${name} ${DIM}(${res.status}, ${duration}ms)${RESET}`);
            failed++;
            return null;
        }

        let data = null;
        if (expectJson) {
            try { data = await res.json(); } catch { /* not json */ }
        }

        const itemCount = data
            ? (Array.isArray(data?.items) ? data.items.length : (Array.isArray(data) ? data.length : ''))
            : '';
        const extra = itemCount !== '' ? `, ${itemCount} items` : '';

        console.log(`  ${GREEN}✓${RESET} ${name} ${DIM}(${res.status}, ${duration}ms${extra})${RESET}`);
        passed++;
        return data;
    } catch (e) {
        const duration = Date.now() - start;
        console.log(`  ${RED}✗${RESET} ${name} ${DIM}(${e.message}, ${duration}ms)${RESET}`);
        failed++;
        return null;
    }
}

async function run() {
    console.log(`\n🔍 Smoke Tests — ${API_URL}\n`);

    // --- Core health ---
    await checkEndpoint('Homepage (SPA)', `${API_URL}/`, { expectJson: false });
    await checkEndpoint('Health Check', `${API_URL}/api/health`);

    // --- Public API endpoints ---
    const aides = await checkEndpoint('Aides List', `${API_URL}/api/aides`);
    if (aides?.items?.[0]) {
        const first = aides.items[0];
        const detailUrl = first.slug
            ? `${API_URL}/api/aides?slug=${first.slug}`
            : `${API_URL}/api/aides?id=${first.id}`;
        await checkEndpoint('Aide Detail', detailUrl);
    }

    const structures = await checkEndpoint('Structures List', `${API_URL}/api/structures`);
    if (structures?.items?.[0]) {
        const first = structures.items[0];
        const detailUrl = first.slug
            ? `${API_URL}/api/structures?slug=${first.slug}`
            : `${API_URL}/api/structures?id=${first.id}`;
        await checkEndpoint('Structure Detail', detailUrl);
    }

    const news = await checkEndpoint('Actualites List', `${API_URL}/api/actualites`);
    const newsItems = Array.isArray(news) ? news : news?.items;
    if (newsItems?.[0]) {
        const first = newsItems[0];
        const detailUrl = first.slug
            ? `${API_URL}/api/actualites?slug=${first.slug}`
            : `${API_URL}/api/actualites?id=${first.id}`;
        await checkEndpoint('Actualite Detail', detailUrl);
    }

    const demarches = await checkEndpoint('Demarches List', `${API_URL}/api/demarches`);
    if (demarches?.items?.[0]) {
        const first = demarches.items[0];
        const detailUrl = first.slug
            ? `${API_URL}/api/demarches?slug=${first.slug}`
            : `${API_URL}/api/demarches?id=${first.id}`;
        await checkEndpoint('Demarche Detail', detailUrl);
    }

    // --- Results ---
    console.log(`\n  ${GREEN}${passed} passed${RESET}, ${failed > 0 ? RED : DIM}${failed} failed${RESET}\n`);
    process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => {
    console.error('Smoke test runner failed:', e);
    process.exit(1);
});

