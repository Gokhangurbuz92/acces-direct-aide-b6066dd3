import { vi } from "vitest";
vi.stubEnv("KV_REST_API_URL", "http://localhost");
vi.stubEnv("KV_REST_API_TOKEN", "mock-token");

import { describe, expect, it } from 'vitest';
import apiHandler from '../../api/index.js';

/**
 * @param {Record<string, unknown>} overrides
 */
function createReq(overrides = {}) {
    return {
        method: overrides.method || 'POST',
        url: overrides.url || '/api/public/sms-notify',
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
    const headers = {};
    const finishListeners = [];
    return {
        statusCode: 200,
        body: null,
        headersSent: false,
        on(event, listener) { if (event === 'finish') finishListeners.push(listener); return this; },
        setHeader(key, value) { headers[key.toLowerCase()] = String(value); },
        getHeader(key) { return headers[key.toLowerCase()]; },
        status(code) { this.statusCode = code; return this; },
        writeHead(code, h = {}) {
            this.statusCode = code;
            for (const [k, v] of Object.entries(h)) headers[k.toLowerCase()] = String(v);
            return this;
        },
        json(p) { this.body = p; this.headersSent = true; for (const fn of finishListeners) fn(); return this; },
        send(p) { this.body = p; this.headersSent = true; for (const fn of finishListeners) fn(); return this; },
        end(p) { if (p !== undefined) this.body = p; this.headersSent = true; for (const fn of finishListeners) fn(); return this; },
    };
}

async function invokeApi(url, options = {}) {
    const req = createReq({ method: options.method, url, headers: options.headers, body: options.body });
    const res = createRes();
    await apiHandler(req, res);
    return res;
}

/**
 * P14 — SMS Notification & Dossier Export tests
 *
 * Verifies:
 * 1. SMS handler validation (no Twilio creds → graceful fallback)
 * 2. Dossier export handler requires auth + shareId
 * 3. Env centralization for Outlook & SIAO
 */
describe('P14 — SMS Notification handler', () => {

    it('GET /api/public/sms-notify → 405', async () => {
        const res = await invokeApi('/api/public/sms-notify', { method: 'GET' });
        expect(res.statusCode).toBe(405);
    });

    it('POST /api/public/sms-notify without body → 400', async () => {
        const res = await invokeApi('/api/public/sms-notify', { method: 'POST', body: {} });
        expect(res.statusCode).toBe(400);
        expect(res.body?.error).toBeTruthy();
    });

    it('POST /api/public/sms-notify with invalid phone → 400', async () => {
        const res = await invokeApi('/api/public/sms-notify', {
            method: 'POST',
            body: {
                appointmentId: 'fake-id',
                phoneNumber: '12345',
            },
        });
        expect(res.statusCode).toBe(400);
        expect(res.body?.error).toMatch(/numéro|téléphone|phone/i);
    });

    it('POST /api/public/sms-notify with valid phone but no DB appointment → 404 or 500', async () => {
        const res = await invokeApi('/api/public/sms-notify', {
            method: 'POST',
            body: {
                appointmentId: 'nonexistent-appointment-id',
                phoneNumber: '06 12 34 56 78',
            },
        });
        // 404 if Prisma finds nothing, 500 if no DB — both acceptable
        expect(res.statusCode).toBeGreaterThanOrEqual(400);
    });
});

describe('P14 — Dossier Export handler', () => {

    it('GET /api/pro/dossier/export without auth → 401', async () => {
        const res = await invokeApi('/api/pro/dossier/export', { method: 'GET' });
        expect(res.statusCode).toBe(401);
    });

    it('POST /api/pro/dossier/export → 405', async () => {
        const res = await invokeApi('/api/pro/dossier/export', { method: 'POST' });
        // Method not allowed (handler only accepts GET) or 401 (auth check first)
        expect([401, 405]).toContain(res.statusCode);
    });
});

describe('P14 — Centralized env.outlook config', () => {

    it('env.outlook getters exist and default to undefined/false', async () => {
        const { env } = await import('../../api/_utils/env.js');
        expect(env.outlook).toBeDefined();
        expect(typeof env.outlook.enabled).toBe('boolean');
        expect(env.outlook.clientId).toBeUndefined();
        expect(env.outlook.clientSecret).toBeUndefined();
        expect(env.outlook.redirectUri).toBeUndefined();
        expect(env.outlook.tokenEncryptionKey).toBeUndefined();
    });

    it('env.siao getters exist and default to undefined/false', async () => {
        const { env } = await import('../../api/_utils/env.js');
        expect(env.siao).toBeDefined();
        expect(typeof env.siao.enabled).toBe('boolean');
        expect(env.siao.enabled).toBe(false);
        expect(env.siao.apiUrl).toBeUndefined();
        expect(env.siao.apiKey).toBeUndefined();
    });
});
