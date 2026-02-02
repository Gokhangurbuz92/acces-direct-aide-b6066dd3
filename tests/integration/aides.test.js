/**
 * Integration Tests for /api/aides endpoint
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import aidesHandler from '../../api/_handlers/aides.js';
import taxonomyHandler from '../../api/_handlers/taxonomy.js';

const prisma = new PrismaClient();

// Mock Sentry
vi.mock('../../api/_utils/sentry.js', () => ({
  default: {
    configureScope: vi.fn(),
    captureException: vi.fn(),
  }
}));

// Mock Rate Limit
vi.mock('../../api/_utils/rateLimit.js', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1')
}));

// Helper to create mock request/response
function createMockReqRes(method = 'GET', query = {}, body = {}) {
  const req = {
    method,
    query,
    body,
    headers: {},
  };
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    setHeader: vi.fn(),
    headersSent: false
  };
  return { req, res };
}

describe('GET /api/aides', () => {
    let testAideId;
    let testAideSlug;

    beforeAll(async () => {
        // Create test aide
        const testAide = await prisma.aide.create({
            data: {
                slug: 'test-aide-integration',
                titre: 'Aide de Test Integration',
                cest_quoi: 'Description de test',
                pour_qui: 'Tout le monde',
                theme: 'logement',
                organisme: 'Test Organisme',
                territoires: ['67', 'national'],
                audiences: ['tous'],
                statut: 'publie',
                published_at: new Date(),
                source_url: 'https://example.com/test',
                fetched_at: new Date()
            }
        });
        testAideId = testAide.id;
        testAideSlug = testAide.slug;
    });

    afterAll(async () => {
        // Cleanup
        if (testAideId) {
            await prisma.aide.delete({ where: { id: testAideId } });
        }
        await prisma.$disconnect();
    });

    it('should return list of aides', async () => {
        const { req, res } = createMockReqRes('GET', { statut: 'publie', limit: '10' });
        await aidesHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const data = res.json.mock.calls[0][0];
        expect(data).toHaveProperty('items');
        expect(data).toHaveProperty('pagination');
        expect(Array.isArray(data.items)).toBe(true);
    });

    it('should return aide by slug', async () => {
        const { req, res } = createMockReqRes('GET', { slug: testAideSlug });
        await aidesHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const data = res.json.mock.calls[0][0];
        expect(data.slug).toBe(testAideSlug);
        expect(data.titre).toBe('Aide de Test Integration');
    });

    it('should return aide by id', async () => {
        const { req, res } = createMockReqRes('GET', { id: testAideId });
        await aidesHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const data = res.json.mock.calls[0][0];
        expect(data.id).toBe(testAideId);
    });

    it('should filter by theme', async () => {
        const { req, res } = createMockReqRes('GET', { theme: 'logement', statut: 'publie' });
        await aidesHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const data = res.json.mock.calls[0][0];
        expect(data.items.every(aide => aide.theme === 'logement' || aide.categorie === 'logement')).toBe(true);
    });

    it('should filter by territoire', async () => {
        const { req, res } = createMockReqRes('GET', { territoire: '67', statut: 'publie' });
        await aidesHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const data = res.json.mock.calls[0][0];
        expect(data.items.every(aide => aide.territoires?.includes('67'))).toBe(true);
    });

    it('should search by query', async () => {
        const { req, res } = createMockReqRes('GET', { q: 'test', statut: 'publie' });
        await aidesHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const data = res.json.mock.calls[0][0];
        expect(data).toHaveProperty('items');
    });

    it('should return facets', async () => {
        const { req, res } = createMockReqRes('GET', { statut: 'publie' });
        await aidesHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const data = res.json.mock.calls[0][0];
        expect(data).toHaveProperty('facets');
        expect(data.facets).toHaveProperty('themes');
        expect(data.facets).toHaveProperty('organismes');
        expect(data.facets).toHaveProperty('territoires');
    });

    it('should paginate results', async () => {
        const { req, res } = createMockReqRes('GET', { statut: 'publie', page: '1', pageSize: '5' });
        await aidesHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const data = res.json.mock.calls[0][0];
        expect(data.pagination.page).toBe(1);
        expect(data.pagination.pageSize).toBe(5);
        expect(data.items.length).toBeLessThanOrEqual(5);
    });

    it('should return 404 for non-existent slug', async () => {
        const { req, res } = createMockReqRes('GET', { slug: 'non-existent-aide-slug-12345' });
        await aidesHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 for invalid parameters', async () => {
        const { req, res } = createMockReqRes('GET', { page: 'invalid' });
        await aidesHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle combined filters', async () => {
        const { req, res } = createMockReqRes('GET', { theme: 'logement', territoire: '67', statut: 'publie' });
        await aidesHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const data = res.json.mock.calls[0][0];
        expect(data).toHaveProperty('items');
    });

    it('should sort by date', async () => {
        const { req, res } = createMockReqRes('GET', { sort: 'date', statut: 'publie', limit: '10' });
        await aidesHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const data = res.json.mock.calls[0][0];
        expect(data.items.length).toBeGreaterThan(0);
        
        // Check dates are in descending order
        for (let i = 1; i < data.items.length; i++) {
            const prev = new Date(data.items[i - 1].published_at);
            const curr = new Date(data.items[i].published_at);
            expect(prev >= curr).toBe(true);
        }
    });
});

describe('GET /api/taxonomy', () => {
    it('should return taxonomy data', async () => {
        const { req, res } = createMockReqRes('GET');
        await taxonomyHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const data = res.json.mock.calls[0][0];
        expect(data).toHaveProperty('categories');
        expect(data).toHaveProperty('situations');
        expect(Array.isArray(data.categories)).toBe(true);
    });

    it('should include counts in categories', async () => {
        const { req, res } = createMockReqRes('GET');
        await taxonomyHandler(req, res);

        const data = res.json.mock.calls[0][0];
        data.categories.forEach(cat => {
            expect(cat).toHaveProperty('slug');
            expect(cat).toHaveProperty('label');
            expect(cat).toHaveProperty('count');
        });
    });
});
