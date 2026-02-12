import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';
import { config as dotenvConfig, parse as dotenvParse } from 'dotenv';

const isDevRuntime = process.env.NODE_ENV !== 'production' && process.env.VERCEL_ENV !== 'production';

function loadDevEnvFiles() {
    if (!isDevRuntime) return;

    const envLocalPath = path.join(process.cwd(), '.env.local');
    const envPath = path.join(process.cwd(), '.env');
    const envFiles = [envLocalPath, envPath];

    for (const envFile of envFiles) {
        if (fs.existsSync(envFile)) {
            dotenvConfig({ path: envFile, override: false, quiet: true });
        }
    }

    // Vercel dev can preload placeholder DB vars from `.env`.
    // If so, rescue with `.env.local` value without globally forcing override behavior.
    if (!fs.existsSync(envLocalPath)) return;
    const parsedLocal = dotenvParse(fs.readFileSync(envLocalPath, 'utf8'));
    const dbKeys = ['DATABASE_URL', 'POSTGRES_URL_NON_POOLING', 'POSTGRES_PRISMA_URL'];

    for (const key of dbKeys) {
        const currentValue = process.env[key];
        const localValue = parsedLocal[key];
        if (!localValue) continue;
        if (isPlaceholderDbUrl(currentValue) && !isPlaceholderDbUrl(localValue)) {
            process.env[key] = localValue;
            console.info(`[prisma][dev] promoted ${key} from .env.local (placeholder was detected).`);
        }
    }
}

function isPlaceholderDbUrl(raw) {
    if (!raw) return false;
    const normalized = String(raw).toLowerCase();
    if (
        normalized.includes('user:pass@localhost') ||
        normalized.includes('placeholder') ||
        normalized.includes('://user:') ||
        normalized.includes('@host')
    ) {
        return true;
    }
    try {
        const url = new URL(raw);
        const user = decodeURIComponent(url.username || '').toLowerCase();
        const host = (url.hostname || '').toLowerCase();
        const db = (url.pathname || '').replace(/^\//, '').toLowerCase();
        return (
            user === 'user' ||
            user === 'username' ||
            host === 'localhost' ||
            host === 'host' ||
            db === 'acces_direct_aide'
        );
    } catch {
        return false;
    }
}

function parseDbTarget() {
    const candidates = [
        ['DATABASE_URL', process.env.DATABASE_URL],
        ['POSTGRES_PRISMA_URL', process.env.POSTGRES_PRISMA_URL],
        ['POSTGRES_URL_NON_POOLING', process.env.POSTGRES_URL_NON_POOLING],
    ];

    for (const [source, raw] of candidates) {
        if (!raw) continue;
        try {
            const url = new URL(raw);
            return {
                source,
                host: url.hostname || '(missing-host)',
                dbname: url.pathname.replace(/^\//, '') || '(missing-db)',
                user: decodeURIComponent(url.username || '') || '(missing-user)',
            };
        } catch {
            return { source, host: '(invalid-url)', dbname: '(invalid-url)', user: '(invalid-url)' };
        }
    }

    return null;
}

function isPlaceholderConnection(target) {
    if (!target) return false;
    const user = String(target.user || '').toLowerCase();
    const host = String(target.host || '').toLowerCase();
    const db = String(target.dbname || '').toLowerCase();

    return (
        user === 'user' ||
        user === 'username' ||
        host === 'localhost' ||
        host === 'host' ||
        db === 'acces_direct_aide'
    );
}

loadDevEnvFiles();

if (isDevRuntime) {
    const target = parseDbTarget();
    if (target) {
        console.info(
            `[prisma][dev] datasource=${target.source} user=${target.user} host=${target.host} db=${target.dbname}`,
        );
        if (isPlaceholderConnection(target)) {
            console.warn(
                '[prisma][dev] placeholder-like DB target detected. Verify DATABASE_URL/POSTGRES_URL_NON_POOLING in .env.local.',
            );
        }
    } else {
        console.warn('[prisma][dev] no DB URL found in environment variables.');
    }
}

const prismaClientSingleton = () => {
    return new PrismaClient();
};

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prismaGlobal = prisma;
}

export default prisma;
