import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');

console.log("🚀 Triggering Data Ingestion Pipeline (Smart Mode)...");

if (!fs.existsSync(envPath)) {
    console.error("❌ .env.local file not found!");
    process.exit(1);
}

// Read Secret
const content = fs.readFileSync(envPath, 'utf8');
let cronSecret = '';

const match = content.match(/CRON_SECRET=["']?([^"'\n]+)["']?/);
if (match) {
    cronSecret = match[1].trim();
}

if (!cronSecret || cronSecret === '...') {
    console.error("❌ CRON_SECRET not found or invalid in .env.local");
    process.exit(1);
}

// Helper function
async function triggerEndpoint(name, path) {
    const url = `https://www.accesdirectaide.fr/api/${path}?secret=${cronSecret}`;
    console.log(`\n📡 Contacting: ${name} ...`);

    try {
        const response = await fetch(url);
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
