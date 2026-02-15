import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import prisma from '../../api/_utils/prisma.js';

function mockReq(overrides = {}) {
  return {
    method: 'GET',
    url: '/api/admin/cron-runs',
    headers: {
      host: 'localhost:3000',
      'x-forwarded-proto': 'http',
    },
    query: {},
    ...overrides,
  };
}

function mockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    setHeader() {},
    end() {
      return this;
    },
  };
  return res;
}

describe('P6-B+ Admin cron-runs API', () => {
  /** @type {string[]} */
  const createdIds = [];

  beforeEach(() => {
    createdIds.length = 0;
  });

  afterEach(async () => {
    if (createdIds.length > 0) {
      await prisma.cronRun.deleteMany({ where: { id: { in: createdIds } } });
    }
  });

  it('returns 401 without admin token', async () => {
    const { default: handler } = await import('../../api/_handlers/admin/cron-runs.js');
    const req = mockReq();
    const res = mockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(401);
  });

  it('lists recent cron runs when authorized', async () => {
    const run = await prisma.cronRun.create({
      data: {
        job: 'actualites',
        status: 'success',
        startedAt: new Date(),
        finishedAt: new Date(),
        durationMs: 10,
        metrics: { fetched: 1 },
        updatedAt: new Date(),
      },
      select: { id: true },
    });
    createdIds.push(run.id);

    const { default: handler } = await import('../../api/_handlers/admin/cron-runs.js');
    const req = mockReq({
      url: '/api/admin/cron-runs?job=actualites&limit=10',
      query: { job: 'actualites', limit: '10' },
      headers: {
        host: 'localhost:3000',
        'x-forwarded-proto': 'http',
        authorization: `Bearer ${process.env.ADMIN_TOKEN}`,
      },
    });
    const res = mockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body?.items)).toBe(true);
    expect(res.body.items.some((item) => item.id === run.id)).toBe(true);
  });

  it('returns a cron run detail when authorized', async () => {
    const run = await prisma.cronRun.create({
      data: {
        job: 'actualites',
        status: 'failed',
        startedAt: new Date(),
        finishedAt: new Date(),
        durationMs: 10,
        errorSample: 'boom',
        updatedAt: new Date(),
      },
      select: { id: true },
    });
    createdIds.push(run.id);

    const { default: handler } = await import('../../api/_handlers/admin/cron-runs.js');
    const req = mockReq({
      url: `/api/admin/cron-runs/${run.id}`,
      headers: {
        host: 'localhost:3000',
        'x-forwarded-proto': 'http',
        authorization: `Bearer ${process.env.ADMIN_TOKEN}`,
      },
    });
    const res = mockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body?.item?.id).toBe(run.id);
  });
});

