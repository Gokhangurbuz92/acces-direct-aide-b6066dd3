import { vi } from "vitest";
vi.stubEnv("KV_REST_API_URL", "http://localhost");
vi.stubEnv("KV_REST_API_TOKEN", "mock-token");

import { describe, expect, it } from 'vitest';

import apiHandler from '../../api/index.js';
import { signProToken } from '../../api/_utils/auth.js';

/**
 * @param {{
 *   method?: string,
 *   url?: string,
 *   headers?: Record<string, string>,
 *   query?: Record<string, string>,
 *   body?: unknown,
 * }} overrides
 */
function createReq(overrides = {}) {
    return {
        method: overrides.method || 'GET',
        url: overrides.url || '/api/pro/auth/refresh',
        headers: {
            host: 'localhost:3000',
            'x-forwarded-for': '127.0.0.1',
            'x-forwarded-proto': 'http',
            ...(overrides.headers || {}),
        },
        query: overrides.query || {},
        body: overrides.body || null,
        cookies: {},
    };
}

function createRes() {
    /** @type {Record<string, string>} */
    const headers = {};
    /** @type {Array<() => void>} */
    const finishListeners = [];

    return {
        statusCode: 200,
        body: null,
        headersSent: false,
        on(event, listener) {
            if (event === 'finish' && typeof listener === 'function') finishListeners.push(listener);
            return this;
        },
        setHeader(key, value) {
            headers[String(key).toLowerCase()] = String(value);
        },
        getHeader(key) {
            return headers[String(key).toLowerCase()];
        },
        status(code) {
            this.statusCode = code;
            return this;
        },
        writeHead(code, outHeaders = {}) {
            this.statusCode = code;
            for (const [key, value] of Object.entries(outHeaders)) {
                headers[String(key).toLowerCase()] = String(value);
            }
            return this;
        },
        json(payload) {
            this.body = payload;
            this.headersSent = true;
            for (const listener of finishListeners) listener();
            return this;
        },
        send(payload) {
            this.body = payload;
            this.headersSent = true;
            for (const listener of finishListeners) listener();
            return this;
        },
        end(payload) {
            if (typeof payload !== 'undefined') this.body = payload;
            this.headersSent = true;
            for (const listener of finishListeners) listener();
            return this;
        },
    };
}

/**
 * @param {string} url
 * @param {{
 *   method?: string,
 *   headers?: Record<string, string>,
 *   body?: unknown,
 * }} options
 */
async function invokeApi(url, options = {}) {
    const req = createReq({
        method: options.method,
        url,
        headers: options.headers,
        body: options.body,
    });
    const res = createRes();
    await apiHandler(req, res);
    return res;
}

/**
 * P13 — Pro auth rate limiting & refresh endpoint
 *
 * Verifies:
 * 1. Refresh endpoint is accessible and validates input
 * 2. Refresh endpoint returns a new token for a valid JWT
 * 3. Rate limit configs exist for all pro auth actions
 * 4. Register-invite has rate limiting (doesn't crash on POST)
 */
describe('P13 — Pro auth rate limiting & refresh endpoint', () => {

    // ── Refresh route basic validation ──
    it('POST /api/pro/auth/refresh without auth → 401', async () => {
        const res = await invokeApi('/api/pro/auth/refresh', {
            method: 'POST',
            body: {},
        });
        expect(res.statusCode).toBe(401);
        expect(res.body?.error).toBeTruthy();
    });

    it('POST /api/pro/auth/refresh with invalid token → 401', async () => {
        const res = await invokeApi('/api/pro/auth/refresh', {
            method: 'POST',
            headers: { authorization: 'Bearer invalid-garbage-token' },
            body: {},
        });
        expect(res.statusCode).toBe(401);
    });

    it('POST /api/pro/auth/refresh with valid token → 200 + new token', async () => {
        const proToken = signProToken({
            id: 'refresh-test-user',
            email: 'refresh@test.local',
            structureId: 'structure-refresh',
            role: 'PRO',
        });

        const res = await invokeApi('/api/pro/auth/refresh', {
            method: 'POST',
            headers: { authorization: `Bearer ${proToken}` },
            body: {},
        });

        // Token is valid → should get 200 with new token
        expect(res.statusCode).toBe(200);
        expect(res.body?.success).toBe(true);
        expect(res.body?.token).toBeTruthy();
    });

    it('GET /api/pro/auth/refresh → 405', async () => {
        const res = await invokeApi('/api/pro/auth/refresh', {
            method: 'GET',
        });
        expect(res.statusCode).toBe(405);
    });

    // ── Register-invite rate limit existence ──
    it('POST /api/pro/auth/register-invite without body → not 500', async () => {
        const res = await invokeApi('/api/pro/auth/register-invite', {
            method: 'POST',
            body: {},
        });
        // Should be 400 (missing fields) not 500 (crash)
        expect(res.statusCode).toBeLessThan(500);
    });

    // ── Rate limit config existence ──
    it('all pro auth rate limit actions are defined', async () => {
        // Dynamic import to access the CONFIG
        const mod = await import('../../api/_utils/rateLimit.js');
        // checkRateLimit should not throw for these actions
        const actions = ['LOGIN_PRO', 'REGISTER_PRO', 'MFA_VERIFY_PRO', 'REGISTER_INVITE', 'REFRESH_PRO'];
        for (const action of actions) {
            const result = await mod.checkRateLimit(action, `test-${action}`);
            expect(result).toHaveProperty('allowed');
            expect(result.allowed).toBe(true); // First call should always pass
        }
    });
});
