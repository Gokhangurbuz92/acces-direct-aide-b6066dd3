
import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from '../../api/_handlers/booking/create.js';

// Mock dependencies
// When mocking a class constructor with Vitest, we need to ensure it acts as a constructor.
vi.mock('@prisma/client', () => {
  const mockCreate = vi.fn();
  const mockFindFirst = vi.fn();

  // Define a mock class
  const MockPrismaClient = vi.fn();
  MockPrismaClient.prototype.beneficiary = {
    findFirst: vi.fn().mockResolvedValue({ id: 'ben-1' }),
    create: vi.fn(),
  };
  MockPrismaClient.prototype.appointment = {
    create: mockCreate,
    findFirst: mockFindFirst,
  };
  MockPrismaClient.prototype.$disconnect = vi.fn();

  return {
    PrismaClient: MockPrismaClient
  };
});

// Import the mocked Prisma to control its behavior
import { PrismaClient } from '@prisma/client';

vi.mock('../../api/_utils/rateLimit.js', () => ({
  checkRateLimit: () => ({ allowed: true }),
}));

vi.mock('../../api/lib/crypto.js', () => ({
  encrypt: (val) => `enc-${val}`,
  hash: (val) => `hash-${val}`,
}));

describe('Booking Create Handler', () => {
  let req, res, prisma;

  beforeEach(() => {
    // We need to access the instance that is created inside the handler.
    // Since the handler instantiates 'new PrismaClient()' at the TOP LEVEL of the file,
    // we are actually mocking the class that was used.
    // However, the instance is already created when we imported the handler.
    // So we need to control the methods on the prototype or the mock implementation.

    // In our mock above, we assigned methods to the prototype.
    // So `prisma` here is just for assertions, we need to inspect the mock calls.

    // But wait, in the handler: const prisma = new PrismaClient();
    // This runs on import.
    // So we need to access the mock instances.

    req = {
      method: 'POST',
      headers: {},
      body: {
        structureId: 'struct-1',
        serviceId: 'serv-1',
        proId: 'pro-1',
        startAt: new Date().toISOString(),
        contact: 'test@example.com',
        firstName: 'Test',
      },
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  it('should create an appointment if no overlap', async () => {
    // Get the instance created by the handler
    const prismaInstance = new PrismaClient();
    // Since `new PrismaClient` was called in the file, `prismaInstance` here might be a NEW one
    // or the same mock class.
    // We configured the prototype, so any instance should share the methods.

    prismaInstance.appointment.findFirst.mockResolvedValue(null);
    prismaInstance.appointment.create.mockResolvedValue({ id: 'app-1' });

    await handler(req, res);

    expect(prismaInstance.appointment.findFirst).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('should return 409 if overlapping appointment exists', async () => {
    const prismaInstance = new PrismaClient();
    prismaInstance.appointment.findFirst.mockResolvedValue({ id: 'existing-app' });

    await handler(req, res);

    expect(prismaInstance.appointment.findFirst).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: "Ce créneau n'est plus disponible." });
  });
});
