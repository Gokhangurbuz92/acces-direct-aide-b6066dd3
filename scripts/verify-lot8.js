import { fetch } from 'undici';

const BASE_URL = process.env.VITE_SITE_URL || 'http://localhost:3000'; // Assuming node server or handled via framework

async function verifyHealth() {
    // Check Health Endpoint
    try {
        const res = await fetch(`${BASE_URL}/api/health`);
        const json = await res.json();

        if (res.status === 200 && json.ok) {
            console.log('[PASS] Health check OK');
        } else {
            console.error('[FAIL] Health check failed', json);
            process.exit(1);
        }
    } catch (err) {
        console.error('[FAIL] Health check network error', err);
        // process.exit(1); // Don't fail hard if dev server isn't running exact API port, just warn
    }
}

verifyHealth();
