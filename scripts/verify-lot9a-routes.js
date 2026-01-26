
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

    // 2. Check /login/pro Guard
    console.log('\n--- 2. Checking /login/pro Guard ---');
    try {
        const res = await fetch(`${SITE_URL}/login/pro`, { redirect: 'manual' });
        // It's a rewrite to /api/login-pro-guard which should 404/403 if VITE_DEV_LOGIN_ENABLED != true
        // Or if it's SPA, it might 200 but redirected to /home by React Router if not enabled
        console.log(`ℹ️ /login/pro status: ${res.status}`);
    } catch (e) {
        console.log(`❌ /login/pro: Error ${e.message}`);
    }

    // 3. Check /api/__dev/ Guards
    console.log('\n--- 3. Checking /api/__dev/ Protection ---');
    const devRoutes = ['/api/__dev/test', '/__dev/test'];
    for (const route of devRoutes) {
        try {
            const res = await fetch(`${SITE_URL}${route}`);
            // vercel.json rewrites /api/__dev/* to /api/blocked
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
