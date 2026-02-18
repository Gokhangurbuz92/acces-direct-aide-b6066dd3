import { describe, test, expect, vi } from 'vitest';
import sitemapHandler from '../../api/_handlers/sitemap.js';

const { mockAideFindMany } = vi.hoisted(() => ({
  mockAideFindMany: vi.fn(),
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(function PrismaClient() {
    return {
      aide: { findMany: mockAideFindMany },
      $disconnect: vi.fn(),
    };
  }),
}));

describe('URL Canonical Consistency', () => {
  test('Sitemap should generate plural /aides/:slug URLs', async () => {
    vi.clearAllMocks();
    mockAideFindMany.mockResolvedValue([{ slug: 'test-aide-slug', updatedAt: new Date() }]);

    const res = {
      writeHead: vi.fn(),
      end: vi.fn(),
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const req = {
      method: 'GET',
      headers: {
        host: 'preview-accesdirectaide.vercel.app',
        'x-forwarded-proto': 'https',
      },
    };

    await sitemapHandler(req, res);

    expect(res.end).toHaveBeenCalled();
    const output = res.end.mock.calls[0][0];
    expect(output).toContain('<loc>https://preview-accesdirectaide.vercel.app/aides/test-aide-slug</loc>');
    expect(output).not.toContain('<loc>https://preview-accesdirectaide.vercel.app/aide/test-aide-slug</loc>');
  });
});

