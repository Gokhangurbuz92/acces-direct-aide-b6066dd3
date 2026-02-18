import { afterEach, describe, expect, it } from 'vitest';
import apiHandler from '../../api/index.js';
import prisma from '../../api/_utils/prisma.js';

/** @type {{ aideIds: string[], sourceDocumentIds: string[] }} */
const created = {
  aideIds: [],
  sourceDocumentIds: [],
};

afterEach(async () => {
  if (created.aideIds.length > 0) {
    await prisma.aide.deleteMany({ where: { id: { in: created.aideIds } } });
  }
  if (created.sourceDocumentIds.length > 0) {
    await prisma.sourceDocument.deleteMany({ where: { id: { in: created.sourceDocumentIds } } });
  }
  created.aideIds = [];
  created.sourceDocumentIds = [];
});

/**
 * @param {{
 *   method?: string,
 *   url?: string,
 *   headers?: Record<string, string>,
 *   query?: Record<string, string>,
 * }} overrides
 */
function createReq(overrides = {}) {
  return {
    method: overrides.method || 'GET',
    url: overrides.url || '/api/aides',
    headers: {
      host: 'localhost:3000',
      'x-forwarded-proto': 'http',
      ...(overrides.headers || {}),
    },
    query: overrides.query || {},
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
      if (event === 'finish' && typeof listener === 'function') {
        finishListeners.push(listener);
      }
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

describe('P8-E provenance public contract', () => {
  it('exposes minimal provenance block on aide detail and listing without leaking source internals', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const slug = `aide-provenance-${suffix}`;
    const sourceUrl = 'https://www.service-public.fr/simulateur/calcul/apl';
    const fetchedAt = new Date('2026-02-01T08:00:00.000Z');
    const verifiedAt = new Date('2026-01-15T08:00:00.000Z');

    const sourceDocument = await prisma.sourceDocument.create({
      data: {
        source_url: sourceUrl,
        fetched_at: fetchedAt,
        content_hash: `p8e-${suffix}`,
        raw_content: '<html>private raw payload</html>',
        metadata: { parserVersion: 'test' },
      },
      select: { id: true },
    });
    created.sourceDocumentIds.push(sourceDocument.id);

    const aide = await prisma.aide.create({
      data: {
        slug,
        titre: `Aide provenance ${suffix}`,
        territoires: ['national'],
        documents_necessaires: ['piece-identite'],
        statut: 'publie',
        date_verification: verifiedAt,
        published_at: new Date('2099-01-01T00:00:00.000Z'),
        source_document_id: sourceDocument.id,
      },
      select: { id: true, slug: true },
    });
    created.aideIds.push(aide.id);

    const detailRes = await invokeApi(`/api/aides/${encodeURIComponent(aide.slug)}`);
    expect(detailRes.statusCode).toBe(200);
    expect(detailRes.body?.provenance).toEqual({
      verifiedAt: verifiedAt.toISOString(),
      fetchedAt: fetchedAt.toISOString(),
      sourceUrl,
      sourceHost: 'www.service-public.fr',
    });
    expect(detailRes.body).not.toHaveProperty('sourceDocument');
    expect(JSON.stringify(detailRes.body)).not.toContain('raw_content');

    const listRes = await invokeApi('/api/aides?limit=10&sort=recent&page=1');
    expect(listRes.statusCode).toBe(200);
    const item = (listRes.body?.items || []).find((entry) => entry.id === aide.id);
    expect(item).toBeTruthy();
    expect(item?.provenance?.sourceHost).toBe('www.service-public.fr');
    expect(item).not.toHaveProperty('sourceDocument');
    expect(item).not.toHaveProperty('raw_content');
  });
});
