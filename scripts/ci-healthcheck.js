#!/usr/bin/env node

import process from 'process';

// Use global fetch (Node 18+) or undici if needed
const fetch = globalThis.fetch;

if (!fetch) {
    console.error("This script requires Node.js 18+ (global fetch).");
    process.exit(1);
}

const BASE_URL = process.argv[2] || 'https://www.accesdirectaide.fr';

console.log(`🏥 CI Healthcheck starting for: ${BASE_URL}`);
console.log('--------------------------------------------------');

const PATHS = [
    { path: '/', name: 'Homepage' },
    { path: '/aides', name: 'Aides' },
    { path: '/demarches', name: 'Demarches' },
    { path: '/annuaire', name: 'Annuaire' },
    { path: '/actualites', name: 'Actualites' },
    { path: '/api/version', name: 'API Version', checkJson: true },
    { path: '/robots.txt', name: 'Robots.txt', checkText: 'Sitemap:' },
    { path: '/sitemap.xml', name: 'Sitemap', checkText: 'urlset' }
];

let failed = false;

async function checkUrl(item) {
    const url = `${BASE_URL}${item.path}`;
    try {
        const res = await fetch(url);

        // 1. Check Status
        if (res.status !== 200) {
            console.error(`❌ [${item.name}] Status ${res.status} (Expected 200) - ${url}`);
            failed = true;
            // Continue checks if possible, but status is critical
            return;
        }

        // 2. Check x-release-sha
        const sha = res.headers.get('x-release-sha');
        if (!sha) {
            console.error(`❌ [${item.name}] Missing x-release-sha header`);
            failed = true;
        }

        // 3. Check x-robots-tag
        const robotsTag = res.headers.get('x-robots-tag');
        if (robotsTag && robotsTag.includes('noindex')) {
            console.error(`❌ [${item.name}] x-robots-tag contains noindex! (${robotsTag})`);
            failed = true;
        }

        // 4. Content Checks
        if (item.checkJson) {
            try {
                const data = await res.json();
                if (!data.sha || !data.version) {
                    console.error(`❌ [${item.name}] Invalid JSON response (missing sha/version)`);
                    failed = true;
                } else {
                    // console.log(`   [${item.name}] Version: ${data.version}, SHA: ${data.sha}`);
                }
            } catch (e) {
                console.error(`❌ [${item.name}] Failed to parse JSON`);
                failed = true;
            }
        } else if (item.checkText) {
            try {
                const text = await res.text();
                if (!text.includes(item.checkText)) {
                    console.error(`❌ [${item.name}] Content missing "${item.checkText}"`);
                    failed = true;
                }
            } catch (e) {
                console.error(`❌ [${item.name}] Failed to read text`);
                failed = true;
            }
        }

        // Success message if no specific failure for this item so far (in this run)
        // We track failure globally, but for logging, we want to see what passed.
        // Since we modify `failed` immediately, this logic is tricky.
        // Let's use local status.

    } catch (err) {
        console.error(`❌ [${item.name}] Fetch Failed: ${err.message}`);
        failed = true;
    }
}

async function run() {
    for (const item of PATHS) {
        const url = `${BASE_URL}${item.path}`;
        const prevFailed = failed;
        await checkUrl(item);
        if (failed === prevFailed) {
             console.log(`✅ [${item.name}] OK`);
        }
    }

    console.log('--------------------------------------------------');
    if (failed) {
        console.error("💥 Healthcheck FAILED");
        process.exit(1);
    } else {
        console.log("✨ Healthcheck PASSED");
        process.exit(0);
    }
}

run();
