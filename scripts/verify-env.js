import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(process.cwd(), '.env.local');

console.log("🔍 Checking .env.local configuration...\n");

if (!fs.existsSync(envPath)) {
    console.error("❌ .env.local file not found!");
    process.exit(1);
}

const content = fs.readFileSync(envPath, 'utf8');
const envVars = {};

// Parse file manually to avoid dependencies
content.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        let key = match[1].trim();
        let value = match[2].trim();
        // Remove quotes if present
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
        }
        envVars[key] = value;
    }
});

const REQUIRED_KEYS = [
    { key: 'DATABASE_URL', type: 'url', prefix: 'postgres://' },
    { key: 'CRON_SECRET', type: 'string' },
    // ADMIN_TOKEN is used for admin auth
    { key: 'ADMIN_TOKEN', type: 'string' },
    // ENCRYPTION_KEY important for storage
    { key: 'ENCRYPTION_KEY', type: 'string' }
];

let hasError = false;

REQUIRED_KEYS.forEach(({ key, type, prefix }) => {
    const value = envVars[key];

    if (!value || value === '...') {
        console.log(`❌ ${key}: MISSING or Placeholder '...'`);
        hasError = true;
        return;
    }

    if (type === 'url') {
        if (!value.startsWith('postgres://') && !value.startsWith('postgresql://')) {
            console.log(`❌ ${key}: Invalid Format (Must start with postgres:// or postgresql://)`);
            hasError = true;
            return;
        }
    }

    // Masked output for success
    const masked = value.substring(0, 4) + '...';
    console.log(`✅ ${key}: Found (${masked})`);
});

if (hasError) {
    console.log("\n⚠️  Some variables are missing or invalid placeholders. Please correct them.");
    process.exit(1);
} else {
    console.log("\n🎉 All critical variables look correct!");
}
