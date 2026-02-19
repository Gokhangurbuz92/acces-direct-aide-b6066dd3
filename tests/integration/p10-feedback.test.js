import { afterEach, describe, expect, it } from 'vitest';

import apiHandler from '../../api/index.js';
import prisma from '../../api/_utils/prisma.js';

/** @type {string[]} */
const createdFeedbackIds = [];

afterEach(async () => {
  if (createdFeedbackIds.length === 0) return;
  await prisma.contentReport.deleteMany({
    where: { id: { in: createdFeedbackIds } },
  });
  createdFeedbackIds.length = 0;
});

/**
 * @param {{
 *   method?: string,
 *   url?: string,
 *   headers?: Record<string, string>,
 *   body?: unknown,
 * }} overrides
 */
function createReq(overrides = {}) {
  return {
    method: overrides.method || 'POST',
    url: overrides.url || '/api/feedback',
    headers: {
      host: 'localhost:3000',
      'x-forwarded-proto': 'http',
      ...(overrides.headers || {}),
    },
    query: {},
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
 * @param {{
 *   method?: string,
 *   body?: unknown,
 * }} options
 */
async function invokeFeedback(options = {}) {
  const req = createReq({
    method: options.method,
    body: options.body,
  });
  const res = createRes();
  await apiHandler(req, res);
  return res;
}

describe('P10-2 feedback endpoint contract', () => {
  it('returns 201 and stores a feedback record for aide payloads', async () => {
    const res = await invokeFeedback({
      method: 'POST',
      body: {
        type: 'aide',
        id: 'aide-test-id',
        message: 'Le montant indiqué semble obsolète.',
        email: 'lecteur@example.com',
      },
    });

    expect(res.statusCode).toBe(201);
    expect(String(res.getHeader('cache-control')).toLowerCase()).toContain('no-store');
    expect(res.body).toMatchObject({
      ok: true,
      requestId: expect.any(String),
      feedbackId: expect.any(String),
      message: 'Merci pour votre signalement.',
    });

    createdFeedbackIds.push(res.body.feedbackId);

    const stored = await prisma.contentReport.findUnique({
      where: { id: res.body.feedbackId },
      select: {
        contentType: true,
        contentId: true,
        reason: true,
        message: true,
        reporterEmail: true,
      },
    });

    expect(stored).toMatchObject({
      contentType: 'AIDE',
      contentId: 'aide-test-id',
      reason: 'AUTRE',
      message: 'Le montant indiqué semble obsolète.',
      reporterEmail: 'lecteur@example.com',
    });
  });

  it('accepts slug-only payload for demarches', async () => {
    const res = await invokeFeedback({
      method: 'POST',
      body: {
        type: 'demarche',
        slug: 'demarche-test',
        message: 'Cette démarche affiche une étape inexacte.',
      },
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({
      ok: true,
      feedbackId: expect.any(String),
    });
    createdFeedbackIds.push(res.body.feedbackId);

    const stored = await prisma.contentReport.findUnique({
      where: { id: res.body.feedbackId },
      select: { contentType: true, contentId: true },
    });

    expect(stored).toEqual({
      contentType: 'DEMARCHE',
      contentId: 'slug:demarche-test',
    });
  });

  it('returns 400 for invalid payload', async () => {
    const res = await invokeFeedback({
      method: 'POST',
      body: {
        type: 'aide',
        id: 'aide-test-id',
        message: 'no',
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({
      ok: false,
      requestId: expect.any(String),
      error: 'invalid_message',
    });
  });

  it('returns 405 for unsupported methods', async () => {
    const res = await invokeFeedback({ method: 'GET' });

    expect(res.statusCode).toBe(405);
    expect(res.body).toMatchObject({
      ok: false,
      requestId: expect.any(String),
      error: 'method_not_allowed',
    });
  });
});
