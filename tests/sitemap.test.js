import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFindMany } = vi.hoisted(() => {
    return { mockFindMany: vi.fn() }
});

vi.mock('@prisma/client', () => {
    return {
        PrismaClient: vi.fn().mockImplementation(function () {
            return {
                aide: { findMany: mockFindMany },
                demarche: { findMany: mockFindMany },
                structure: { findMany: mockFindMany },
                dispositif: { findMany: mockFindMany },
                resourceAccessibility: { findMany: mockFindMany },
                guide: { findMany: mockFindMany },
                toolboxItem: { findMany: mockFindMany },
                actualite: { findMany: mockFindMany }
            };
        })
    };
});

import sitemapHandler from '../api/_handlers/sitemap.js';

describe('Sitemap Handler', () => {
    let req, res;

    beforeEach(() => {
        vi.clearAllMocks();
        req = {
            method: 'GET',
            headers: { host: 'localhost:3000' }
        };
        res = {
            setHeader: vi.fn(),
            writeHeader: vi.fn(),
            writeHead: vi.fn(),
            end: vi.fn(),
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };

        // Setup default mock returns
        mockFindMany.mockResolvedValue([]);
    });

    it('should generate plural URLs for demarches and structures', async () => {
        // Mock data
        const date = new Date('2023-01-01');
        const aides = [{ slug: 'aide-1', updatedAt: date }];
        const demarches = [{ slug: 'demarche-1', updatedAt: date }];
        const structures = [{ slug: 'structure-1', updatedAt: date }];
        const dispositifs = [{ slug: 'dispositif-1', updatedAt: date }];
        const ressources = [{ slug: 'ressource-1', updatedAt: date }];

        // Order of calls in handler:
        // 1. aide
        // 2. demarche
        // 3. structure
        // 4. dispositif
        // 5. resourceAccessibility
        // 6. guide
        // 7. toolboxItem
        // 8. actualite
        mockFindMany
            .mockResolvedValueOnce(aides)      // aides
            .mockResolvedValueOnce(demarches)  // demarches
            .mockResolvedValueOnce(structures) // structures
            .mockResolvedValueOnce(dispositifs)// dispositifs
            .mockResolvedValueOnce(ressources) // resourceAccessibility
            .mockResolvedValueOnce([])         // guides
            .mockResolvedValueOnce([])         // tools
            .mockResolvedValueOnce([]);        // actus

        await sitemapHandler(req, res);

        expect(res.end).toHaveBeenCalled();
        const xml = res.end.mock.calls[0][0];

        // Check URLs
        // Note: api/_utils/seo.js getCanonicalBaseUrl logic forces production domain usually.
        // So we expect the hardcoded production domain if logic dictates, even if host is localhost.
        expect(xml).toContain('<loc>https://www.accesdirectaide.fr/aides/aide-1</loc>'); // Plural (Verified Fix)
        expect(xml).toContain('<loc>https://www.accesdirectaide.fr/demarches/demarche-1</loc>'); // Plural (Verified Fix)
        expect(xml).toContain('<loc>https://www.accesdirectaide.fr/structures/structure-1</loc>'); // Plural (Verified Fix)
        expect(xml).toContain('<loc>https://www.accesdirectaide.fr/dispositifs/dispositif-1</loc>');
        expect(xml).toContain('<loc>https://www.accesdirectaide.fr/ressources/ressource-1</loc>');
    });
});
