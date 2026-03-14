import logger from '../../../_utils/logger.js';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
    const returningMockPro = vi.fn().mockResolvedValue([{ id: 'mocked' }]);
    const returningMockBen = vi.fn().mockResolvedValue([{ id: 'mocked' }, { id: 'mocked2' }]);
    const returningMockInv = vi.fn().mockResolvedValue([]);
    const returningMockAudit = vi.fn().mockResolvedValue([{ id: 'audit1' }]);

    const whereMockPro = vi.fn().mockReturnValue({ returning: returningMockPro });
    const whereMockBen = vi.fn().mockReturnValue({ returning: returningMockBen });
    const whereMockInv = vi.fn().mockReturnValue({ returning: returningMockInv });
    
    const setMock = vi.fn().mockReturnValue({ where: whereMockBen });
    const valuesMock = vi.fn().mockResolvedValue([{ id: 'audit1' }]);

    return {
        db: {
            query: {
                ProUser: { findFirst: vi.fn() },
                Beneficiary: { findMany: vi.fn() },
                Invitation: { findMany: vi.fn() },
            },
            delete: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 'mock1' }]) }) }),
            update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 'mock2' }]) }) }) }),
            insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue([{ id: 'audit1' }]) }),
        },
        logger: {
            info: vi.fn(),
            error: vi.fn()
        }
    };
});

vi.mock('../../../../src/db/index.js', () => ({
    db: mocks.db
}));

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

            mocks.db.query.ProUser.findFirst.mockResolvedValue({ id: 'pro1', email: 'test@example.com' });
            mocks.db.query.Beneficiary.findMany.mockResolvedValue([{ id: 'ben1' }]);
            mocks.db.query.Invitation.findMany.mockResolvedValue([]);

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

            await deleteHandler(req, res);

            expect(mocks.db.delete).toHaveBeenCalled();
            expect(mocks.db.update).toHaveBeenCalled();
            expect(mocks.db.insert).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                stats: {
                    proUserDeleted: true,
                    beneficiariesAnonymized: 1,
                    invitationsDeleted: 1
                }
            }));
        });
    });
});
