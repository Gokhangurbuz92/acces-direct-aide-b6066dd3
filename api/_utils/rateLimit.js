// Rate Limiter: Hybrid (KV Redis + Standard Redis + In-Memory Fallback)
import crypto from 'crypto';
import { createClient as createVercelClient } from '@vercel/kv';
import { createClient as createRedisClient } from 'redis';

// 1. Determine Backend Type
const envUrl = process.env.KV_REST_API_URL || process.env.STORAGE_REST_API_URL;
const envToken = process.env.KV_REST_API_TOKEN || process.env.STORAGE_REST_API_TOKEN;
const envRedisUrl = process.env.REDIS_URL;

const hasHttpKv = !!(envUrl && envToken);
const hasRedisUrl = !!envRedisUrl && !hasHttpKv;

const USE_KV = hasHttpKv || hasRedisUrl;
const BACKEND_NAME = hasHttpKv ? "KV_HTTP" : (hasRedisUrl ? "KV_REDIS_URL" : "MEMORY_FALLBACK");

console.log(`[RateLimit] Init: Backend=${BACKEND_NAME}`);

// 2. Initialize Clients
let kvClient = null;
let redisClient = null;

if (hasHttpKv) {
    kvClient = createVercelClient({
        url: envUrl,
        token: envToken
    });
} else if (hasRedisUrl) {
    // Standard Redis Client (lazy connection handled in wrapper)
    redisClient = createRedisClient({ url: envRedisUrl });
    redisClient.on('error', err => console.error('[RateLimit] Redis Client Error', err));
}

// Fallback in-memory store
const memoryStore = new Map();

const CONFIG = {
    OTP_GEN: { limit: 3, window: 60 * 1000 },    // 3 per min
    OTP_VERIFY: { limit: 5, window: 60 * 1000 }, // 5 per min
    BOOK: { limit: 10, window: 60 * 60 * 1000 }, // 10 per hour
    CONFIRM: { limit: 10, window: 60 * 60 * 1000 }, // 10 per hour
    // Search & Taxonomy
    SEARCH_AIDES: { limit: 30, window: 60 * 1000 },      // 30 per min
    SEARCH_STRUCTURES: { limit: 30, window: 60 * 1000 }, // 30 per min
    TAXONOMY: { limit: 60, window: 60 * 1000 }           // 60 per min
};

function hashKey(key) {
    return crypto.createHash('sha256').update(key).digest('hex').substring(0, 8);
}

// Internal: In-Memory Implementation
function checkRateLimitInMemory(action, identifier) {
    const config = CONFIG[action];
    const now = Date.now();
    const key = `${action}:${identifier}`;
    const hashedKey = hashKey(key);

    const record = memoryStore.get(key) || { count: 0, startTime: now };

    if (now - record.startTime > config.window) {
        record.count = 0;
        record.startTime = now;
    }

    record.count++;
    memoryStore.set(key, record);

    if (record.count > config.limit) {
        console.warn(`[AUDIT] Rate Limit Denied: Backend=${BACKEND_NAME} Action=${action} KeyHash=${hashedKey} Count=${record.count}`);
        return { allowed: false, error: getErrorObject() };
    }
    return { allowed: true };
}

// Internal: Vercel KV / Redis Implementation
async function checkRateLimitKV(action, identifier) {
    const config = CONFIG[action];
    const key = `ratelimit:${action}:${identifier}`;
    const hashedKey = hashKey(key);

    try {
        let count;

        if (hasHttpKv) {
            // Vercel KV (HTTP)
            count = await kvClient.incr(key);
            if (count === 1) {
                await kvClient.expire(key, Math.floor(config.window / 1000));
            }
        } else if (hasRedisUrl) {
            // Standard Redis (TCP)
            if (!redisClient.isOpen) await redisClient.connect();

            count = await redisClient.incr(key);
            if (count === 1) {
                await redisClient.expire(key, Math.floor(config.window / 1000));
            }
        }

        if (count > config.limit) {
            console.warn(`[AUDIT] Rate Limit Denied: Backend=${BACKEND_NAME} Action=${action} KeyHash=${hashedKey} Count=${count}`);
            return { allowed: false, error: getErrorObject() };
        }
        return { allowed: true };
    } catch (e) {
        console.error(`[RateLimit] KV/Redis Error (Switching to Memory):`, e);
        return checkRateLimitInMemory(action, identifier);
    }
}

export function getClientIp(req) {
    const xForwardedFor = req.headers['x-forwarded-for'];
    if (xForwardedFor) {
        // x-forwarded-for: client, proxy1, proxy2
        return xForwardedFor.split(',')[0].trim();
    }
    return req.socket?.remoteAddress || '127.0.0.1';
}

function getErrorObject() {
    return {
        error: "Trop de tentatives.",
        message: "Veuillez patienter quelques minutes avant de réessayer.", // FALC
        code: "RATE_LIMITED"
    };
}

export async function checkRateLimit(action, identifier) {
    const config = CONFIG[action];
    if (!config) throw new Error(`Unknown action: ${action}`);

    if (USE_KV) {
        return checkRateLimitKV(action, identifier);
    } else {
        return checkRateLimitInMemory(action, identifier);
    }
}
