import { generateUniqueSlug, ensureSlug } from '../api/lib/slug.js';
import { describe, test, expect, beforeEach, vi } from 'vitest';

// Mock Prisma
const mockPrisma = {
    aide: {
        findFirst: vi.fn()
    },
    structure: {
        findFirst: vi.fn()
    }
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('generateUniqueSlug', () => {
    test('should generate a simple slug from title', async () => {
        mockPrisma.aide.findFirst.mockResolvedValue(null); // No collision
        const slug = await generateUniqueSlug(mockPrisma, 'aide', 'Ma  Super   Aide  ');
        expect(slug).toBe('ma-super-aide');
    });

    test('should handle accents and special characters', async () => {
        mockPrisma.aide.findFirst.mockResolvedValue(null);
        const slug = await generateUniqueSlug(mockPrisma, 'aide', 'L\'été à Noël : ça coûte cher !');
        expect(slug).toBe('l-ete-a-noel-ca-coute-cher');
    });

    test('should handle collisions by adding a suffix', async () => {
        // First call returns existing item, second call returns null (unique)
        mockPrisma.aide.findFirst
            .mockResolvedValueOnce({ id: 'existing-id' })
            .mockResolvedValueOnce(null);

        const slug = await generateUniqueSlug(mockPrisma, 'aide', 'Collision');

        expect(mockPrisma.aide.findFirst).toHaveBeenCalledTimes(2);
        expect(mockPrisma.aide.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { slug: 'collision' } }));
        expect(mockPrisma.aide.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { slug: 'collision-1' } }));
        expect(slug).toBe('collision-1');
    });

    test('should truncate overly long titles', async () => {
        mockPrisma.aide.findFirst.mockResolvedValue(null);
        const longTitle = 'a'.repeat(300);
        const slug = await generateUniqueSlug(mockPrisma, 'aide', longTitle);

        expect(slug.length).toBeLessThanOrEqual(200); // Truncated length might vary slightly due to slugify, but input is cap at 200
    });

    test('should return "item" fallback for empty resulting slug', async () => {
        mockPrisma.aide.findFirst.mockResolvedValue(null);
        const slug = await generateUniqueSlug(mockPrisma, 'aide', '???');
        expect(slug).toBe('item');
    });
});

describe('ensureSlug', () => {
    test('should return existing slug if present', async () => {
        const item = { id: '1', slug: 'existing-slug', titre: 'Ignore Me' };
        const result = await ensureSlug(mockPrisma, 'aide', item);
        expect(result).toBe('existing-slug');
        expect(mockPrisma.aide.findFirst).not.toHaveBeenCalled();
    });

    test('should generate new slug if missing', async () => {
        mockPrisma.aide.findFirst.mockResolvedValue(null);
        const item = { id: '1', slug: null, titre: 'New Item' };
        const result = await ensureSlug(mockPrisma, 'aide', item);
        expect(result).toBe('new-item');
    });
});
