import { vi } from 'vitest';
vi.stubEnv('KV_REST_API_URL', 'http://localhost');
vi.stubEnv('KV_REST_API_TOKEN', 'mock-token');

/**
 * Search API Integration Tests
 *
 * Tests the POST /api/search and POST /api/search-pro endpoints.
 */
import { describe, it, expect, beforeEach } from 'vitest';

// Mock embedding and hybrid search to isolate search logic
vi.mock('../../api/lib/gemini-embedding.js', () => ({
    generateEmbedding: vi.fn().mockResolvedValue(new Array(768).fill(0.01)),
}));

vi.mock('../../api/lib/hybrid-search.js', () => ({
    searchAidesHybrid: vi.fn(),
}));

import handler from '../../api/_handlers/search.js';
import { searchAidesHybrid } from '../../api/lib/hybrid-search.js';

function createMockRes() {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    res.setHeader = vi.fn();
    return res;
}

describe('POST /api/search', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns 405 for GET requests', async () => {
        const req = { method: 'GET', body: {} };
        const res = createMockRes();

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(405);
    });

    it('returns 400 for missing query', async () => {
        const req = { method: 'POST', body: { query: 'x' } };
        const res = createMockRes();

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns results for a valid query (logement)', async () => {
        const req = {
            method: 'POST',
            body: {
                query: 'aide au logement étudiant',
                category: 'LOGEMENT',
            },
        };
        const res = createMockRes();

        searchAidesHybrid.mockResolvedValue({
            items: [
                { slug: 'apl-etudiant', title: 'APL Étudiant', score: 0.85 },
                { slug: 'als-logement', title: 'ALS Logement', score: 0.72 },
            ],
            total: 2,
            weakResult: false,
        });

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const payload = res.json.mock.calls[0][0];
        expect(payload.items).toHaveLength(2);
        expect(payload.total).toBe(2);
        expect(payload.message).toBeNull();
    });

    it('returns "not found" message when search yields weak results', async () => {
        const req = {
            method: 'POST',
            body: { query: 'quelque chose qui ne retourne rien du tout xyz' },
        };
        const res = createMockRes();

        searchAidesHybrid.mockResolvedValue({
            items: [],
            total: 0,
            weakResult: true,
        });

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const payload = res.json.mock.calls[0][0];
        expect(payload.items).toEqual([]);
        expect(payload.message).toBe('not found');
    });

    it('includes cross-entity results (demarches, structures, actualites)', async () => {
        const req = {
            method: 'POST',
            body: { query: 'aide RSA' },
        };
        const res = createMockRes();

        searchAidesHybrid.mockResolvedValue({
            items: [{ slug: 'rsa', title: 'RSA', score: 0.9 }],
            total: 1,
            weakResult: false,
        });

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const payload = res.json.mock.calls[0][0];
        expect(payload).toHaveProperty('demarches');
        expect(payload).toHaveProperty('structures');
        expect(payload).toHaveProperty('actualites');
    });

    it('filters by category and situations', async () => {
        const req = {
            method: 'POST',
            body: {
                query: 'allocation familiale',
                category: 'FAMILLE',
                situations: ['parent_isole'],
            },
        };
        const res = createMockRes();

        searchAidesHybrid.mockResolvedValue({
            items: [{ slug: 'asf', title: 'ASF', score: 0.8 }],
            total: 1,
            weakResult: false,
        });

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(searchAidesHybrid).toHaveBeenCalledWith(
            expect.objectContaining({
                category: 'FAMILLE',
                situations: ['parent_isole'],
            }),
        );
    });
});
