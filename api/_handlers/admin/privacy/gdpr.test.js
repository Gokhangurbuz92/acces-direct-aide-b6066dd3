import logger from '../../../_utils/logger.js';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
    prisma: {
        proUser: {
            findFirst: vi.fn(),
            deleteMany: vi.fn(),
        },
        beneficiary: {
            findMany: vi.fn(),
            updateMany: vi.fn(),
        },
        invitation: {
            findMany: vi.fn(),
            deleteMany: vi.fn(),
        },
        auditLog: {
            create: vi.fn(),
        }
    },
    logger: {
        info: vi.fn(),
        error: vi.fn()
    }
}));

vi.mock('@prisma/client', () => {
    return {
        PrismaClient: class {
            constructor() {
                return mocks.prisma;
            }
        }
    };
});

vi.mock('../../../_utils/auth.js', () => ({
    verifyAdmin: vi.fn(() => true)
}));

vi.mock('../../../lib/crypto.js', () => ({
    hash: vi.fn((str) => `hashed_${str}`)
}));

vi.mock('../../../lib/logger.js', () => ({
    logger: mocks.logger
}));

// Import AFTER mocks
import exportHandler from './export.js';
import deleteHandler from './delete.js';

describe('GDPR Endpoints', () => {
    const mockRes = () => {
        const res = {};
        res.statusCode = 200;
        res.getHeader = vi.fn();
        res.setHeader = vi.fn();
        res.set = vi.fn();
        res.writeHead = vi.fn();
        res.end = vi.fn();
        res.status = vi.fn().mockReturnThis();
        res.json = vi.fn().mockReturnThis();
        res.send = vi.fn().mockReturnThis();
        res.redirect = vi.fn().mockReturnThis();
        return res;
    };

    const mockReq = (overrides = {}) => {
        return {
            method: 'GET',
            url: 'http://localhost/api/admin/privacy',
            headers: {},
            query: {},
            body: {},
            cookies: {},
            ...overrides,
        };
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Export Handler', () => {
        it('should return 400 if no email', async () => {
            const req = mockReq({ method: 'GET', query: {} });
            const res = mockRes();
            await exportHandler(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return data if email provided', async () => {
            const req = mockReq({ method: 'GET', query: { email: 'test@example.com' } });
            const res = mockRes();

            mocks.prisma.proUser.findFirst.mockResolvedValue({ id: 'pro1', email: 'test@example.com' });
            mocks.prisma.beneficiary.findMany.mockResolvedValue([{ id: 'ben1' }]);
            mocks.prisma.invitation.findMany.mockResolvedValue([]);

            await exportHandler(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                subject: 'test@example.com',
                data: expect.objectContaining({
                    pro_account: expect.any(Object),
                    beneficiary_records: expect.any(Array)
                })
            }));
        });
    });

    describe('Delete Handler', () => {
        it('should return 400 if no email', async () => {
            const req = mockReq({ method: 'POST', body: {} });
            const res = mockRes();
            await deleteHandler(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should delete and anonymize data', async () => {
            const req = mockReq({
                method: 'POST',
                body: { email: 'test@example.com' },
                headers: {}, // Fix: Provide headers to avoid crash
                socket: { remoteAddress: '127.0.0.1' } // Fix: Provide socket for IP fallback
            });
            const res = mockRes();

            mocks.prisma.proUser.deleteMany.mockResolvedValue({ count: 1 });
            mocks.prisma.beneficiary.updateMany.mockResolvedValue({ count: 2 });
            mocks.prisma.invitation.deleteMany.mockResolvedValue({ count: 0 });
            mocks.prisma.auditLog.create.mockResolvedValue({ id: 'audit1' });

            await deleteHandler(req, res);

            expect(mocks.prisma.proUser.deleteMany).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
            expect(mocks.prisma.beneficiary.updateMany).toHaveBeenCalledWith({
                where: { contact_hash: 'hashed_test@example.com' },
                data: expect.objectContaining({ contact_encrypted: 'ANONYMIZED' })
            });
            expect(mocks.prisma.auditLog.create).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                stats: {
                    proUserDeleted: true,
                    beneficiariesAnonymized: 2,
                    invitationsDeleted: 0
                }
            }));
        });
    });
});
