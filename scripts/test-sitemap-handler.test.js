
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
      writeHeader: vi.fn(),
      end: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    // Set environment variable
    process.env.VERCEL_GIT_COMMIT_SHA = 'test-sha';

    await handler(req, res);

    expect(res.writeHead).toHaveBeenCalledWith(200, expect.objectContaining({
      'Content-Type': 'application/xml; charset=utf-8'
    }));

    // Extract ETag from calls
    // Call args are [200, headersObject]
    const headerCall = res.writeHead.mock.calls.find(args => args[0] === 200 && args[1].ETag);
    const etag = headerCall ? headerCall[1].ETag : 'W/"expected-etag"';

    expect(res.end).toHaveBeenCalledWith(expect.stringContaining('<?xml'));

    // Test ETag 304 behavior
    const req2 = { method: 'GET', headers: { 'if-none-match': etag } };
    const res2 = {
      setHeader: vi.fn(),
      writeHead: vi.fn(),
      writeHeader: vi.fn(),
      end: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await handler(req2, res2);
    expect(res2.writeHead).toHaveBeenCalledWith(304);
    expect(res2.end).toHaveBeenCalled();
  });

  it('should handle HEAD request', async () => {
    const req = { method: 'HEAD', headers: {} };
    const res = {
      setHeader: vi.fn(),
      writeHead: vi.fn(),
      writeHeader: vi.fn(),
      end: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await handler(req, res);
    expect(res.writeHead).toHaveBeenCalledWith(200, expect.anything());
    expect(res.end).toHaveBeenCalledWith(); // No body
  });
});
