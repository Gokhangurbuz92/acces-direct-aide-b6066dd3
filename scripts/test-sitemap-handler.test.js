import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAideFindMany } = vi.hoisted(() => ({
  mockAideFindMany: vi.fn(),
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(function PrismaClient() {
    return {
      aide: { findMany: mockAideFindMany },
    };
  }),
}));

import handler from '../api/_handlers/sitemap.js';

describe('Sitemap handler script-level coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAideFindMany.mockResolvedValue([]);
  });

  it('returns 200 xml on nominal flow', async () => {
    const req = {
      method: 'GET',
      headers: {
        host: 'localhost:3000',
        'x-forwarded-proto': 'http',
      },
    };
    const res = {
      writeHead: vi.fn(),
      end: vi.fn(),
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await handler(req, res);

    expect(res.writeHead).toHaveBeenCalledWith(
      200,
      expect.objectContaining({
        'Content-Type': 'application/xml; charset=utf-8',
      }),
    );
    expect(String(res.end.mock.calls[0]?.[0])).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
  });

  it('returns 503 xml when DB lookup fails', async () => {
    mockAideFindMany.mockRejectedValue(new Error('db failure'));

    const req = {
      method: 'GET',
      headers: {
        host: 'localhost:3000',
      },
    };
    const res = {
      writeHead: vi.fn(),
      end: vi.fn(),
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await handler(req, res);

    expect(res.writeHead).toHaveBeenCalledWith(
      503,
      expect.objectContaining({
        'Content-Type': 'application/xml; charset=utf-8',
      }),
    );
    expect(String(res.end.mock.calls[0]?.[0])).toContain('<error>service_unavailable</error>');
  });
});

