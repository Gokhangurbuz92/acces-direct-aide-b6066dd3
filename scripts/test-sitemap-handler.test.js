import { describe, it, expect, vi, afterEach } from 'vitest';
import handler from '../api/_handlers/sitemap.js';

// Mock Prisma
vi.mock('@prisma/client', () => {
  const MockPrismaClient = vi.fn();
  MockPrismaClient.prototype.aide = { findMany: vi.fn().mockResolvedValue([{ slug: 'aide-1', updatedAt: new Date('2023-01-01') }]) };
  MockPrismaClient.prototype.demarche = { findMany: vi.fn().mockResolvedValue([]) };
  MockPrismaClient.prototype.structure = { findMany: vi.fn().mockResolvedValue([]) };
  MockPrismaClient.prototype.guide = { findMany: vi.fn().mockResolvedValue([]) };
  MockPrismaClient.prototype.toolboxItem = { findMany: vi.fn().mockResolvedValue([]) };
  MockPrismaClient.prototype.actualite = { findMany: vi.fn().mockResolvedValue([]) };
  return { PrismaClient: MockPrismaClient };
});

describe('Sitemap Handler', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return correct headers and content', async () => {
    const req = { method: 'GET', headers: {} };
    const res = {
      setHeader: vi.fn(),
      writeHead: vi.fn(),
      end: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    // Set environment variable
    process.env.VERCEL_GIT_COMMIT_SHA = 'test-sha';

    await handler(req, res);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/xml');
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    expect(res.setHeader).toHaveBeenCalledWith('X-Release-Commit', 'test-sha');
    // ETag should be set
    const etagCall = res.setHeader.mock.calls.find(call => call[0] === 'ETag');
    expect(etagCall).toBeTruthy();
    const etag = etagCall[1];

    expect(res.writeHead).toHaveBeenCalledWith(200);
    expect(res.end).toHaveBeenCalledWith(expect.stringContaining('<?xml'));

    // Test ETag 304 behavior
    const req2 = { method: 'GET', headers: { 'if-none-match': etag } };
    const res2 = {
      setHeader: vi.fn(),
      writeHead: vi.fn(),
      end: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await handler(req2, res2);
    expect(res2.writeHead).toHaveBeenCalledWith(304);
    expect(res2.end).toHaveBeenCalledWith(); // Should be empty
  });

  it('should handle HEAD request', async () => {
    const req = { method: 'HEAD', headers: {} };
    const res = {
      setHeader: vi.fn(),
      writeHead: vi.fn(),
      end: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await handler(req, res);
    expect(res.writeHead).toHaveBeenCalledWith(200);
  });
});
