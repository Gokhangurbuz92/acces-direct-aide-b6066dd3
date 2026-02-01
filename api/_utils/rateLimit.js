// Rate Limiter: Upstash REST (Fail-Closed Security Model)
import crypto from 'crypto';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Alert function for critical KV failures
function sendAlert(alertData) {
    // Log structured alert data for monitoring systems to consume
    console.error('[ALERT_WEBHOOK]', JSON.stringify({
        severity: 'CRITICAL',
        service: 'rate-limiter',
        event: 'kv_failure',
        ...alertData
    }));

    // TODO: Integrate with monitoring service (e.g., Sentry, DataDog, Vercel)
    // Example: await fetch(process.env.ALERT_WEBHOOK_URL, { method: 'POST', body: JSON.stringify(alertData) })
}

// 1. Determine Backend Type
// STRICT: Only use REST API (Upstash / Vercel KV)
const envUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const envToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const hasHttpKv = !!(envUrl && envToken);
const BACKEND_NAME = hasHttpKv ? "KV_REST_API" : "MEMORY";

console.log(`[RateLimit] Init: Backend=${BACKEND_NAME}`);

// 2. Initialize Clients
let redisClient = null; // Module-level singleton
const limiterCache = new Map(); // Cache for per-action limiters

if (hasHttpKv) {
    redisClient = new Redis({
        url: envUrl,
        token: envToken,
    });
}

// In-memory store (only used when KV credentials are not configured)
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
        // SECURITY: Fail-closed behavior - deny access when KV is unavailable
        const hashedKey = hashKey(`${action}:${identifier}`);
        const alertData = {
            timestamp: new Date().toISOString(),
            backend: BACKEND_NAME,
            action: action,
            keyHash: hashedKey,
            error: e.message,
            stack: e.stack
        };

        console.error(`[CRITICAL] [ALERT] Rate Limit KV Failure - Denying Access`, alertData);

        // Send alert to monitoring system
        sendAlert(alertData);

        // Return rate limit denial to maintain security
        return {
            allowed: false,
            error: {
                error: "Service temporairement indisponible.",
                message: "Veuillez réessayer dans quelques instants.",
                code: "SERVICE_UNAVAILABLE"
            }
        };
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
        return checkRateLimitInMemory(action, identifier);
    }
}
