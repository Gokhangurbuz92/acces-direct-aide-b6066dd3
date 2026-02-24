
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runIngestAids } from '../../api/_handlers/cron/ingest-aids.js';
import prisma from '../../api/_utils/prisma.js';

// Mock Prisma
vi.mock('../../api/_utils/prisma.js', () => ({
    default: {
        aide: {
            deleteMany: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            count: vi.fn()
        },
        importLog: {
            create: vi.fn()
        },
        sourceDocument: {
            findFirst: vi.fn(),
            create: vi.fn().mockResolvedValue({ id: 'source-doc-test' }),
            update: vi.fn().mockResolvedValue({ id: 'source-doc-test' })
        }
    }
}));

// Mock Fetch
global.fetch = vi.fn();

// Mock Logger to avoid clutter
vi.mock('../../api/lib/logger.js', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
    }
}));

// Mock Connectors (Partial) - actually we want to test integration with connectors,
// but mocking fetch is enough.
// Wait, `GrandEstConnector` does real fetch. I should mock the responses.

describe('Ingestion Pipeline', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should crawl and process items', async () => {
        // 1. Mock Grand Est Listing
        fetch.mockResolvedValueOnce({
            ok: true,
            text: async () => `<html><a href="https://www.grandest.fr/vos-aides-regionales/test">Aide Test</a></html>`
        });

        // 2. Mock Grand Est Detail
        fetch.mockResolvedValueOnce({
            ok: true,
            text: async () => `<html><h1>Titre Grand Est</h1><p>Contenu</p></html>`
        });

        // 3. Mock Agefiph Listing
        fetch.mockResolvedValueOnce({
            ok: true,
            text: async () => `<html><a href="/aides-handicap/test">Aide Agefiph</a></html>`
        });

        // 4. Mock Agefiph Detail
        fetch.mockResolvedValueOnce({
            ok: true,
            text: async () => `<html><h1>Titre Agefiph</h1><p>Contenu</p></html>`
        });

        // 5. Mock Aides Territoires API (paginated JSON)
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                results: [
                    { slug: 'aide-at-1', name: 'Aide AT 1', description: 'Desc 1', url: 'https://at.fr/1' },
                    { slug: 'aide-at-2', name: 'Aide AT 2', description: 'Desc 2', url: 'https://at.fr/2' },
                ],
                next: null, // Single page
            }),
        });

        // DREES connector does not call global.fetch — it uses static data (5 items).
        // Total expected creates: 1 (GrandEst) + 1 (Agefiph) + 2 (AT) + 5 (DREES) = 9

        const stats = await runIngestAids({ limit: 10, runId: 'test', wipe: true });

        expect(prisma.aide.deleteMany).toHaveBeenCalled(); // Wipe called
        expect(prisma.aide.create).toHaveBeenCalledTimes(9); // 9 items created
        expect(stats.created).toBe(9);
    });
});
