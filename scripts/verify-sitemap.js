
import { fetch } from 'undici';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function verifySitemap() {
    console.log(`Checking Sitemap on ${BASE_URL}...`);
    try {
        const res = await fetch(`${BASE_URL}/sitemap.xml`);
        if (res.status !== 200) {
            console.error(`❌ /sitemap.xml returned ${res.status}`);
            process.exit(1);
        }

        const xml = await res.text();
        if (!xml.includes('<?xml') || !xml.includes('<urlset')) {
            console.error('❌ /sitemap.xml is not valid XML sitemap');
            process.exit(1);
        }

        const requiredPaths = [
            '/notre-mission',
            '/notre-methode',
            '/sources',
            '/securite-et-rgpd',
            '/accessibilite',
            '/impact',
            '/partenaires',
            '/proposer-une-structure',
            '/aides',
            '/demarches',
            '/annuaire',
            '/bonnes-pratiques',
            '/outils'
        ];

        for (const path of requiredPaths) {
            if (!xml.includes(`<loc>https://www.accesdirectaide.fr${path}</loc>`) && !xml.includes(`<loc>${BASE_URL}${path}</loc>`)) {
                console.error(`❌ Sitemap missing required path: ${path}`);
                process.exit(1);
            }
        }

        const forbiddenPatterns = ['/admin', '/pro', '/__dev', '/api'];
        for (const pattern of forbiddenPatterns) {
            if (xml.includes(pattern)) {
                console.error(`❌ Sitemap contains forbidden pattern: ${pattern}`);
                process.exit(1);
            }
        }

        console.log('✅ SITEMAP CHECK PASSED');
    } catch (e) {
        console.error(`❌ Error fetching sitemap: ${e.message}`);
        process.exit(1);
    }
}

verifySitemap();
