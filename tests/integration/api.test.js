import { describe, it, expect, vi, beforeEach } from 'vitest';
import aidesHandler from '../../api/_handlers/aides.js';
import structuresHandler from '../../api/_handlers/structures.js';
import bookingHandler from '../../api/_handlers/public/appointments/create.js';

// Mock Sentry
vi.mock('../../api/_utils/sentry.js', () => ({
  default: {
    configureScope: vi.fn(),
    captureException: vi.fn(),
  }
}));

// Mock Rate Limit
vi.mock('../../api/_utils/rateLimit.js', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1')
}));

// Mock Crypto
vi.mock('../../api/lib/crypto.js', () => ({
    encrypt: vi.fn(val => `encrypted_${val}`),
    decrypt: vi.fn(val => val.replace('encrypted_', '')),
    hash: vi.fn(val => `hash_${val}`)
}));

// Mock Prisma
const mPrisma = vi.hoisted(() => ({
    aide: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    structure: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
    },
    beneficiary: {
        findFirst: vi.fn(),
        create: vi.fn(),
    },
    service: {
        findFirst: vi.fn(),
        create: vi.fn(),
    },
    appointment: {
        findFirst: vi.fn(),
        create: vi.fn(),
    },
    $queryRaw: vi.fn(),
    $transaction: vi.fn((callback) => callback(mPrisma)),
}));

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class {
        constructor() {
            return mPrisma;
        }
    },
    Prisma: {
        sql: vi.fn((strings, ...values) => strings),
        join: vi.fn((arr) => arr.join(', ')),
        PrismaClientKnownRequestError: class extends Error {
            constructor(message, code) {
                super(message);
                this.code = code;
            }
        }
    }
  };
});

describe('API Integration Tests', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();

    // Fix $transaction mock to pass mPrisma
    mPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mPrisma);
    });

    req = {
      method: 'GET',
      query: {},
      body: {},
      headers: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
      headersSent: false
    };
  });

  describe('GET /api/aides', () => {
    it('should return valid envelope on success', async () => {
      // Setup Mock
      mPrisma.aide.findMany.mockResolvedValue([{ id: '1', title: 'Test' }]);
      mPrisma.aide.count.mockResolvedValue(1);
      mPrisma.$queryRaw.mockResolvedValue([{ id: '1' }]);

      await aidesHandler(req, res);

      // Verify status
      expect(res.status).toHaveBeenCalledWith(200);

      // Verify JSON structure (Items + Pagination)
      const response = res.json.mock.calls[0][0];
      expect(response).toHaveProperty('items');
      expect(response).toHaveProperty('pagination');

      // Verify Data
      expect(response.items).toHaveLength(1);
      expect(response.items[0].id).toBe('1');
    });

    it('should return validation error for invalid page', async () => {
      req.query = { page: 'invalid' };

      await aidesHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      const response = res.json.mock.calls[0][0];
      expect(response).toHaveProperty('error');
    });
  });

  describe('GET /api/structures', () => {
    it('should return valid envelope on success', async () => {
        mPrisma.structure.findMany.mockResolvedValue([{ id: '1', nom: 'Structure Test' }]);
        mPrisma.structure.count.mockResolvedValue(1);
        mPrisma.$queryRaw.mockResolvedValue([{ id: '1' }]);

        await structuresHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const response = res.json.mock.calls[0][0];
        expect(response).toHaveProperty('items');
        expect(response).toHaveProperty('pagination');
        expect(response.items).toHaveLength(1);
        expect(response.items[0].nom).toBe('Structure Test');
    });

    it('should return validation error for invalid zip', async () => {
        req.query = { zip: 12345 };

        await structuresHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        const response = res.json.mock.calls[0][0];
        expect(response).toHaveProperty('error');
    });
  });

  describe('POST /api/appointments', () => {
      beforeEach(() => {
          req.method = 'POST';
      });

      it('should validate body', async () => {
          req.body = { structureId: '123' }; // Missing email, startAt

          await bookingHandler(req, res);

          expect(res.status).toHaveBeenCalledWith(400);
          const response = res.json.mock.calls[0][0];
          expect(response.error.code).toBe('VALIDATION_ERROR');
      });

      it('should handle logic error (SLOT_TAKEN)', async () => {
          // Setup valid body
          req.body = {
              structureId: '123',
              startAt: '2023-01-01T10:00:00Z',
              email: 'test@example.com'
          };

          // Mock dependencies for success up to transaction
          mPrisma.beneficiary.findFirst.mockResolvedValue({ id: 'ben_1' });
          mPrisma.service.findFirst.mockResolvedValue({ id: 'ser_1', duration_minutes: 60 });

          // Mock transaction to fail
          mPrisma.$transaction.mockImplementation(async () => {
              throw new Error('SLOT_TAKEN');
          });

          await bookingHandler(req, res);

          expect(res.status).toHaveBeenCalledWith(409);
          const response = res.json.mock.calls[0][0];
          expect(response.error.code).toBe('CONFLICT');
      });
  });
});
