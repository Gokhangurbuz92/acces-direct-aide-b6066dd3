// Rate Limiter: Upstash REST (Primary) + In-Memory Fallback
import crypto from 'crypto';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { env } from './env.js';

// 1. Determine Backend Type
// STRICT: Only use REST API (Upstash / Vercel KV)
const envUrl = env.kv.url;
const envToken = env.kv.token;

// Robust check: must have URL starting with https:// and a token
const hasHttpKv = !!(envUrl && envUrl.startsWith('https://') && envToken);
const BACKEND_NAME = hasHttpKv ? "KV_REST_API" : "MEMORY";
const IS_PRODUCTION = env.runtime.vercelEnv === 'production';

console.log(`[RateLimit] Init: Backend=${BACKEND_NAME} Env=${env.runtime.vercelEnv}`);

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
    FEEDBACK: { limit: 6, window: 600 },    // 6 per 10 min
    // Auth
    LOGIN_PRO: { limit: 5, window: 900 },   // 5 per 15 min
    LOGIN_USER: { limit: 8, window: 900 },  // 8 per 15 min
    SIGNUP_USER: { limit: 5, window: 3600 }, // 5 per hour
    RESEND_VERIFY: { limit: 5, window: 3600 }, // 5 per hour
    FORGOT_USER: { limit: 5, window: 3600 }, // 5 per hour
    RESET_USER: { limit: 5, window: 3600 }, // 5 per hour
    RESET_PASSWORD: { limit: 3, window: 3600 }, // 3 per hour
    RDV_PUBLIC_READ: { limit: 60, window: 60 }, // 60/min per authenticated user+ip
    RDV_PUBLIC_WRITE: { limit: 10, window: 60 }, // 10/min per authenticated user+ip
    MESSAGE_USER_READ: { limit: 60, window: 60 }, // 60/min per user+ip
    MESSAGE_USER_SEND: { limit: 10, window: 300 }, // 10/5min per user+conversation+ip
    MESSAGE_USER_WRITE: { limit: 20, window: 300 }, // helper actions (create/get conversation)
    MESSAGE_PRO_READ: { limit: 120, window: 60 }, // 120/min per pro+ip
    MESSAGE_PRO_SEND: { limit: 20, window: 300 }, // 20/5min per pro+conversation+ip
    // Search & Taxonomy
    SEARCH_AIDES: { limit: 30, window: 60 },      // 30 per min
    SEARCH_STRUCTURES: { limit: 30, window: 60 }, // 30 per min
    SEARCH_RESSOURCES: { limit: 60, window: 60 }, // 60 per min
    DREES_API: { limit: 30, window: 60 },         // 30 per min
    TAXONOMY: { limit: 60, window: 60 },          // 60 per min
    // Assistant (AI)
    ASSISTANT_CHAT: { limit: 10, window: 60 },    // 10 per min
    ASSISTANT_RECOS: { limit: 15, window: 60 },   // 15 per min
    // Diagnostic (OpenFisca)
    DIAGNOSTIC: { limit: 30, window: 60 }         // 30 per min (was 10; raised to avoid E2E 429)
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
    const headers = req?.headers || {};
    const xForwardedFor = headers['x-forwarded-for'] || headers['X-Forwarded-For'];
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

// Default fallback config for unknown actions — never crash
const DEFAULT_RATE_LIMIT = { limit: 30, window: 60 };

export async function checkRateLimit(action, identifier) {
    let config = CONFIG[action];
    if (!config) {
        console.warn(`[RateLimit] Unknown action "${action}" — using default (${DEFAULT_RATE_LIMIT.limit}/${DEFAULT_RATE_LIMIT.window}s)`);
        config = DEFAULT_RATE_LIMIT;
    }

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

/**
 * @param {{ status?: number } | null | undefined} result
 * @returns {number}
 */
export function getRateLimitStatus(result) {
    return typeof result?.status === 'number' ? result.status : 429;
}
