import { beforeEach, describe, expect, it, vi } from 'vitest';
import handler from '../../api/_handlers/search.js';

vi.mock('../../api/_utils/prisma.js', () => ({
  default: {
    demarche: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    structure: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    actualite: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

vi.mock('../../api/lib/gemini-embedding.js', () => ({
  generateEmbedding: vi.fn(),
}));

vi.mock('../../api/lib/hybrid-search.js', () => ({
  searchAidesHybrid: vi.fn(),
}));

import { generateEmbedding } from '../../api/lib/gemini-embedding.js';
import { searchAidesHybrid } from '../../api/lib/hybrid-search.js';

function createRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('POST /api/search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 405 when method is not POST', async () => {
    const req = { method: 'GET', body: {} };
    const res = createRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
  });

  it('returns 400 when payload is invalid', async () => {
    const req = { method: 'POST', body: { query: 'x' } };
    const res = createRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Invalid payload' }));
  });

  it('returns not found fallback when result set is weak/empty', async () => {
    const req = { method: 'POST', body: { query: 'loyer étudiant Strasbourg' } };
    const res = createRes();

    generateEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
    searchAidesHybrid.mockResolvedValue({ items: [], total: 0, weakResult: true });

    await handler(req, res);

    expect(generateEmbedding).toHaveBeenCalledWith('loyer étudiant Strasbourg');
    expect(searchAidesHybrid).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        query: 'loyer étudiant Strasbourg',
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      items: [],
      total: 0,
      message: 'not found',
      demarches: [],
      structures: [],
      actualites: [],
    }));
  });

  it('returns fused items when search is successful', async () => {
    const req = {
      method: 'POST',
      body: {
        query: 'loyer étudiant Strasbourg',
        category: 'LOGEMENT',
        situations: ['etudiant'],
      },
    };
    const res = createRes();

    generateEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
    searchAidesHybrid.mockResolvedValue({
      weakResult: false,
      total: 1,
      items: [
        {
          slug: 'apl-etudiant-strasbourg',
          title: 'APL étudiant à Strasbourg',
          score: 0.42,
        },
      ],
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.items).toEqual([
      {
        slug: 'apl-etudiant-strasbourg',
        title: 'APL étudiant à Strasbourg',
        score: 0.42,
      },
    ]);
    expect(jsonCall.total).toBe(1);
    expect(jsonCall.message).toBeNull();
    expect(jsonCall).toHaveProperty('demarches');
    expect(jsonCall).toHaveProperty('structures');
    expect(jsonCall).toHaveProperty('actualites');
  });
});
