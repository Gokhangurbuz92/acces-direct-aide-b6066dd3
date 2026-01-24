import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const vercelConfigPath = path.resolve(__dirname, '../vercel.json');

if (!fs.existsSync(vercelConfigPath)) {
    console.error('vercel.json not found');
    process.exit(1);
}

const config = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));

const release = process.env.VERCEL_GIT_COMMIT_SHA || process.env.VITE_GIT_COMMIT_SHA || 'dev';
const env = process.env.VERCEL_ENV || process.env.VITE_ENV || 'development';

if (!config.headers) {
    config.headers = [];
}

let globalHeaders = config.headers.find(h => h.source === '/(.*)');
if (!globalHeaders) {
    globalHeaders = {
        source: '/(.*)',
        headers: []
    };
    config.headers.push(globalHeaders);
}

if (!globalHeaders.headers) {
    globalHeaders.headers = [];
}

// Remove existing headers if present to avoid duplicates
globalHeaders.headers = globalHeaders.headers.filter(h => h.key !== 'x-release-sha' && h.key !== 'x-deploy-env');

globalHeaders.headers.push({
    key: 'x-release-sha',
    value: release
});

globalHeaders.headers.push({
    key: 'x-deploy-env',
    value: env
});

fs.writeFileSync(vercelConfigPath, JSON.stringify(config, null, 4));
console.log(`Injected headers into vercel.json: x-release-sha=${release}, x-deploy-env=${env}`);

// Generate build info
const buildTime = new Date().toISOString();
const buildInfoPath = path.resolve(__dirname, '../api/_utils/build-info.js');

// Ensure directory exists
const buildInfoDir = path.dirname(buildInfoPath);
if (!fs.existsSync(buildInfoDir)) {
    fs.mkdirSync(buildInfoDir, { recursive: true });
}

fs.writeFileSync(buildInfoPath, `export const buildTime = "${buildTime}";\n`);
console.log(`Generated build info at ${buildInfoPath}`);
