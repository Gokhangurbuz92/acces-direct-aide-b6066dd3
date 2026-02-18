import { randomUUID } from 'crypto';
import { afterEach, describe, expect, it } from 'vitest';

import apiHandler from '../../api/index.js';
import prisma from '../../api/_utils/prisma.js';

function adminAuthHeader() {
  return { authorization: `Bearer ${process.env.ADMIN_TOKEN}` };
}

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
    method: overrides.method || 'PATCH',
    url: overrides.url || '/api/admin/review-queue/bulk',
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

/** @type {string[]} */
const createdIds = [];

afterEach(async () => {
  if (createdIds.length === 0) return;
  await prisma.reviewQueueItem.deleteMany({
    where: {
      id: { in: createdIds },
    },
  });
  createdIds.length = 0;
});

describe('P8-G review queue bulk patch contract', () => {
  it('returns 401 without admin token', async () => {
    const res = await invokeApi('/api/admin/review-queue/bulk', {
      method: 'PATCH',
      body: { ids: ['missing'], status: 'resolved' },
    });

    expect(res.statusCode).toBe(401);
    expect(res.body).toMatchObject({
      error: 'Unauthorized: Admin Token Required',
      requestId: expect.any(String),
    });
    expect(String(res.getHeader('cache-control')).toLowerCase()).toContain('no-store');
    expect(res.getHeader('x-robots-tag')).toBe('noindex, nofollow');
  });

  it('returns 400 for invalid payload', async () => {
    const res = await invokeApi('/api/admin/review-queue/bulk', {
      method: 'PATCH',
      headers: adminAuthHeader(),
      body: { ids: [], status: 'open' },
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({
      error: 'Invalid bulk payload',
      requestId: expect.any(String),
    });
    expect(String(res.getHeader('cache-control')).toLowerCase()).toContain('no-store');
    expect(res.getHeader('x-robots-tag')).toBe('noindex, nofollow');
  });

  it('returns updated/skipped/notFound counts and stays idempotent for already closed items', async () => {
    const openId = randomUUID();
    const resolvedId = randomUUID();
    createdIds.push(openId, resolvedId);

    await prisma.reviewQueueItem.create({
      data: {
        id: openId,
        entityType: 'aide',
        entityId: `p8g-open-${Date.now()}`,
        reason: 'P8G_BULK_OPEN',
        severity: 'P1',
        status: 'open',
      },
    });
    await prisma.reviewQueueItem.create({
      data: {
        id: resolvedId,
        entityType: 'aide',
        entityId: `p8g-resolved-${Date.now()}`,
        reason: 'P8G_BULK_RESOLVED',
        severity: 'P1',
        status: 'resolved',
      },
    });

    const res = await invokeApi('/api/admin/review-queue/bulk', {
      method: 'PATCH',
      headers: adminAuthHeader(),
      body: {
        ids: [openId, resolvedId, 'missing-item-id'],
        status: 'resolved',
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      ok: true,
      requestId: expect.any(String),
      result: {
        updated: 1,
        skipped: 1,
        notFound: 1,
      },
    });
    expect(String(res.getHeader('cache-control')).toLowerCase()).toContain('no-store');
    expect(res.getHeader('x-robots-tag')).toBe('noindex, nofollow');

    const updatedOpen = await prisma.reviewQueueItem.findUnique({
      where: { id: openId },
      select: { status: true },
    });
    const unchangedResolved = await prisma.reviewQueueItem.findUnique({
      where: { id: resolvedId },
      select: { status: true },
    });

    expect(updatedOpen?.status).toBe('resolved');
    expect(unchangedResolved?.status).toBe('resolved');
  });
});
