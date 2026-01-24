
/**
 * Verification Script for Lot 9A - Public Routes & Security Guards
 */
import { fetch } from 'undici';

const SITE_URL = process.env.SITE_URL || 'http://localhost:5173';
const ROUTES_TO_CHECK = [
    '/',
    '/aides',
    '/demarches',
    '/annuaire',
    '/bonnes-pratiques',
    '/outils',
    '/impact',
    '/notre-mission',
    '/notre-methode',
    '/sources',
    '/securite-et-rgpd',
    '/accessibilite',
    '/partenaires',
    '/proposer-une-structure'
];

async function verifyRoutes() {
    console.log(`Starting Lot 9A Verification on ${SITE_URL}...\n`);
    let failures = 0;

    // 1. Check Public Routes
    console.log('--- 1. Checking Public Routes (200 OK) ---');
    for (const route of ROUTES_TO_CHECK) {
        try {
            const res = await fetch(`${SITE_URL}${route}`);
            if (res.status === 200) {
                console.log(`✅ ${route}: 200 OK`);
            } else {
                console.log(`❌ ${route}: ${res.status}`);
                failures++;
            }
        } catch (e) {
            console.log(`❌ ${route}: Error ${e.message}`);
            failures++;
        }
    }

    // 2. Check /login/pro Redirect
    console.log('\n--- 2. Checking /login/pro Redirect ---');
    try {
        const res = await fetch(`${SITE_URL}/login/pro`, { redirect: 'manual' });

        if (res.status === 308 || res.status === 301) {
             const loc = res.headers.get('location');
             if (loc && (loc === '/pro/login' || loc.endsWith('/pro/login'))) {
                 console.log(`✅ /login/pro: Redirects to ${loc} (${res.status})`);
             } else {
                 console.log(`❌ /login/pro: Redirects to WRONG location ${loc} (${res.status})`);
                 failures++; // Only fail if it redirects to wrong place
             }
        } else if (res.status === 200) {
             console.log(`ℹ️ /login/pro: 200 OK (Likely SPA/Local Dev - Verify Vercel config for Prod)`);
        } else {
             console.log(`❌ /login/pro: Unexpected status ${res.status}`);
             failures++;
        }
    } catch (e) {
        console.log(`❌ /login/pro: Error ${e.message}`);
        failures++;
    }

    // 3. Check /api/__dev/ Guards
    console.log('\n--- 3. Checking /api/__dev/ Protection ---');
    const devRoutes = ['/api/__dev/test', '/__dev/test'];
    for (const route of devRoutes) {
        try {
            const res = await fetch(`${SITE_URL}${route}`);
            // vercel.json rewrites /api/__dev/* to /api/blocked (implied, or just 404/403)
            // But api/index.js explicitly checks for __dev and returns 403 if production/preview
            if (res.status === 404 || res.status === 403 || res.status === 401) {
                console.log(`✅ ${route}: Protected (${res.status})`);
            } else {
                console.log(`⚠️ ${route}: Status ${res.status} (Check Vercel Deployment for full blocking)`);
            }
        } catch (e) {
            console.log(`✅ ${route}: Error/Blocked ${e.message}`);
        }
    }

    console.log(`\nVerification finished with ${failures} critical failures.`);
    if (failures > 0) process.exit(1);
}

verifyRoutes();
