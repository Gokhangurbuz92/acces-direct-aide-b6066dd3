import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../src/db/index.js';
import * as schema from '../../src/db/schema.js';
import { eq, sql } from 'drizzle-orm';
import apiHandler from '../../api/index.js';
import { __clearTestOutbox, __getTestOutbox } from '../../api/_utils/mailer.js';

/**
 * @param {{
 *   method?: string,
 *   url?: string,
 *   headers?: Record<string, string>,
 *   query?: Record<string, any>,
 *   body?: unknown,
 *   cookies?: Record<string, string>,
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
    cookies: overrides.cookies || {},
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
      return this;
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

let ipCounter = 10;

function nextIp() {
  ipCounter += 1;
  return `10.0.0.${ipCounter}`;
}

/**
 * @param {string} url
 * @param {{
 *   method?: string,
 *   headers?: Record<string, string>,
 *   query?: Record<string, any>,
 *   body?: unknown,
 *   cookies?: Record<string, string>,
 * }} options
 */
async function invokeApi(url, options = {}) {
  const req = createReq({
    method: options.method,
    url,
    headers: {
      'x-forwarded-for': nextIp(),
      ...(options.headers || {}),
    },
    query: options.query,
    body: options.body,
    cookies: options.cookies,
  });
  const res = createRes();
  await apiHandler(req, res);
  return res;
}

function extractTokenFromMessage(message, marker) {
  const regex = new RegExp(`${marker}=([^&\\s]+)`);
  const match = String(message || '').match(regex);
  return match ? decodeURIComponent(match[1]) : '';
}

const originalEnv = {
  mailerProvider: process.env.MAILER_PROVIDER,
  mailerFrom: process.env.MAILER_FROM,
  appBaseUrl: process.env.APP_BASE_URL,
  jwtSecret: process.env.JWT_SECRET,
};

/** @type {string[]} */
const createdEmails = [];

beforeEach(() => {
  process.env.MAILER_PROVIDER = 'test';
  process.env.MAILER_FROM = 'noreply@test.local';
  process.env.APP_BASE_URL = 'http://localhost:3000';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'p10b-test-jwt-secret';
  __clearTestOutbox();
});

afterEach(async () => {
  __clearTestOutbox();
  if (createdEmails.length > 0) {
    await await db.delete(schema.CitizenUser);
  }
  createdEmails.length = 0;

  process.env.MAILER_PROVIDER = originalEnv.mailerProvider;
  process.env.MAILER_FROM = originalEnv.mailerFrom;
  process.env.APP_BASE_URL = originalEnv.appBaseUrl;
  process.env.JWT_SECRET = originalEnv.jwtSecret;
});

describe('P10-B auth user + email verification', () => {
  it('signup -> verify -> login -> /api/auth/me user session', async () => {
    const email = `citizen-${Date.now()}@test.local`;
    const password = 'secure-pass-123';
    createdEmails.push(email);

    const signupRes = await invokeApi('/api/auth/signup', {
      method: 'POST',
      body: { email, password, next: '/rdv/structure-test' },
    });
    expect(signupRes.statusCode).toBe(200);
    expect(signupRes.body).toMatchObject({ ok: true });

    const outbox = __getTestOutbox();
    expect(outbox.length).toBe(1);
    const verifyToken = extractTokenFromMessage(outbox[0]?.text, 'token');
    expect(verifyToken).not.toBe('');

    const verifyRes = await invokeApi(
      `/api/auth/verify-email?token=${encodeURIComponent(verifyToken)}&next=${encodeURIComponent('/rdv/structure-test')}`,
      { method: 'GET' },
    );
    expect(verifyRes.statusCode).toBe(302);
    expect(String(verifyRes.getHeader('location') || '')).toContain('/auth/verify-email?status=success');

    const verifyReplayRes = await invokeApi(
      `/api/auth/verify-email?token=${encodeURIComponent(verifyToken)}&next=${encodeURIComponent('/rdv/structure-test')}`,
      { method: 'GET' },
    );
    expect(verifyReplayRes.statusCode).toBe(302);
    expect(String(verifyReplayRes.getHeader('location') || '')).toContain('/auth/verify-email?status=expired');

    const loginRes = await invokeApi('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body).toMatchObject({
      success: true,
      session: { kind: 'user', authType: 'user_cookie' },
      user: { role: 'user' },
    });

    const setCookie = String(loginRes.getHeader('set-cookie') || '');
    expect(setCookie).toContain('ada_user_session=');

    const meRes = await invokeApi('/api/auth/me', {
      method: 'GET',
      headers: { cookie: setCookie.split(';')[0] || '' },
    });
    expect(meRes.statusCode).toBe(200);
    expect(meRes.body).toMatchObject({
      session: { kind: 'user', authType: 'user_cookie', role: 'user' },
      user: { email, role: 'user', emailVerified: true },
    });
  });

  it('forgot/reset password happy path', async () => {
    const email = `reset-${Date.now()}@test.local`;
    const oldPassword = 'old-password-123';
    const newPassword = 'new-password-123';
    createdEmails.push(email);

    await invokeApi('/api/auth/signup', {
      method: 'POST',
      body: { email, password: oldPassword, next: '/annuaire' },
    });
    const verifyToken = extractTokenFromMessage(__getTestOutbox()[0]?.text, 'token');
    await invokeApi(`/api/auth/verify-email?token=${encodeURIComponent(verifyToken)}&next=%2Fannuaire`, {
      method: 'GET',
    });
    __clearTestOutbox();

    const forgotRes = await invokeApi('/api/auth/forgot-password', {
      method: 'POST',
      body: { email },
    });
    expect(forgotRes.statusCode).toBe(200);
    expect(forgotRes.body).toMatchObject({ ok: true });

    const resetToken = extractTokenFromMessage(__getTestOutbox()[0]?.text, 'token');
    expect(resetToken).not.toBe('');

    const resetRes = await invokeApi('/api/auth/reset-password', {
      method: 'POST',
      body: { token: resetToken, password: newPassword },
    });
    expect(resetRes.statusCode).toBe(200);
    expect(resetRes.body).toMatchObject({ ok: true });

    const oldLoginRes = await invokeApi('/api/auth/login', {
      method: 'POST',
      body: { email, password: oldPassword },
    });
    expect(oldLoginRes.statusCode).toBe(401);

    const newLoginRes = await invokeApi('/api/auth/login', {
      method: 'POST',
      body: { email, password: newPassword },
    });
    expect(newLoginRes.statusCode).toBe(200);
    expect(newLoginRes.body).toMatchObject({
      success: true,
      session: { kind: 'user' },
    });
  });
});
