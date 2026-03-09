/* global document */
import { chromium } from 'playwright';

const routes = ['/pro/disponibilites'];

async function run() {
    console.log('Lancement du navigateur (Playwright)...');
    const browser = await chromium.launch({ headless: true });

    // Catch errors

    for (const route of routes) {
        const page = await browser.newPage();
        page.on('pageerror', err => {
            console.error('\n❌ ERREUR BROWSER:', err.message);
        });
        const url = `http://localhost:5173${route}`;
        process.stdout.write(`Test: ${url} ... `);
        try {
            const response = await page.goto(url, { waitUntil: 'load', timeout: 8000 });
            // wait a sec for react
            await page.waitForTimeout(2000);
            const status = response.status();

            const rootContent = await page.evaluate(() => {
                const root = document.getElementById('root');
                return root ? root.innerHTML.trim() : null;
            });

            if (rootContent === null) {
                console.log(`❌ ÉCHEC: #root introuvable`);
            } else if (rootContent.length === 0 || rootContent === '<main></main>' || rootContent === '<!--$?--><template id="B:0"></template><!--/$-->') {
                console.log(`❌ ÉCHEC: Page blanche / crash React (#root content length = ${rootContent.length})`);
            } else {
                console.log(`✅ SUCCÈS (HTTP ${status}, len: ${rootContent.length})`);
                if (rootContent.length < 1000) {
                    console.log('CONTENU SHORT: ', rootContent);
                }
            }
        } catch (e) {
            console.log(`❌ ERREUR: ${e.message}`);
        }
    }

    await browser.close();
    process.exit(0);
}

run();
