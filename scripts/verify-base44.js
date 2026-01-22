import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const FORBIDDEN_STRINGS = ['@base44/sdk', 'import { Base44 }', 'Base44.'];
const IGNORE_DIRS = ['.git', 'node_modules', '.next', 'dist', 'scripts', 'docs']; // scripts and docs ignored
const IGNORE_FILES = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'instructions_staging.md', 'README.md'];

function scanDir(dir) {
    const files = fs.readdirSync(dir);
    let found = false;

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (!IGNORE_DIRS.includes(file)) {
                if (scanDir(fullPath)) found = true;
            }
        } else {
            if (IGNORE_FILES.includes(file)) continue;

            const content = fs.readFileSync(fullPath, 'utf-8');
            for (const str of FORBIDDEN_STRINGS) {
                if (content.includes(str)) {
                    console.error(`[FAIL] Found "${str}" in ${fullPath}`);
                    found = true;
                }
            }
        }
    }
    return found;
}

console.log('Scanning for Base44 leftovers...');
const hasErrors = scanDir(rootDir);

if (hasErrors) {
    console.log('VERIFICATION FAILED: Base44 artifacts found.');
    process.exit(1);
} else {
    console.log('VERIFICATION PASSED: No Base44 artifacts found.');
    process.exit(0);
}
