import { vi, describe, it, expect, beforeEach } from 'vitest';
import handler from './pipeline.js';
import * as ingestStructures from './ingest-structures.js';
import { getCronAuth } from '../../_utils/cronAuth.js';

// Mock Dependencies
vi.mock('../../_utils/cronAuth.js');
vi.mock('./ingest-structures.js');
vi.mock('./ingest-aids.js');
vi.mock('@prisma/client', () => {
    return {
        PrismaClient: class {
            constructor() {
                this.importLog = { create: vi.fn() };
                this.rssSource = { findMany: vi.fn().mockResolvedValue([]) };
                this.actualite = { upsert: vi.fn(), findMany: vi.fn() };
                this.structure = { upsert: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), findUnique: vi.fn() };
                this.aide = { upsert: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() };
            }
        }
    };
});

describe('Pipeline Regression Test (P0)', () => {
    let req, res;

    beforeEach(() => {
        vi.resetAllMocks();
        // Default authorized
        getCronAuth.mockReturnValue({ ok: true });

        req = {
            query: { source: 'structures', mode: 'smoke' },
            headers: {}
        };

        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
    });

    it('should return 502 when fetchMs=0 and errors=[] (Silent Failure Contract)', async () => {
        // Mock Ingester returning "Empty/No-Op" result
        ingestStructures.runIngestStructures.mockResolvedValue({
            fetched: 0,
            processed: 0,
            created: 0,
            updated: 0,
            skippedExisting: 0,
            errors: [],
            durationByStage: {
                fetchMs: 0,     // <--- The Trigger
                processingMs: 0
            }
        });

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(502);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            ok: false,
            error: expect.stringContaining('PIPELINE_NOOP')
        }));
    });

    it('should return 200 and stats.ingested when execution is valid', async () => {
        // Mock Ingester returning Valid Result
        ingestStructures.runIngestStructures.mockResolvedValue({
            fetched: 5,
            processed: 5,
            created: 2,
            updated: 3,
            skippedExisting: 0,
            errors: [],
            durationByStage: {
                fetchMs: 150,
                processingMs: 50
            }
        });

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const json = res.json.mock.calls[0][0];

        expect(json.ok).toBe(true);
        expect(json.stats.durationByStage.fetchMs).toBe(150);
        // Requirement: stats.ingested != null (mapped from created)
        expect(json.stats.ingested).toBe(2);
    });
});
