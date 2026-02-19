import crypto from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import demarchesHandler from '../../api/_handlers/demarches.js';
import prisma from '../../api/_utils/prisma.js';

function createMockReq({ method = 'GET', url = '/api/demarches', query = {}, headers = {} } = {}) {
  return {
    method,
    url,
    query,
    headers: {
      host: 'localhost:3000',
      'x-forwarded-proto': 'http',
      ...headers,
    },
  };
}

function createMockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    setHeader(key, value) {
      this.headers[key] = value;
    },
  };
}

const hasDatabase = !!process.env.DATABASE_URL;

describe.skipIf(!hasDatabase)('P10-0 public credibility guards', () => {
  const suffix = crypto.randomUUID().slice(0, 8);
  const hiddenSlug = `demarche-hidden-${suffix}`;
  const visibleSlug = `demarche-visible-${suffix}`;

  beforeAll(async () => {
    const now = new Date();
    await prisma.demarche.createMany({
      data: [
        {
          slug: hiddenSlug,
          titre: 'Démarche Test interne',
          statut: 'publie',
          published_at: now,
          description_courte: 'Doit etre masquee en public.',
        },
        {
          slug: visibleSlug,
          titre: 'Demander une domiciliation',
          statut: 'publie',
          published_at: now,
          description_courte: 'Doit rester visible en public.',
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.demarche.deleteMany({
      where: {
        slug: { in: [hiddenSlug, visibleSlug] },
      },
    });
  });

  it('list endpoint excludes test-labeled demarches on public surface', async () => {
    const req = createMockReq({
      url: '/api/demarches?limit=50',
      query: { limit: '50' },
    });
    const res = createMockRes();

    await demarchesHandler(req, res);

    expect(res.statusCode).toBe(200);
    const items = Array.isArray(res.body?.items) ? res.body.items : [];
    const slugs = items.map((item) => item.slug);
    expect(slugs).toContain(visibleSlug);
    expect(slugs).not.toContain(hiddenSlug);
  });

  it('detail endpoint hides test-labeled demarches for public but keeps admin access', async () => {
    const publicReq = createMockReq({
      url: `/api/demarches/${hiddenSlug}`,
      query: {},
    });
    const publicRes = createMockRes();
    await demarchesHandler(publicReq, publicRes);
    expect(publicRes.statusCode).toBe(404);

    const adminReq = createMockReq({
      url: `/api/demarches/${hiddenSlug}`,
      query: {},
      headers: {
        authorization: `Bearer ${process.env.ADMIN_TOKEN || ''}`,
      },
    });
    const adminRes = createMockRes();
    await demarchesHandler(adminReq, adminRes);

    expect(adminRes.statusCode).toBe(200);
    expect(adminRes.body?.slug).toBe(hiddenSlug);
  });
});
