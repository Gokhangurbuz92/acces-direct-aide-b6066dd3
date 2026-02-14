import dotenv from 'dotenv';
import { env } from '../api/_utils/env.js';

dotenv.config({ path: '.env.local', override: false, quiet: true });
dotenv.config({ path: '.env', override: false, quiet: true });

console.log("🚀 Triggering Data Ingestion Pipeline (Smart Mode)...");

const baseUrl = env.runtime.publicBaseUrl || 'https://www.accesdirectaide.fr';
const cronSecret = env.secrets.cronSecret;

if (!cronSecret || cronSecret === '...') {
    console.error("❌ CRON_SECRET not found or invalid in environment.");
    process.exit(1);
}

// Helper function
async function triggerEndpoint(name, path) {
    const url = `${baseUrl}/api/${path}`;
    console.log(`\n📡 Contacting: ${name} ...`);

    try {
        const response = await fetch(url, {
            headers: {
                'x-cron-secret': cronSecret
            }
        });
        const text = await response.text();

        if (response.ok) {
            console.log(`✅ ${name}: SUCCESS`);
            try {
                const json = JSON.parse(text);
                console.log("Stats:", JSON.stringify(json, null, 2));
            } catch {
                console.log("Response:", text.substring(0, 100));
            }
        } else {
            console.error(`❌ ${name}: FAILED (${response.status})`);
            console.error("Error:", text);
        }
    } catch (error) {
        console.error(`❌ ${name}: Network Error`, error.message);
    }
}

// Execution Flow
async function run() {
    // 1. Ingest Structures first (Heaviest part)
    // This reduces the load on the main pipeline
    await triggerEndpoint("STEP 1: Structures", "cron/ingest-structures");

    // 2. Run Main Pipeline (Aids + RSS)
    // Since structures are done, this should skip them and have time for RSS
    await triggerEndpoint("STEP 2: Full Pipeline (Aids + RSS)", "cron/pipeline");
}

run();
