// Rate Limiter: Upstash REST (Primary) + In-Memory Fallback
import crypto from 'crypto';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// 1. Determine Backend Type
// STRICT: Only use REST API (Upstash / Vercel KV)
const envUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const envToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

// Robust check: must have URL starting with https:// and a token
const hasHttpKv = !!(envUrl && envUrl.startsWith('https://') && envToken);
const BACKEND_NAME = hasHttpKv ? "KV_REST_API" : "MEMORY";
const IS_PRODUCTION = process.env.VERCEL_ENV === 'production';

console.log(`[RateLimit] Init: Backend=${BACKEND_NAME} Env=${process.env.VERCEL_ENV}`);

// 2. Initialize Clients
let redisClient = null; // Module-level singleton
const limiterCache = new Map(); // Cache for per-action limiters

if (hasHttpKv) {
    redisClient = new Redis({
        url: envUrl,
        token: envToken,
    });
}

// Fallback in-memory store
const memoryStore = new Map();

const CONFIG = {
    OTP_GEN: { limit: 3, window: 60 },      // 3 per min
    OTP_VERIFY: { limit: 5, window: 60 },   // 5 per min
    BOOK: { limit: 10, window: 3600 },      // 10 per hour
    CONFIRM: { limit: 10, window: 3600 },   // 10 per hour
    // Auth
    LOGIN_PRO: { limit: 5, window: 900 },   // 5 per 15 min
    RESET_PASSWORD: { limit: 3, window: 3600 }, // 3 per hour
    // Search & Taxonomy
    SEARCH_AIDES: { limit: 30, window: 60 },      // 30 per min
    SEARCH_STRUCTURES: { limit: 30, window: 60 }, // 30 per min
    SEARCH_RESSOURCES: { limit: 60, window: 60 }, // 60 per min
    TAXONOMY: { limit: 60, window: 60 }           // 60 per min
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
    // Convert seconds to ms for memory check
    const windowMs = config.window * 1000;

    const record = memoryStore.get(key) || { count: 0, startTime: now };

    if (now - record.startTime > windowMs) {
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

// Internal: Vercel KV / Upstash REST Implementation
async function checkRateLimitKV(action, identifier) {
    const config = CONFIG[action];
    const key = `${action}:${identifier}`;
    const hashedKey = hashKey(key);

    try {
        // Reuse or Create Limiter for this Action
        let actionLimiter = limiterCache.get(action);

        if (!actionLimiter) {
            actionLimiter = new Ratelimit({
                redis: redisClient, // Reuse singleton client
                limiter: Ratelimit.slidingWindow(config.limit, `${config.window} s`),
                analytics: false,
                prefix: "@upstash/ratelimit"
            });
            limiterCache.set(action, actionLimiter);
        }

        const { success, limit, remaining } = await actionLimiter.limit(key);

        if (!success) {
            console.warn(`[AUDIT] Rate Limit Denied: Backend=${BACKEND_NAME} Action=${action} KeyHash=${hashedKey} Remaining=${remaining}`);
            return { allowed: false, error: getErrorObject() };
        }

        return { allowed: true };

    } catch (e) {
        console.error(`[RateLimit] KV REST Error:`, e);

        // P0.4: FAIL-CLOSED in PRODUCTION
        if (IS_PRODUCTION) {
            console.error(`[RateLimit] CRITICAL: Fail-Closed triggered in Production. Blocking request.`);
            return {
                allowed: false,
                error: {
                    error: "Service indisponible",
                    message: "Une vérification de sécurité a échoué. Veuillez réessayer.",
                    code: "RATE_LIMIT_ERROR"
                },
                status: 503
            };
        }

        // Allow fallback in Dev/Preview
        console.warn(`[RateLimit] Falling back to Memory Store (Non-Production)`);
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

    if (hasHttpKv) {
        return checkRateLimitKV(action, identifier);
    } else {
        // P0.4: If KV is missing entirely in PRODUCTION -> Block
        if (IS_PRODUCTION) {
            console.error(`[RateLimit] CRITICAL: KV Credentials missing in Production. Fail-Closed.`);
            return {
                allowed: false,
                error: {
                    error: "Service indisponible",
                    message: "Configuration serveur incomplète.",
                    code: "RATE_LIMIT_CONFIG_ERROR"
                },
                status: 503
            };
        }

        // Fallback for Dev/Preview without credentials
        return checkRateLimitInMemory(action, identifier);
    }
}
