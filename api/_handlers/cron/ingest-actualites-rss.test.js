import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  return {
    rssSourceUpsert: vi.fn().mockResolvedValue({}),
    rssSourceFindMany: vi.fn().mockResolvedValue([
      {
        id: 'src1',
        name: 'Test Source',
        feed_url: 'http://test.com/rss',
        trust_level: 'OFFICIAL',
        enabled: true,
      },
    ]),
    actualiteFindFirst: vi.fn(),
    actualiteUpsert: vi.fn().mockResolvedValue({}),
    fetch: vi.fn(),
    parseString: vi.fn(),
  };
});

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class {
      constructor() {
        this.rssSource = {
          upsert: mocks.rssSourceUpsert,
          findMany: mocks.rssSourceFindMany,
        };
        this.actualite = {
          findFirst: mocks.actualiteFindFirst,
          upsert: mocks.actualiteUpsert,
        };
      }
    },
  };
});

vi.mock('rss-parser', () => {
  return {
    default: class {
      /** @param {string} xml */
      parseString(xml) {
        return mocks.parseString(xml);
      }
    },
  };
});

vi.mock('fs', async () => {
  const actual = await vi.importActual('fs');
  const mocked = {
    ...actual,
    existsSync: vi.fn((filePath) => String(filePath).includes(`${String(process.cwd())}/data/news-sources.json`)),
    readFileSync: vi.fn(() =>
      JSON.stringify([
        {
          id: 'enabled',
          name: 'Test Source',
          feedUrl: 'http://test.com/rss',
          domain: 'test.com',
          trustLevel: 'OFFICIAL',
          enabled: true,
          category: 'general',
          territory: 'FRANCE',
        },
        {
          id: 'disabled',
          name: 'Disabled Source',
          feedUrl: 'http://disabled.test/rss',
          domain: 'disabled.test',
          trustLevel: 'OFFICIAL',
          enabled: false,
          category: 'general',
          territory: 'FRANCE',
        },
      ]),
    ),
  };
  return { ...mocked, default: mocked };
});

describe('runIngestActualitesRss', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    global.fetch = mocks.fetch;
    mocks.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue('<xml />'),
    });

    mocks.parseString.mockResolvedValue({
      items: [
        {
          title: 'Test News',
          link: 'http://test.com/news/1',
          contentSnippet: 'Summary',
          isoDate: '2026-01-01T00:00:00.000Z',
        },
        {
          title: 'Test News (duplicate link)',
          link: 'http://test.com/news/1',
          contentSnippet: 'Updated Summary',
          isoDate: '2026-01-01T00:00:00.000Z',
        },
      ],
    });
  });

  it('does not ingest disabled sources from the manifest (seeding sets enabled=false)', async () => {
    const { runIngestActualitesRss } = await import('./ingest-actualites-rss.js');
    await runIngestActualitesRss({ limit: 5, runId: 'run-1' });

    expect(mocks.rssSourceUpsert).toHaveBeenCalled();
    expect(mocks.rssSourceUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { feed_url: 'http://disabled.test/rss' },
        update: expect.objectContaining({ enabled: false }),
      }),
    );
  });

  it('upserts by canonical_url and does not create duplicates', async () => {
    mocks.actualiteFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'a1', slug: 'keep-slug', statut: 'publie', published_at: null });

    const { runIngestActualitesRss } = await import('./ingest-actualites-rss.js');
    const stats = await runIngestActualitesRss({ limit: 10, runId: 'run-2' });

    expect(stats.created).toBe(1);
    expect(stats.updated).toBe(1);
    expect(stats.processed).toBe(2);

    expect(mocks.actualiteUpsert).toHaveBeenCalledTimes(2);
    const secondCall = mocks.actualiteUpsert.mock.calls[1]?.[0];
    expect(secondCall.update.slug).toBe('keep-slug');
    expect(secondCall.update).toEqual(expect.objectContaining({ statut: 'publie' }));
  });
});
