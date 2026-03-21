import { Redis } from '@upstash/redis';
import crypto from 'crypto';
import logger from '../_utils/logger.js';

/**
 * Search Cache — Redis-backed caching for search results.
 *
 * Uses Upstash KV (same backend as rate limiting).
 * TTL: 5 minutes. Cache key: SHA-256 of serialized params.
 */

const CACHE_TTL_SECONDS = 300; // 5 minutes
const CACHE_PREFIX = 'search:';

/** @type {Redis|null} */
let redis = null;

function getRedis() {
    if (redis) return redis;
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;
    if (!url || !token) return null;
    redis = new Redis({ url, token });
    return redis;
}

/**
 * Hash search params into a stable cache key.
 * @param {Record<string, unknown>} params
 * @returns {string}
 */
function hashParams(params) {
    const sorted = JSON.stringify(params, Object.keys(params).sort());
    return crypto.createHash('sha256').update(sorted).digest('hex').substring(0, 16);
}

/**
 * Execute a search with Redis caching.
 *
 * @param {Record<string, unknown>} params - Search parameters (used for cache key)
 * @param {() => Promise<unknown>} searchFn - Function that performs the actual search
 * @returns {Promise<{ data: unknown, cached: boolean }>}
 */
export async function cachedSearch(params, searchFn) {
    const client = getRedis();
    const cacheKey = `${CACHE_PREFIX}${hashParams(params)}`;

    // Try cache (only if Redis is configured)
    if (client) {
        try {
            const cached = await client.get(cacheKey);
            if (cached) {
                logger.info(`[search-cache] HIT ${cacheKey}`);
                // Upstash auto-deserializes JSON
                const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
                return { data, cached: true };
            }
        } catch (err) {
            logger.warn(`[search-cache] Redis GET failed: ${err.message}`);
        }
    }

    // Cache miss — execute search
    const data = await searchFn();

    // Store result in cache (fire-and-forget, don't block response)
    if (client) {
        try {
            await client.set(cacheKey, JSON.stringify(data), { ex: CACHE_TTL_SECONDS });
            logger.info(`[search-cache] MISS — stored ${cacheKey} (TTL ${CACHE_TTL_SECONDS}s)`);
        } catch (err) {
            logger.warn(`[search-cache] Redis SET failed: ${err.message}`);
        }
    }

    return { data, cached: false };
}

// Exported for testing
export { hashParams, CACHE_TTL_SECONDS, CACHE_PREFIX };
