import { describe, test, expect, vi } from 'vitest';
import sitemapHandler from '../../api/_handlers/sitemap.js';

// Hoist mock methods so they can be referenced inside the mock factory
const { mockFindMany } = vi.hoisted(() => {
    return { mockFindMany: vi.fn() };
});

// Mock Prisma
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
                actualite: { findMany: mockFindMany },
                $disconnect: vi.fn()
            };
        })
    };
});

describe('URL Canonical Consistency', () => {

    test('Sitemap should generate PLURAL /aides/:slug URLs', async () => {
        // Reset mocks
        vi.clearAllMocks();
        mockFindMany.mockResolvedValue([]);

        // Mock Data for the first call (aides)
        const mockAides = [{ slug: 'test-aide-slug', updatedAt: new Date() }];

        // Mock sequence of calls: aide, demarche, structure, dispositif, ressource, guide, tool, actu
        mockFindMany
            .mockResolvedValueOnce(mockAides) // aides
            .mockResolvedValueOnce([])        // demarches
            .mockResolvedValueOnce([])        // structures
            .mockResolvedValueOnce([])        // dispositifs
            .mockResolvedValueOnce([])        // ressources
            .mockResolvedValueOnce([])        // guides
            .mockResolvedValueOnce([])        // tools
            .mockResolvedValueOnce([]);       // actus

        // Mock Response
        const res = {
            writeHeader: vi.fn(),
            writeHead: vi.fn(),
            end: vi.fn()
        };
        const req = {
            method: 'GET',
            headers: { host: 'localhost:3000' }
        };

        await sitemapHandler(req, res);

        // Verify output contains PLURAL /aides/
        expect(res.end).toHaveBeenCalled();
        const output = res.end.mock.calls[0][0];
        expect(output).toContain('<loc>https://www.accesdirectaide.fr/aides/test-aide-slug</loc>');
        expect(output).not.toContain('<loc>https://www.accesdirectaide.fr/aide/test-aide-slug</loc>'); // Ensure NO singular
    });

});
