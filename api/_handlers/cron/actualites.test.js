import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  withLock: vi.fn(async (_name, fn) => await fn()),
  runIngestActualitesRss: vi.fn().mockResolvedValue({
    fetched: 1,
    processed: 1,
    created: 1,
    updated: 0,
    skippedExisting: 0,
    errors: [],
    durationByStage: { fetchMs: 1, processingMs: 1 },
  }),
  prisma: {
    cronRun: {
      create: vi.fn().mockResolvedValue({ id: 'cron-run-id' }),
      update: vi.fn().mockResolvedValue({}),
    },
  },
}));

vi.mock('../../_utils/pipelineLock.js', () => ({
  withLock: mocks.withLock,
}));

vi.mock('./ingest-actualites-rss.js', () => ({
  runIngestActualitesRss: mocks.runIngestActualitesRss,
}));

vi.mock('../../_utils/prisma.js', () => ({
  default: mocks.prisma,
}));

import handler from './actualites.js';

function mockReq(overrides = {}) {
  return {
    method: 'GET',
    url: 'http://localhost/api/cron/actualites',
    headers: {},
    query: {},
    body: {},
    cookies: {},
    ...overrides,
  };
}

function mockRes() {
  const res = {};
  res.statusCode = 200;
  res.getHeader = vi.fn();
  res.setHeader = vi.fn();
  res.set = vi.fn();
  res.writeHead = vi.fn();
  res.end = vi.fn();
  res.status = vi.fn().mockReturnThis();
  res.json = vi.fn().mockReturnThis();
  res.send = vi.fn().mockReturnThis();
  res.redirect = vi.fn().mockReturnThis();
  return res;
}

describe('Cron Actualites Handler', () => {
  const ORIGINAL_CRON_SECRET = process.env.CRON_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'test-cron-secret';
  });

  afterEach(() => {
    process.env.CRON_SECRET = ORIGINAL_CRON_SECRET;
  });

  it('returns 500 when CRON_SECRET is missing (fail closed)', async () => {
    delete process.env.CRON_SECRET;

    const req = mockReq({
      headers: { 'x-cron-secret': 'test-cron-secret' },
    });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('returns 401 when unauthorized', async () => {
    const req = mockReq();
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 200 when authorized and triggers ingestion', async () => {
    const req = mockReq({
      headers: { 'x-cron-secret': 'test-cron-secret' },
    });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(mocks.prisma.cronRun.create).toHaveBeenCalled();
    expect(mocks.prisma.cronRun.update).toHaveBeenCalled();
    expect(mocks.runIngestActualitesRss).toHaveBeenCalledWith(
      expect.objectContaining({ runId: expect.any(String) }),
    );
  });
});
