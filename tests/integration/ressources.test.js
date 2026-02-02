import { describe, it, expect, beforeAll } from 'vitest';
import handler from '../../api/_handlers/ressources.js';

describe('Ressources API Handler', () => {
    let mockReq;
    let mockRes;

    beforeAll(() => {
        // Mock response object
        mockRes = {
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                this.body = data;
                return this;
            },
            statusCode: 200,
            body: null
        };
    });

    it('should return 405 for non-GET requests', async () => {
        mockReq = {
            method: 'POST',
            query: {},
            headers: {}
        };

        await handler(mockReq, mockRes);
        expect(mockRes.statusCode).toBe(405);
        expect(mockRes.body.error).toBe('Method not allowed');
    });

    it('should return 400 for invalid parameters', async () => {
        mockReq = {
            method: 'GET',
            query: { page: 'invalid' },
            headers: {}
        };

        await handler(mockReq, mockRes);
        expect(mockRes.statusCode).toBe(400);
        expect(mockRes.body.error).toBe('Invalid parameters');
    });

    it('should handle list requests with pagination', async () => {
        mockReq = {
            method: 'GET',
            query: { page: '1', pageSize: '10' },
            headers: {}
        };

        await handler(mockReq, mockRes);
        
        // Should return 200 or 429 (rate limit)
        expect([200, 429]).toContain(mockRes.statusCode);
        
        if (mockRes.statusCode === 200) {
            expect(mockRes.body).toHaveProperty('items');
            expect(mockRes.body).toHaveProperty('pagination');
            expect(Array.isArray(mockRes.body.items)).toBe(true);
        }
    });

    it('should handle single item requests by slug', async () => {
        mockReq = {
            method: 'GET',
            query: { slug: 'test-ressource' },
            headers: {}
        };

        await handler(mockReq, mockRes);
        
        // Should return 200, 404, or 429
        expect([200, 404, 429]).toContain(mockRes.statusCode);
    });

    it('should handle HEAD requests', async () => {
        mockReq = {
            method: 'HEAD',
            query: {},
            headers: {}
        };

        await handler(mockReq, mockRes);
        
        // Should not error on HEAD
        expect([200, 429]).toContain(mockRes.statusCode);
    });
});
