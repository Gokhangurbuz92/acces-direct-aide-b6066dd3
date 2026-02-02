/**
 * Integration tests for /api/demarches endpoint
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import handler from './demarches.js';
import prisma from '../_utils/prisma.js';

// Mock Prisma
vi.mock('../_utils/prisma.js', () => ({
  default: {
    demarche: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    $queryRaw: vi.fn(),
    aidCategory: {
      findFirst: vi.fn()
    },
    lifeSituation: {
      findFirst: vi.fn()
    }
  }
}));

// Mock auth
vi.mock('../_utils/auth.js', () => ({
  verifyAdmin: vi.fn(() => false)
}));

describe('GET /api/demarches - List', () => {
  it('should return paginated list of démarches', async () => {
    const mockDemarches = [
      {
        id: '1',
        titre: 'Carte d\'identité',
        slug: 'carte-identite',
        statut: 'publie'
      }
    ];

    prisma.$queryRaw
      .mockResolvedValueOnce(mockDemarches) // items query
      .mockResolvedValueOnce([{ total: 1 }]); // count query

    prisma.demarche.findMany.mockResolvedValueOnce(mockDemarches);

    const req = {
      method: 'GET',
      query: { page: '1', pageSize: '20' }
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        items: expect.any(Array),
        pagination: expect.objectContaining({
          total: 1,
          page: 1,
          pageSize: 20
        }),
        facets: expect.any(Object)
      })
    );
  });

  it('should filter by category', async () => {
    const req = {
      method: 'GET',
      query: { category: 'identite', page: '1', pageSize: '20' }
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    prisma.$queryRaw
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ total: 0 }])
      .mockResolvedValueOnce([]) // categories facet
      .mockResolvedValueOnce([]) // situations facet
      .mockResolvedValueOnce([]) // organismes facet
      .mockResolvedValueOnce([]) // canaux facet
      .mockResolvedValueOnce([]); // territoires facet

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should return 400 for invalid parameters', async () => {
    const req = {
      method: 'GET',
      query: { page: 'invalid' }
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Invalid parameters'
      })
    );
  });
});

describe('GET /api/demarches/:slug - Detail', () => {
  it('should return démarche by slug', async () => {
    const mockDemarche = {
      id: '1',
      titre: 'Carte d\'identité',
      slug: 'carte-identite',
      statut: 'publie',
      source_url: 'https://service-public.fr/...',
      fetched_at: new Date()
    };

    prisma.demarche.findFirst.mockResolvedValueOnce(mockDemarche);

    const req = {
      method: 'GET',
      query: { slug: 'carte-identite' }
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: 'carte-identite',
        source_url: expect.any(String),
        fetched_at: expect.any(Date)
      })
    );
  });

  it('should return 404 for non-existent slug', async () => {
    prisma.demarche.findFirst.mockResolvedValueOnce(null);

    const req = {
      method: 'GET',
      query: { slug: 'non-existent' }
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Démarche non trouvée'
      })
    );
  });
});

describe('POST/PUT/DELETE /api/demarches', () => {
  it('should return 501 for POST (not implemented)', async () => {
    const req = { method: 'POST', query: {} };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(501);
  });
});
