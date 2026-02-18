
/**
 * Integration Test for API Slug Support
 * 
 * Verifies that the API handlers correctly resolve items by slug
 * and return the expected payload.
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';

// Simple mock for the handler testing context
// In a real e2e we'd hit the endpoint, but here we import the listener logic or mock the database response
// properly to verify the query logic.

// We need to mock PrismaClient module entirely to intercept the constructor
// OR we can mock the instance logic if we inject it. 
// Since the handler imports PrismaClient,
// We need to mock PrismaClient module entirely
vi.mock('@prisma/client', () => {
    const mPrisma = {
        aide: {
            findFirst: vi.fn(),
            findMany: vi.fn(),
            count: vi.fn()
        },
        $disconnect: vi.fn()
    };
    return {
        PrismaClient: vi.fn(function () { return mPrisma; })
    };
});

const prisma = new PrismaClient();
// Import the handler using dynamic import or directly if possible
// Since we are module, we can import
import handler from '../../api/_handlers/aides.js';

describe('API GET /api/aides (Integration Logic)', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('should return item 200 when searching by known slug', async () => {
        // Setup Request
        const req = {
            method: 'GET',
            query: { slug: 'mon-slug-test' },
            headers: { 'x-forwarded-for': '127.0.0.1' }
        };

        // Setup Response Mock
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };

        // Mock DB Result
        const mockItem = {
            id: '123',
            slug: 'mon-slug-test',
            titre: 'Aide Test',
            statut: 'publie'
        };

        prisma.aide.findFirst.mockResolvedValue(mockItem);

        // Execute Handler
        await handler(req, res);

        // Assertions
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            ...mockItem,
            provenance: expect.objectContaining({
                verifiedAt: null,
                fetchedAt: null,
                sourceUrl: null,
                sourceHost: null
            })
        }));

        // CRITICAL: Verify correct query structure
        expect(prisma.aide.findFirst).toHaveBeenCalledWith(expect.objectContaining({
            where: { slug: 'mon-slug-test' }
        }));
    });

    test('should return 404 when slug not found', async () => {
        const req = {
            method: 'GET',
            query: { slug: 'unknown-slug' },
            headers: { 'x-forwarded-for': '127.0.0.1' }
        };
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };

        prisma.aide.findFirst.mockResolvedValue(null);

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: "Aide non trouvée" });
    });

    // Test legacy ID access to ensure fallback still works
    test('should return item 200 when searching by ID', async () => {
        const validUuid = '123e4567-e89b-12d3-a456-426614174000';
        const req = {
            method: 'GET',
            query: { id: validUuid },
            headers: { 'x-forwarded-for': '127.0.0.1' }
        };
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };

        prisma.aide.findFirst.mockResolvedValue({ id: validUuid, statut: 'publie' });

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(prisma.aide.findFirst).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: validUuid }
        }));
    })
});
