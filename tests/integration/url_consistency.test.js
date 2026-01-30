
import { describe, test, expect, vi } from 'vitest';
import sitemapHandler from '../../api/_handlers/sitemap.js';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
vi.mock('@prisma/client', () => {
    const mPrisma = {
        aide: { findMany: vi.fn() },
        demarche: { findMany: vi.fn() },
        structure: { findMany: vi.fn() },
        guide: { findMany: vi.fn() },
        toolboxItem: { findMany: vi.fn() },
        actualite: { findMany: vi.fn() },
        $disconnect: vi.fn()
    };
    return {
        PrismaClient: vi.fn(function () { return mPrisma; })
    };
});

const prisma = new PrismaClient();

describe('URL Canonical Consistency', () => {

    test('Sitemap should generate PLURAL /aides/:slug URLs', async () => {
        // Mock Data
        const mockAides = [{ slug: 'test-aide-slug', updatedAt: new Date() }];
        prisma.aide.findMany.mockResolvedValue(mockAides);
        prisma.demarche.findMany.mockResolvedValue([]);
        prisma.structure.findMany.mockResolvedValue([]);
        prisma.guide.findMany.mockResolvedValue([]);
        prisma.toolboxItem.findMany.mockResolvedValue([]);
        prisma.actualite.findMany.mockResolvedValue([]);

        // Mock Response
        const res = {

            end: vi.fn(),
            writeHead: vi.fn()
        };
        const req = {
            method: 'GET',
            headers: { host: 'localhost:3000' }
        };

        await sitemapHandler(req, res);

        // Verify output contains PLURAL /aides/
        const output = res.end.mock.calls[0][0];
        expect(output).toContain('<loc>https://www.accesdirectaide.fr/aides/test-aide-slug</loc>');
        expect(output).not.toContain('<loc>https://www.accesdirectaide.fr/aide/test-aide-slug</loc>'); // Ensure NO singular
    });

});
