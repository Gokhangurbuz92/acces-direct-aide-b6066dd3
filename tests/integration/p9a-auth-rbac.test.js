import { afterEach, describe, expect, it } from 'vitest';

import apiHandler from '../../api/index.js';
import { AUTH_ROLE, requireRole } from '../../api/_utils/auth.js';
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
    url: overrides.url || '/api/auth/me',
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
 *   query?: Record<string, string>,
 *   body?: unknown,
 * }} options
 */
async function invokeApi(url, options = {}) {
  const req = createReq({
    method: options.method,
    url,
    headers: options.headers,
    query: options.query,
    body: options.body,
  });
  const res = createRes();
  await apiHandler(req, res);
  return res;
}

const originalAuthMode = process.env.AUTH_MODE;
const originalAuthSecret = process.env.AUTH_SECRET;
const originalAdminEmail = process.env.ADMIN_EMAIL;
const originalAdminPassword = process.env.ADMIN_PASSWORD;
const originalAdminToken = process.env.ADMIN_TOKEN;

afterEach(() => {
  process.env.AUTH_MODE = originalAuthMode;
  process.env.AUTH_SECRET = originalAuthSecret;
  process.env.ADMIN_EMAIL = originalAdminEmail;
  process.env.ADMIN_PASSWORD = originalAdminPassword;
  process.env.ADMIN_TOKEN = originalAdminToken;
});

describe('P9-A auth + rbac foundation', () => {
  it('GET /api/auth/me returns 401 without token', async () => {
    const res = await invokeApi('/api/auth/me');

    expect(res.statusCode).toBe(401);
    expect(res.body).toMatchObject({ error: 'Unauthorized' });
  });

  it('supports admin login + me in token mode', async () => {
    process.env.AUTH_MODE = 'token';
    process.env.ADMIN_EMAIL = 'admin@test.local';
    process.env.ADMIN_PASSWORD = 'test-password';
    process.env.ADMIN_TOKEN = 'test-admin-token';

    const loginRes = await invokeApi('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@test.local', password: 'test-password' },
    });

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body).toMatchObject({
      success: true,
      authMode: 'token',
      token: 'test-admin-token',
      user: { role: 'admin' },
    });

    const meRes = await invokeApi('/api/auth/me', {
      headers: { authorization: 'Bearer test-admin-token' },
    });

    expect(meRes.statusCode).toBe(200);
    expect(meRes.body).toMatchObject({
      user: {
        role: 'admin',
        authType: 'admin_token',
      },
    });
  });

  it('supports admin login + me in jwt mode', async () => {
    process.env.AUTH_MODE = 'jwt';
    process.env.AUTH_SECRET = 'test-auth-secret';
    process.env.ADMIN_EMAIL = 'admin@test.local';
    process.env.ADMIN_PASSWORD = 'test-password';
    process.env.ADMIN_TOKEN = 'legacy-admin-token';

    const loginRes = await invokeApi('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@test.local', password: 'test-password' },
    });

    expect(loginRes.statusCode).toBe(200);
    expect(typeof loginRes.body?.token).toBe('string');
    expect(loginRes.body?.token).not.toBe('legacy-admin-token');
    expect(loginRes.body).toMatchObject({
      success: true,
      authMode: 'jwt',
      user: { role: 'admin' },
    });

    const meRes = await invokeApi('/api/auth/me', {
      headers: { authorization: `Bearer ${loginRes.body.token}` },
    });

    expect(meRes.statusCode).toBe(200);
    expect(meRes.body).toMatchObject({
      user: {
        role: 'admin',
        authType: 'admin_jwt',
      },
    });
  });

  it('returns pro identity on /api/auth/me for pro jwt and enforces role gating (401/403/200)', async () => {
    const proToken = signProToken({
      id: 'pro-1',
      email: 'pro@test.local',
      structureId: 'structure-1',
      role: 'PRO',
    });

    const meRes = await invokeApi('/api/auth/me', {
      headers: { authorization: `Bearer ${proToken}` },
    });

    expect(meRes.statusCode).toBe(200);
    expect(meRes.body).toMatchObject({
      user: {
        id: 'pro-1',
        role: 'pro',
        authType: 'pro_jwt',
      },
    });

    const gatedHandler = requireRole(
      async (_req, res) => res.status(200).json({ ok: true }),
      [AUTH_ROLE.STRUCTURE_ADMIN],
      { allowAdminBypass: false },
    );

    const noTokenReq = createReq();
    const noTokenRes = createRes();
    await gatedHandler(noTokenReq, noTokenRes);
    expect(noTokenRes.statusCode).toBe(401);

    const forbiddenReq = createReq({
      headers: { authorization: `Bearer ${proToken}` },
    });
    const forbiddenRes = createRes();
    await gatedHandler(forbiddenReq, forbiddenRes);
    expect(forbiddenRes.statusCode).toBe(403);

    const structureAdminToken = signProToken({
      id: 'pro-2',
      email: 'manager@test.local',
      structureId: 'structure-1',
      role: 'STRUCTURE_ADMIN',
    });
    const okReq = createReq({
      headers: { authorization: `Bearer ${structureAdminToken}` },
    });
    const okRes = createRes();
    await gatedHandler(okReq, okRes);
    expect(okRes.statusCode).toBe(200);
    expect(okRes.body).toMatchObject({ ok: true });
  });
});
