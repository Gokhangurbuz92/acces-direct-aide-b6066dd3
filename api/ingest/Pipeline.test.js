import { describe, it, expect, vi, beforeEach } from 'vitest';
import Pipeline from './Pipeline.js';
import crypto from 'crypto';

const { prismaMocks } = vi.hoisted(() => {
    return {
        prismaMocks: {
            Aide: {
                findUnique: vi.fn(),
                create: vi.fn(),
                update: vi.fn()
            },
            sourceSnapshot: {
                create: vi.fn()
            },
            importLog: {
                create: vi.fn()
            }
        }
    }
});

vi.mock('@prisma/client', () => {
    return {
        PrismaClient: class {
            constructor() {
                return prismaMocks;
            }
        }
    };
});

// Mock Connector
class MockConnector {
    async fetchItems() {
        return [{
            entityType: 'Aide',
            data: { slug: 'test-aide', titre: 'Test Aide' },
            rawContent: 'Raw Content'
        }];
    }
}

describe('Pipeline Ingestion Logic', () => {
    let pipeline;
    let connector;

    beforeEach(() => {
        vi.clearAllMocks();
        connector = new MockConnector();
        pipeline = new Pipeline('TEST_SOURCE', connector);
    });

    it('should create new items if they do not exist', async () => {
        prismaMocks.Aide.findUnique.mockResolvedValueOnce(null); // Not found first check
        prismaMocks.Aide.create.mockResolvedValue({ id: 'new-id' });
        // Snapshot creation fetches ID again
        prismaMocks.Aide.findUnique.mockResolvedValueOnce({ id: 'new-id' });

        const stats = await pipeline.run();

        expect(stats.created).toBe(1);
        expect(prismaMocks.Aide.create).toHaveBeenCalled();
        expect(prismaMocks.sourceSnapshot.create).toHaveBeenCalled();
    });

    it('should update items if content hash differs', async () => {
        const existingItem = { id: 'old-id', content_hash: 'old-hash' };
        prismaMocks.Aide.findUnique.mockResolvedValue(existingItem);
        prismaMocks.Aide.update.mockResolvedValue({ id: 'old-id' });

        const stats = await pipeline.run();

        expect(stats.updated).toBe(1);
        expect(prismaMocks.Aide.update).toHaveBeenCalled();
        expect(prismaMocks.sourceSnapshot.create).toHaveBeenCalled();
    });

    it('should skip items if content hash is identical', async () => {
        // We use the same calculation as in Pipeline.js to ensure robust test
        const rawData = { slug: 'test-aide', titre: 'Test Aide' };
        const expectedHash = crypto.createHash('sha256').update(JSON.stringify(rawData)).digest('hex');

        const existingItem = { id: 'old-id', content_hash: expectedHash };
        prismaMocks.Aide.findUnique.mockResolvedValue(existingItem);

        const stats = await pipeline.run();

        expect(stats.skipped).toBe(1);
        expect(prismaMocks.Aide.update).not.toHaveBeenCalled();
        expect(prismaMocks.sourceSnapshot.create).not.toHaveBeenCalled(); // No snapshot on skip
    });
});
