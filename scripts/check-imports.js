
import { routes } from '../api/routes.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local', override: false, quiet: true });
dotenv.config({ path: '.env', override: false, quiet: true });

console.log(`Checking ${routes.length} routes for valid imports...`);

let errors = 0;

for (const route of routes) {
    // Convert relative path from api/index.js to root
    const relativePath = './api/' + route.handler.replace(/^\.\//, '');
    const absolutePath = path.resolve(process.cwd(), relativePath);

    if (!fs.existsSync(absolutePath)) {
        console.error(`❌ MISSING FILE: ${route.path} -> ${relativePath}`);
        errors++;
        continue;
    }

    try {
        await import(path.resolve(process.cwd(), relativePath));
        console.log(`✅ OK: ${route.path}`);
    } catch (e) {
        console.error(`❌ IMPORT ERROR: ${route.path} -> ${e.message}`);
        // console.error(e);
        errors++;
    }
}

if (errors > 0) {
    console.error(`\nFAILED: ${errors} routes have errors.`);
    process.exit(1);
} else {
    console.log("\nSUCCESS: All routes import correctly.");
}
