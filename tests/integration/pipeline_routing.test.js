
import { describe, it, expect, vi, beforeEach } from 'vitest';
import pipelineHandler from '../../api/_handlers/cron/pipeline.js';

// Mock dependencies
vi.mock('../../api/_handlers/cron/ingest-structures.js', () => ({
    default: vi.fn().mockResolvedValue({ created: 10, errors: [] })
}));
vi.mock('../../api/_handlers/cron/ingest-aids.js', () => ({
    default: vi.fn().mockResolvedValue({ created: 5, errors: [] })
}));
vi.mock('@prisma/client', () => {
    const MockPrismaClient = vi.fn();
    MockPrismaClient.prototype.rssSource = {
        upsert: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
    };
    MockPrismaClient.prototype.importLog = {
        create: vi.fn(),
    };
    MockPrismaClient.prototype.$disconnect = vi.fn();
    return { PrismaClient: MockPrismaClient };
});

// Setup req/res mocks
const createMocks = (query = {}, headers = {}) => {
    const req = {
        query,
        headers: { host: 'localhost', ...headers },
        url: '/api/cron/pipeline'
    };
    const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
    };
    return { req, res };
};

describe('Cron Pipeline Routing', () => {
    const CRON_SECRET = 'test_secret';

    beforeEach(() => {
        process.env.CRON_SECRET = CRON_SECRET;
        vi.clearAllMocks();
    });

    it('should return 401 if unauthorized', async () => {
        const { req, res } = createMocks({});
        await pipelineHandler(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should return 400 if source is missing', async () => {
        const { req, res } = createMocks({ secret: CRON_SECRET });
        await pipelineHandler(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining("Missing required 'source'") }));
    });

    it('should route to structures when source=structures', async () => {
        const { req, res } = createMocks({ secret: CRON_SECRET, source: 'structures' });
        const ingestStructures = (await import('../../api/_handlers/cron/ingest-structures.js')).default;

        await pipelineHandler(req, res);

        expect(ingestStructures).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ source: 'structures', ok: true }));
    });

    it('should pass limiting params when mode=smoke', async () => {
        const { req, res } = createMocks({ secret: CRON_SECRET, source: 'structures', mode: 'smoke' });
        const ingestStructures = (await import('../../api/_handlers/cron/ingest-structures.js')).default;

        await pipelineHandler(req, res);

        // Check if limit was passed (implementation detail: pipeline passes query with limit)
        const callArgs = ingestStructures.mock.calls[0][0]; // first arg is req-like object
        expect(callArgs.query.limit).toBe("5");
    });


    it('should support aliases: demarches -> aides', async () => {
        const { req, res } = createMocks({ secret: CRON_SECRET, source: 'demarches' });
        const ingestAids = (await import('../../api/_handlers/cron/ingest-aids.js')).default;

        await pipelineHandler(req, res);

        expect(ingestAids).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            source: 'demarches',
            sourceResolved: 'aides',
            ok: true
        }));
    });

    it('should return rich stats structure', async () => {
        const { req, res } = createMocks({ secret: CRON_SECRET, source: 'structures' });

        await pipelineHandler(req, res);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            stats: expect.objectContaining({
                fetched: expect.any(Number),
                processed: expect.any(Number),
                created: expect.any(Number),
                skippedExisting: expect.any(Number),
                durationByStage: expect.any(Object)
            })
        }));
    });

    it('should return 400 for invalid source', async () => {
        const { req, res } = createMocks({ secret: CRON_SECRET, source: 'invalid' });

        await pipelineHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: false, error: expect.stringContaining("Invalid source") }));
    });
});
