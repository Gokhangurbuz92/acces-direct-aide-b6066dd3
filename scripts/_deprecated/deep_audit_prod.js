import { chromium } from 'playwright';
import { URL } from 'url';
import fs from 'fs';

const baseUrl = 'https://accesdirectaide.fr';
const maxDepth = 2; // Increase depth if needed, start small for speed
const visited = new Set();
const queue = [{ url: baseUrl, depth: 0 }];

const results = {
    brokenLinks: [],
    pageErrors: [],
    consoleErrors: [],
    networkErrors: [],
    securityHeaders: {}
};

async function checkSecurityHeaders(page) {
    try {
        const response = await page.goto(baseUrl, { waitUntil: 'networkidle' });
        const headers = response.headers();

        results.securityHeaders = {
            'Strict-Transport-Security': headers['strict-transport-security'] || 'MISSING',
            'X-Frame-Options': headers['x-frame-options'] || 'MISSING',
            'X-Content-Type-Options': headers['x-content-type-options'] || 'MISSING',
            'Content-Security-Policy': headers['content-security-policy'] || 'MISSING',
            'Referrer-Policy': headers['referrer-policy'] || 'MISSING'
        };
    } catch (e) {
        console.error("Failed to check headers:", e);
    }
}

async function runAudit() {
    console.log(`🚀 Démarrage de l'Audit Super Hyper Approfondi sur ${baseUrl}...`);
    const browser = await chromium.launch();
    const context = await browser.newContext({
        ignoreHTTPSErrors: true,
        userAgent: 'AccesDirectAide-Audit-Bot/1.0'
    });

    const page = await context.newPage();

    // Listeners
    page.on('pageerror', exception => {
        results.pageErrors.push({ url: page.url(), error: exception.message });
    });

    page.on('console', msg => {
        if (msg.type() === 'error') {
            results.consoleErrors.push({ url: page.url(), text: msg.text() });
        }
    });

    page.on('requestfailed', request => {
        const url = request.url();
        if (url.startsWith(baseUrl)) {
            results.networkErrors.push({ url: page.url(), failedRequest: url, failureText: request.failure()?.errorText });
        }
    });

    // First check headers on main page
    await checkSecurityHeaders(page);

    while (queue.length > 0) {
        const { url, depth } = queue.shift();

        if (visited.has(url)) continue;
        visited.add(url);

        try {
            console.log(`[Depth ${depth}] Audit de: ${url}`);
            const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

            if (!response) {
                results.brokenLinks.push({ url, status: 'No Response' });
                continue;
            }

            if (response.status() >= 400) {
                results.brokenLinks.push({ url, status: response.status() });
            }

            // Collect links if we haven't reached max depth
            if (depth < maxDepth) {
                await page.waitForTimeout(3000); // 3 seconds for React hydration
                const hrefs = await page.$$eval('a', links => links.map(a => a.href));
                console.log(`[Depth ${depth}] Trouvé ${hrefs.length} liens sur ${url}`);

                for (const href of hrefs) {
                    try {
                        const parsed = new URL(href);
                        if (parsed.hostname.includes('accesdirectaide.fr')) {
                            let normalizedHref = parsed.origin + parsed.pathname + parsed.search;
                            normalizedHref = normalizedHref.replace(/\/$/, ""); // remove trailing slash
                            if (!visited.has(normalizedHref) && !queue.find(q => q.url === normalizedHref) && !parsed.hash) {
                                queue.push({ url: normalizedHref, depth: depth + 1 });
                            }
                        }
                    } catch {
                        /* ignore broken urls */
                    }
                }
                console.log(`[Depth ${depth}] Links in queue for next depth: ${queue.length}`);
            }

        } catch (e) {
            console.log(`❌ Erreur en visitant ${url}: ${e.message}`);
            results.brokenLinks.push({ url, error: e.message });
        }
    }

    await browser.close();

    // Deduplicate results
    results.consoleErrors = [...new Set(results.consoleErrors.map(e => JSON.stringify(e)))].map(e => JSON.parse(e));
    results.pageErrors = [...new Set(results.pageErrors.map(e => JSON.stringify(e)))].map(e => JSON.parse(e));
    results.networkErrors = [...new Set(results.networkErrors.map(e => JSON.stringify(e)))].map(e => JSON.parse(e));

    console.log("\n=======================================================");
    console.log("🟢 AUDIT TERMINÉ. Enregistrement des résultats...");
    console.log("=======================================================\n");

    fs.writeFileSync('audit_production_results.json', JSON.stringify(results, null, 2));
}

runAudit().catch(console.error);
