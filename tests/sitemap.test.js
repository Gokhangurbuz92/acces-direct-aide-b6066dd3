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

import sitemapHandler from '../api/_handlers/sitemap.js';

function createReq(overrides = {}) {
  return {
    method: 'GET',
    headers: {
      host: 'preview-accesdirectaide.vercel.app',
      'x-forwarded-proto': 'https',
      'x-forwarded-host': 'preview-accesdirectaide.vercel.app',
    },
    ...overrides,
  };
}

function createRes() {
  return {
    writeHead: vi.fn(),
    end: vi.fn(),
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    setHeader: vi.fn(),
  };
}

describe('Sitemap handler (P7-A)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAideFindMany.mockResolvedValue([]);
  });

  it('returns XML with static and dynamic URLs', async () => {
    mockAideFindMany.mockResolvedValue([
      { slug: 'aide-exemple', updatedAt: new Date('2026-01-01T12:00:00.000Z') },
    ]);

    const req = createReq();
    const res = createRes();

    await sitemapHandler(req, res);

    expect(res.writeHead).toHaveBeenCalledWith(
      200,
      expect.objectContaining({
        'Content-Type': 'application/xml; charset=utf-8',
      }),
    );

    const xml = res.end.mock.calls[0]?.[0];
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain('<loc>https://preview-accesdirectaide.vercel.app/</loc>');
    expect(xml).toContain('<loc>https://preview-accesdirectaide.vercel.app/aides</loc>');
    expect(xml).toContain('<loc>https://preview-accesdirectaide.vercel.app/aides/aide-exemple</loc>');
  });

  it('returns 503 without stack details when DB is unavailable', async () => {
    mockAideFindMany.mockRejectedValue(new Error('db unavailable'));

    const req = createReq();
    const res = createRes();

    await sitemapHandler(req, res);

    expect(res.writeHead).toHaveBeenCalledWith(
      503,
      expect.objectContaining({
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'no-store',
      }),
    );

    const body = res.end.mock.calls[0]?.[0];
    expect(body).toContain('<error>service_unavailable</error>');
    expect(body).not.toContain('db unavailable');
    expect(body).not.toContain('stack');
  });

  it('supports HEAD requests', async () => {
    const req = createReq({ method: 'HEAD' });
    const res = createRes();

    await sitemapHandler(req, res);

    expect(res.writeHead).toHaveBeenCalledWith(200, expect.any(Object));
    expect(res.end).toHaveBeenCalledWith();
  });
});

