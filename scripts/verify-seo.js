import { fetch } from 'undici';

const BASE_URL = process.argv[2] || process.env.VITE_SITE_URL || 'http://localhost:5173';

async function checkUrl(path, expectedStatus = 200) {
    try {
        const res = await fetch(`${BASE_URL}${path}`);
        if (res.status !== expectedStatus) {
            console.error(`[FAIL] ${path} returned ${res.status}, expected ${expectedStatus}`);
            return false;
        }
        console.log(`[PASS] ${path} returned ${res.status}`);
        return true;
    } catch (err) {
        console.error(`[FAIL] Could not fetch ${path}: ${err.message}`);
        return false;
    }
}

async function verifySeo() {
    console.log(`Target: ${BASE_URL}`);

    let passed = true;
    const paths = [
        '/',
        '/aides',
        '/demarches',
        '/annuaire',
        '/bonnes-pratiques',
        '/outils',
        '/contact',
        '/mentionslegales'
    ];

    for (const p of paths) {
        if (!await checkUrl(p)) passed = false;
    }

    // Check Sitemap/Robots if API is running (might fail in pure static dev without backend)
    // assuming dev server proxies /api
    if (!await checkUrl('/api/sitemap', 200)) console.warn('[WARN] Sitemap check failed (might require backend running)');
    if (!await checkUrl('/api/robots', 200)) console.warn('[WARN] Robots.txt check failed');

    if (passed) {
        console.log('SEO Verification PASSED (Basic reachability)');
        // In a real script we would parse HTML for meta tags
    } else {
        console.log('SEO Verification FAILED');
        process.exit(1);
    }
}

verifySeo();
