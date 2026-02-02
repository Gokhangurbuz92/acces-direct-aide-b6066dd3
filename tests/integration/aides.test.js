/**
 * Integration Tests for /api/aides endpoint
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_BASE = process.env.API_BASE_URL || 'http://localhost:5173/api';

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
        const response = await fetch(`${API_BASE}/aides?statut=publie&limit=10`);
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data).toHaveProperty('items');
        expect(data).toHaveProperty('pagination');
        expect(Array.isArray(data.items)).toBe(true);
    });

    it('should return aide by slug', async () => {
        const response = await fetch(`${API_BASE}/aides?slug=${testAideSlug}`);
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.slug).toBe(testAideSlug);
        expect(data.titre).toBe('Aide de Test Integration');
    });

    it('should return aide by id', async () => {
        const response = await fetch(`${API_BASE}/aides?id=${testAideId}`);
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.id).toBe(testAideId);
    });

    it('should filter by theme', async () => {
        const response = await fetch(`${API_BASE}/aides?theme=logement&statut=publie`);
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.items.every(aide => aide.theme === 'logement' || aide.categorie === 'logement')).toBe(true);
    });

    it('should filter by territoire', async () => {
        const response = await fetch(`${API_BASE}/aides?territoire=67&statut=publie`);
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.items.every(aide => aide.territoires?.includes('67'))).toBe(true);
    });

    it('should search by query', async () => {
        const response = await fetch(`${API_BASE}/aides?q=test&statut=publie`);
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data).toHaveProperty('items');
    });

    it('should return facets', async () => {
        const response = await fetch(`${API_BASE}/aides?statut=publie`);
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data).toHaveProperty('facets');
        expect(data.facets).toHaveProperty('themes');
        expect(data.facets).toHaveProperty('organismes');
        expect(data.facets).toHaveProperty('territoires');
    });

    it('should paginate results', async () => {
        const response = await fetch(`${API_BASE}/aides?statut=publie&page=1&pageSize=5`);
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.pagination.page).toBe(1);
        expect(data.pagination.pageSize).toBe(5);
        expect(data.items.length).toBeLessThanOrEqual(5);
    });

    it('should return 404 for non-existent slug', async () => {
        const response = await fetch(`${API_BASE}/aides?slug=non-existent-aide-slug-12345`);
        expect(response.status).toBe(404);
    });

    it('should return 400 for invalid parameters', async () => {
        const response = await fetch(`${API_BASE}/aides?page=invalid`);
        expect(response.status).toBe(400);
    });

    it('should handle combined filters', async () => {
        const response = await fetch(`${API_BASE}/aides?theme=logement&territoire=67&statut=publie`);
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data).toHaveProperty('items');
    });

    it('should sort by date', async () => {
        const response = await fetch(`${API_BASE}/aides?sort=date&statut=publie&limit=10`);
        expect(response.status).toBe(200);

        const data = await response.json();
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
        const response = await fetch(`${API_BASE}/taxonomy`);
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data).toHaveProperty('categories');
        expect(data).toHaveProperty('situations');
        expect(Array.isArray(data.categories)).toBe(true);
    });

    it('should include counts in categories', async () => {
        const response = await fetch(`${API_BASE}/taxonomy`);
        const data = await response.json();

        data.categories.forEach(cat => {
            expect(cat).toHaveProperty('slug');
            expect(cat).toHaveProperty('label');
            expect(cat).toHaveProperty('count');
        });
    });
});
