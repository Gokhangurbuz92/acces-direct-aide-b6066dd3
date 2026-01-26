import { describe, it, expect, vi, beforeEach } from 'vitest';

// Set Env BEFORE imports
process.env.JWT_SECRET = 'test-secret';

// Mock dependencies
vi.mock('@prisma/client', () => {
    class PrismaClient {
        constructor() {
            this.auditLog = { create: vi.fn() };
            this.proUser = { findUnique: vi.fn() };
        }
    }
    return { PrismaClient };
});

vi.mock('../_utils/rateLimit.js', () => ({
    checkRateLimit: vi.fn().mockResolvedValue({ allowed: true })
}));

// Import AFTER mocks and env setup
import { requireAuth, ROLE, signProToken } from '../lib/pro-auth.js';

describe('RBAC Middleware', () => {
    it('should block requests without token', async () => {
        const handler = vi.fn();
        const wrapped = requireAuth(handler);

        const req = { headers: {} };
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };

        await wrapped(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(handler).not.toHaveBeenCalled();
    });

    it('should allow valid pro token', async () => {
        const handler = vi.fn();
        const wrapped = requireAuth(handler);

        const user = { id: '123', email: 'test@test.com', structureId: 's1', role: ROLE.PRO };
        const token = signProToken(user);

        const req = { headers: { authorization: `Bearer ${token}` } };
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };

        await wrapped(req, res);

        expect(handler).toHaveBeenCalled();
        expect(req.user).toBeDefined();
        expect(req.user.userId).toBe(user.id);
    });

    it('should enforce allowed roles', async () => {
        const handler = vi.fn();
        const wrapped = requireAuth(handler, [ROLE.STRUCTURE_ADMIN]);

        const user = { id: '123', role: ROLE.PRO };
        const token = signProToken(user);

        const req = { headers: { authorization: `Bearer ${token}` } };
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };

        await wrapped(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(handler).not.toHaveBeenCalled();
    });

    it('should allow superadmin bypass', async () => {
        const handler = vi.fn();
        const wrapped = requireAuth(handler, [ROLE.STRUCTURE_ADMIN]);

        const user = { id: 'admin', role: ROLE.SUPERADMIN };
        const token = signProToken(user);

        const req = { headers: { authorization: `Bearer ${token}` } };
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };

        await wrapped(req, res);

        expect(handler).toHaveBeenCalled();
    });
});
