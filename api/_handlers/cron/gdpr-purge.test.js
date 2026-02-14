import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  prisma: {
    entityVersion: { deleteMany: vi.fn() },
    updateLog: { deleteMany: vi.fn() },
    auditLog: { deleteMany: vi.fn() },
  },
}));

vi.mock('../../_utils/prisma.js', () => ({ default: mocks.prisma }));

import handler from './gdpr-purge.js';

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

function mockReq(overrides = {}) {
  return {
    method: 'GET',
    url: 'http://localhost/api/cron/gdpr-purge',
    headers: {},
    query: {},
    body: {},
    cookies: {},
    ...overrides,
  };
}

describe('Cron GDPR Purge Handler', () => {
  const ORIGINAL_CRON_SECRET = process.env.CRON_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.CRON_SECRET = ORIGINAL_CRON_SECRET;
  });

  it('should reject when CRON_SECRET is missing (no fallback secret)', async () => {
    delete process.env.CRON_SECRET;

    const req = mockReq({ method: 'GET', query: { key: 'dev-secret-key' }, headers: {} });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('should accept legacy ?key= when CRON_SECRET matches (backward compatible)', async () => {
    process.env.CRON_SECRET = 'test-cron-secret';

    mocks.prisma.entityVersion.deleteMany.mockResolvedValue({ count: 1 });
    mocks.prisma.updateLog.deleteMany.mockResolvedValue({ count: 2 });
    mocks.prisma.auditLog.deleteMany.mockResolvedValue({ count: 0 });

    const req = mockReq({ method: 'GET', query: { key: 'test-cron-secret' }, headers: {} });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'success',
        versions_deleted: 1,
        update_logs_deleted: 2,
      }),
    );
  });
});
