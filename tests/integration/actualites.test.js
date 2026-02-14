import { describe, it, expect, vi, beforeEach } from 'vitest';
import actualitesHandler from '../../api/_handlers/actualites.js';

// Mock Auth
vi.mock('../../api/_utils/auth.js', () => ({
    verifyAdmin: vi.fn().mockReturnValue(false),
    getAuthenticatedUser: vi.fn(),
}));

// Mock CRUD
vi.mock('../../api/_utils/crud.js', () => ({
    handleAdminCreate: vi.fn(),
    handleAdminUpdate: vi.fn(),
    handleAdminDelete: vi.fn(),
}));

// Mock Prisma
const mPrisma = vi.hoisted(() => ({
    actualite: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
}));

vi.mock('@prisma/client', () => {
    return {
        PrismaClient: class {
            constructor() {
                return mPrisma;
            }
        }
    };
});

describe('Actualites API Handler', () => {
    let req, res;

    beforeEach(() => {
        vi.clearAllMocks();
        req = {
            method: 'GET',
            query: {},
            body: {},
            headers: {}
        };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
            setHeader: vi.fn(),
            headersSent: false
        };
    });

    it('should return 200 with items on success', async () => {
        mPrisma.actualite.count.mockResolvedValue(1);
        mPrisma.actualite.findMany.mockResolvedValue([{ id: '1', titre: 'News' }]);

        await actualitesHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            items: [{ id: '1', titre: 'News' }],
            pagination: expect.objectContaining({ page: 1 }),
          }),
        );
    });

    it('should fall back to empty list on DB error (Resilience)', async () => {
        // Simulate DB crash
        mPrisma.actualite.count.mockRejectedValue(new Error('DB Connection Failed'));
        mPrisma.actualite.findMany.mockRejectedValue(new Error('DB Connection Failed'));

        await actualitesHandler(req, res);

        // Expect 200 OK and empty envelope
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            items: [],
            pagination: expect.any(Object),
          }),
        );
    });

    it('should handle HEAD request as GET to avoid 401', async () => {
        req.method = 'HEAD';
        mPrisma.actualite.count.mockResolvedValue(0);
        mPrisma.actualite.findMany.mockResolvedValue([]);

        await actualitesHandler(req, res);

        // Should NOT be 401
        expect(res.status).not.toHaveBeenCalledWith(401);
        expect(res.status).toHaveBeenCalledWith(200);
    });
});
