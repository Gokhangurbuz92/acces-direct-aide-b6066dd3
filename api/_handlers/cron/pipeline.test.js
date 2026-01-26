import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  return {
    upsert: vi.fn().mockResolvedValue({ id: '1', fetched_at: new Date() }),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    parseURL: vi.fn(),
  }
});

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class {
      constructor() {
        this.rssSource = {
          upsert: mocks.upsert,
          findMany: mocks.findMany,
          update: mocks.update,
        };
        this.actualite = {
          upsert: mocks.upsert,
          findMany: mocks.findMany,
          update: mocks.update,
          findFirst: mocks.findFirst,
        };
        this.importLog = {
          create: mocks.create,
        };
      }
    }
  };
});

vi.mock('rss-parser', () => {
  return {
    default: class {
      constructor() {
        this.parseURL = mocks.parseURL;
      }
    }
  };
});

vi.mock('../../lib/falc-summarizer.js', () => ({
  summarizeToFalc: vi.fn().mockResolvedValue({ summary: 'FALC', key_points: [] })
}));

// Mock FS for config
vi.mock('fs', async () => {
    const actual = await vi.importActual('fs');
    return {
        ...actual,
        existsSync: vi.fn().mockReturnValue(true),
        readFileSync: vi.fn().mockReturnValue(JSON.stringify([{
            name: "Test Source",
            url: "http://test.com/rss",
            domain: "test.com",
            trust_level: "OFFICIAL"
        }]))
    };
});

import { GET } from './pipeline.js';

describe('News Pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'test-secret';
  });

  it('should unauthorized if no secret', async () => {
    const req = {
      url: 'http://localhost/api/cron/pipeline',
      headers: { get: () => null }
    };
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('should run pipeline successfully', async () => {
    // Setup mocks
    mocks.findMany.mockImplementation((args) => {
        if (args && args.where && args.where.enabled === true) {
             return Promise.resolve([{ // Sources
                id: 'src1',
                name: 'Test Source',
                feed_url: 'http://test.com/rss',
                trust_level: 'OFFICIAL',
                enabled: true
            }]);
        }
        return Promise.resolve([]);
    });

    mocks.parseURL.mockResolvedValueOnce({
        items: [{
            title: 'Test News',
            link: 'http://test.com/news/1',
            contentSnippet: 'Summary',
            isoDate: new Date().toISOString()
        }]
    });

    const req = {
      url: 'http://localhost/api/cron/pipeline?secret=test-secret',
      headers: { get: () => null }
    };

    const res = await GET(req);
    expect(res.status).toBe(200);

    // Verify RssSource upsert (from config)
    expect(mocks.upsert).toHaveBeenCalled();
  });
});
