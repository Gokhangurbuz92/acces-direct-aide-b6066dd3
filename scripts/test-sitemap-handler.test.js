import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFindMany } = vi.hoisted(() => {
    return { mockFindMany: vi.fn() }
});

vi.mock('@prisma/client', () => {
    return {
        PrismaClient: vi.fn().mockImplementation(function () {
            return {
                aide: { findMany: mockFindMany },
                demarche: { findMany: mockFindMany },
                structure: { findMany: mockFindMany },
                dispositif: { findMany: mockFindMany },
                resourceAccessibility: { findMany: mockFindMany },
                guide: { findMany: mockFindMany },
                toolboxItem: { findMany: mockFindMany },
                actualite: { findMany: mockFindMany }
            };
        })
    };
});

import handler from '../api/_handlers/sitemap.js';

describe('Sitemap Handler', () => {
    let req, res;

    beforeEach(() => {
        vi.clearAllMocks();
        req = {
            method: 'GET',
            headers: {
                host: 'localhost:3000'
            }
        };
        res = {
            writeHead: vi.fn(),
            end: vi.fn(),
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
        mockFindMany.mockResolvedValue([]);
    });

    it('should return correct headers and content', async () => {
        await handler(req, res);

        expect(res.writeHead).toHaveBeenCalledWith(200, expect.objectContaining({
            'Content-Type': 'application/xml; charset=utf-8',
            'X-Robots-Tag': 'noindex, nofollow' // because host is localhost
        }));

        expect(res.end).toHaveBeenCalled();
        const output = res.end.mock.calls[0][0];
        expect(output).toContain('<?xml version="1.0" encoding="UTF-8"?>');
        expect(output).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    });

    it('should handle ETag caching', async () => {
        // First request to get content and etag
        await handler(req, res);

        const headers = res.writeHead.mock.calls[0][1];
        const etag = headers['ETag'];

        // Second request with ETag
        const req2 = { ...req, headers: { ...req.headers, 'if-none-match': etag } };
        const res2 = {
            writeHead: vi.fn(),
            end: vi.fn(),
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };

        await handler(req2, res2);
        expect(res2.writeHead).toHaveBeenCalledWith(304);
        expect(res2.end).toHaveBeenCalled();
    });

    it('should handle HEAD request', async () => {
        req.method = 'HEAD';
        await handler(req, res);
        expect(res.writeHead).toHaveBeenCalledWith(200, expect.anything());
        expect(res.end).toHaveBeenCalledWith(); // No body
    });
});
