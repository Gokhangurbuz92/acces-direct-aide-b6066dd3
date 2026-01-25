import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildInfoPath = path.resolve(__dirname, '../api/_utils/build-info.js');

// Ensure directory exists
const buildInfoDir = path.dirname(buildInfoPath);
if (!fs.existsSync(buildInfoDir)) {
    fs.mkdirSync(buildInfoDir, { recursive: true });
}

// Generate default build info if not present or just overwrite to ensure existence
const buildTime = new Date().toISOString();
const content = `export const buildTime = "${buildTime}";\n`;

try {
    fs.writeFileSync(buildInfoPath, content);
    console.log(`[Setup] Generated build info at ${buildInfoPath}`);
} catch (e) {
    console.error(`[Setup] Failed to generate build info: ${e.message}`);
    process.exit(1);
}
