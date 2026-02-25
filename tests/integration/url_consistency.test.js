import { describe, test, expect, vi } from 'vitest';
import sitemapHandler from '../../api/_handlers/sitemap.js';

const { mockAideFindMany, mockDemarcheFindMany, mockStructureFindMany } = vi.hoisted(() => ({
  mockAideFindMany: vi.fn(),
  mockDemarcheFindMany: vi.fn(),
  mockStructureFindMany: vi.fn(),
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(function PrismaClient() {
    return {
      aide: { findMany: mockAideFindMany },
      demarche: { findMany: mockDemarcheFindMany },
      structure: { findMany: mockStructureFindMany },
      $disconnect: vi.fn(),
    };
  }),
}));

describe('URL Canonical Consistency', () => {
  test('Sitemap should generate plural /aides/:slug URLs', async () => {
    vi.clearAllMocks();
    mockAideFindMany.mockResolvedValue([{ slug: 'test-aide-slug', updatedAt: new Date() }]);
    mockDemarcheFindMany.mockResolvedValue([{ slug: 'test-demarche-slug', updatedAt: new Date() }]);
    mockStructureFindMany.mockResolvedValue([{ slug: 'test-structure-slug', updatedAt: new Date() }]);

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
    // Verify démarches and structures are also in sitemap
    expect(output).toContain('<loc>https://preview-accesdirectaide.vercel.app/demarches/test-demarche-slug</loc>');
    expect(output).toContain('<loc>https://preview-accesdirectaide.vercel.app/annuaire/test-structure-slug</loc>');
  });
});
