
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { routes } from '../api/routes.js';

// Resolve directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const API_ROOT = path.join(__dirname, '../api');

console.log("🔍 Checking API Route Handlers...");

let errors = 0;

for (const route of routes) {
    if (!route.handler) {
        console.error(`❌ Route ${route.path} has no handler defined.`);
        errors++;
        continue;
    }

    // Handlers are relative to api/routes.js, usually './_handlers/...'
    // api/routes.js is in api/, so we resolve relative to API_ROOT
    const handlerPath = path.resolve(API_ROOT, route.handler);

    if (!fs.existsSync(handlerPath)) {
        console.error(`❌ Handler Not Found: ${route.handler} (for ${route.path})`);
        errors++;
    } else {
        // console.log(`✅ ${route.path} -> ${route.handler}`);
    }
}

if (errors > 0) {
    console.error(`\nFound ${errors} missing handlers.`);
    process.exit(1);
} else {
    console.log("\n✅ All handlers exist.");
    process.exit(0);
}
