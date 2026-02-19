import { describe, expect, it } from 'vitest';

import apiHandler from '../../api/index.js';
import prisma from '../../api/_utils/prisma.js';

/**
 * @param {{
 *   method?: string,
 *   url?: string,
 *   headers?: Record<string, string>,
 * }} overrides
 */
function createReq(overrides = {}) {
  return {
    method: overrides.method || 'GET',
    url: overrides.url || '/api/pdf/aides/test',
    headers: {
      host: 'localhost:3000',
      'x-forwarded-proto': 'http',
      ...(overrides.headers || {}),
    },
    query: {},
    body: null,
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
 */
async function invokeApi(url) {
  const req = createReq({ url });
  const res = createRes();
  await apiHandler(req, res);
  return res;
}

function extractPdfSignature(body) {
  const buffer = Buffer.isBuffer(body)
    ? body
    : Buffer.from(body instanceof Uint8Array ? body : String(body || ''), body ? undefined : 'utf8');
  return buffer.subarray(0, 5).toString('utf8');
}

describe('P10-3 PDF export', () => {
  it('returns application/pdf for a published aide', async () => {
    const aide = await prisma.aide.findFirst({
      where: {
        statut: 'publie',
        slug: { not: null },
      },
      select: { slug: true },
    });
    expect(aide?.slug).toBeTruthy();

    const res = await invokeApi(`/api/pdf/aides/${encodeURIComponent(aide.slug)}`);

    expect(res.statusCode).toBe(200);
    expect(String(res.getHeader('content-type')).toLowerCase()).toContain('application/pdf');
    expect(String(res.getHeader('cache-control')).toLowerCase()).toContain('no-store');
    expect(extractPdfSignature(res.body)).toBe('%PDF-');
  });

  it('returns application/pdf for a published demarche', async () => {
    const demarche = await prisma.demarche.findFirst({
      where: {
        statut: 'publie',
        slug: { not: null },
      },
      select: { slug: true },
    });
    expect(demarche?.slug).toBeTruthy();

    const res = await invokeApi(`/api/pdf/demarches/${encodeURIComponent(demarche.slug)}`);

    expect(res.statusCode).toBe(200);
    expect(String(res.getHeader('content-type')).toLowerCase()).toContain('application/pdf');
    expect(String(res.getHeader('cache-control')).toLowerCase()).toContain('no-store');
    expect(extractPdfSignature(res.body)).toBe('%PDF-');
  });
});
