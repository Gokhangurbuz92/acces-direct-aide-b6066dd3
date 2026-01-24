
import { fetch } from 'undici';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function verifyRobots() {
    console.log(`Checking Robots.txt on ${BASE_URL}...`);
    try {
        const res = await fetch(`${BASE_URL}/robots.txt`);
        if (res.status !== 200) {
            console.error(`❌ /robots.txt returned ${res.status}`);
            process.exit(1);
        }

        const text = await res.text();

        if (text.includes('Disallow: /') && !text.includes('Disallow: /admin')) {
            console.log('ℹ️ robots.txt is in restricted mode (Non-Prod)');
            if (!text.includes('User-agent: *') || !text.includes('Sitemap:')) {
                console.error(`❌ robots.txt structure invalid in restricted mode`);
                process.exit(1);
            }
        } else {
            const expectedLines = [
                'User-agent: *',
                'Disallow: /admin',
                'Disallow: /pro',
                'Disallow: /__dev',
                'Disallow: /api/admin',
                'Sitemap:'
            ];

            for (const line of expectedLines) {
                if (!text.includes(line)) {
                    console.error(`❌ robots.txt missing expected content: ${line}`);
                    process.exit(1);
                }
            }
        }


        console.log('✅ ROBOTS.TXT CHECK PASSED');
    } catch (e) {
        console.error(`❌ Error fetching robots.txt: ${e.message}`);
        process.exit(1);
    }
}

verifyRobots();
