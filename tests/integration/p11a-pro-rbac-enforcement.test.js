import { describe, expect, it } from 'vitest';

import apiHandler from '../../api/index.js';
import { signProToken } from '../../api/lib/pro-auth.js';

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
        url: overrides.url || '/api/pro/health-check',
        headers: {
            host: 'localhost:3000',
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
 * P11a — RBAC enforcement on all pro endpoints
 *
 * Verifies that:
 * 1. All pro endpoints reject unauthenticated requests (401)
 * 2. system-maintenance rejects non-admin pro users (403)
 * 3. interop-siao returns not_configured when SIAO_ENABLED is false
 */
describe('P11a — Pro endpoint RBAC enforcement', () => {
    const PRO_ENDPOINTS_GET = [
        '/api/pro/health-check',
        '/api/pro/regional-stats',
        '/api/pro/attestation-data',
        '/api/pro/mfa-setup',
    ];

    const PRO_ENDPOINTS_POST = [
        '/api/pro/agent-scheduler',
        '/api/pro/agent-discovery',
        '/api/pro/consent',
        '/api/pro/dossier-synthesis',
        '/api/pro/interop-siao',
        '/api/pro/system-maintenance',
        '/api/pro/dossier/upload-secure',
    ];

    // ── No token → 401 ──
    for (const url of PRO_ENDPOINTS_GET) {
        it(`GET ${url} without token → 401`, async () => {
            const res = await invokeApi(url, { method: 'GET' });
            expect(res.statusCode).toBe(401);
        });
    }

    for (const url of PRO_ENDPOINTS_POST) {
        it(`POST ${url} without token → 401`, async () => {
            const res = await invokeApi(url, { method: 'POST' });
            expect(res.statusCode).toBe(401);
        });
    }

    // ── With valid pro token → should NOT return 401 ──
    it('GET /api/pro/mfa-setup with valid pro token → not 401', async () => {
        const proToken = signProToken({
            id: 'pro-rbac-test',
            email: 'rbac@test.local',
            structureId: 'structure-rbac',
            role: 'PRO',
        });

        const res = await invokeApi('/api/pro/mfa-setup', {
            method: 'GET',
            headers: { authorization: `Bearer ${proToken}` },
        });

        // Should not be 401 (auth passed), may be other error (DB, etc.)
        expect(res.statusCode).not.toBe(401);
    });

    // ── system-maintenance: admin-only, PRO role → 403 ──
    it('POST /api/pro/system-maintenance with PRO role → 403', async () => {
        const proToken = signProToken({
            id: 'pro-rbac-test',
            email: 'rbac@test.local',
            structureId: 'structure-rbac',
            role: 'PRO',
        });

        const res = await invokeApi('/api/pro/system-maintenance', {
            method: 'POST',
            headers: { authorization: `Bearer ${proToken}` },
            body: { action: 'BACKUP' },
        });

        expect(res.statusCode).toBe(403);
    });

    it('POST /api/pro/system-maintenance with STRUCTURE_ADMIN role → not 403', async () => {
        const adminToken = signProToken({
            id: 'admin-rbac-test',
            email: 'admin@test.local',
            structureId: 'structure-rbac',
            role: 'STRUCTURE_ADMIN',
        });

        const res = await invokeApi('/api/pro/system-maintenance', {
            method: 'POST',
            headers: { authorization: `Bearer ${adminToken}` },
            body: { action: 'BACKUP' },
        });

        // Should pass auth (not 401/403), may fail on DB
        expect(res.statusCode).not.toBe(401);
        expect(res.statusCode).not.toBe(403);
    });

    // ── interop-siao: feature flag OFF → not_configured ──
    it('POST /api/pro/interop-siao with SIAO_ENABLED=false → not_configured', async () => {
        const originalSiao = process.env.SIAO_ENABLED;
        process.env.SIAO_ENABLED = 'false';

        const proToken = signProToken({
            id: 'pro-siao-test',
            email: 'siao@test.local',
            structureId: 'structure-siao',
            role: 'PRO',
        });

        const res = await invokeApi('/api/pro/interop-siao', {
            method: 'POST',
            headers: { authorization: `Bearer ${proToken}` },
            body: { shareId: 'test-share' },
        });

        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject({
            ok: false,
            status: 'not_configured',
        });

        // Restore
        if (originalSiao !== undefined) {
            process.env.SIAO_ENABLED = originalSiao;
        } else {
            delete process.env.SIAO_ENABLED;
        }
    });
});
