
import { describe, it, expect, vi } from 'vitest';
import aidesHandler from '../../api/_handlers/aides.js';

// Mock Prisma
const { mockFindFirst, mockFindMany } = vi.hoisted(() => {
    return {
        mockFindFirst: vi.fn(),
        mockFindMany: vi.fn()
    }
});

vi.mock('@prisma/client', () => {
    return {
        PrismaClient: class {
            constructor() {
                this.aide = {
                    findFirst: mockFindFirst,
                    findMany: mockFindMany,
                    count: vi.fn().mockResolvedValue(0)
                };
            }
        }
    }
});

vi.mock('../../api/_utils/rateLimit.js', () => ({
    checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
    getClientIp: vi.fn().mockReturnValue('127.0.0.1')
}));

vi.mock('../../api/lib/search-query.js', () => ({
    searchAides: vi.fn().mockResolvedValue({ items: [], total: 0 })
}));

describe('API HEAD Support', () => {
    it('should return 200 for HEAD request on /api/aides', async () => {
        mockFindFirst.mockResolvedValue({ id: 1, slug: 'aide-test', statut: 'publie' });

        const req = {
            method: 'HEAD',
            query: { slug: 'aide-test' },
            headers: {}
        };

        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
            end: vi.fn()
        };

        await aidesHandler(req, res);

        // Should NOT call 405
        expect(res.status).not.toHaveBeenCalledWith(405);
        // Should call 200
        expect(res.status).toHaveBeenCalledWith(200);
    });
});
