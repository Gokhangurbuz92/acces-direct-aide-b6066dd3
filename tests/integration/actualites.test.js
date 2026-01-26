import { describe, it, expect, vi, beforeEach } from 'vitest';
import actualitesHandler from '../../api/_handlers/actualites.js';

// Mock Auth
vi.mock('../../api/_utils/auth.js', () => ({
    getAuthenticatedUser: vi.fn(),
}));

// Mock Snapshot
vi.mock('../../api/_utils/snapshot.js', () => ({
    createSnapshot: vi.fn(),
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
        mPrisma.actualite.findMany.mockResolvedValue([{ id: '1', titre: 'News' }]);

        await actualitesHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([{ id: '1', titre: 'News' }]);
    });

    it('should fall back to empty array on DB error (Resilience)', async () => {
        // Simulate DB crash
        mPrisma.actualite.findMany.mockRejectedValue(new Error('DB Connection Failed'));

        await actualitesHandler(req, res);

        // Expect 200 OK and []
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should handle HEAD request as GET to avoid 401', async () => {
        req.method = 'HEAD';
        mPrisma.actualite.findMany.mockResolvedValue([]);

        await actualitesHandler(req, res);

        // Should NOT be 401
        expect(res.status).not.toHaveBeenCalledWith(401);
        expect(res.status).toHaveBeenCalledWith(200);
    });
});
