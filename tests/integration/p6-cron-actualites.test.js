import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import prisma from '../../api/_utils/prisma.js';

const FEED_URL = 'http://example.test/rss-p6-cron';
const CANONICAL_URL = 'http://example.test/article-p6-cron-1';

const MANIFEST = [
  {
    id: 'p6-test',
    name: 'P6 Test Source',
    feedUrl: FEED_URL,
    domain: 'example.test',
    trustLevel: 'OFFICIAL',
    enabled: true,
    category: 'general',
    territory: 'FRANCE',
  },
];

const RSS_XML = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Feed</title>
    <item>
      <title>P6 Cron Article</title>
      <link>${CANONICAL_URL}</link>
      <description>Summary</description>
      <pubDate>Wed, 01 Jan 2026 00:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

vi.mock('fs', async () => {
  const actual = await vi.importActual('fs');
  const mocked = {
    ...actual,
    existsSync: vi.fn((filePath) => {
      const p = String(filePath);
      if (p.includes(`${String(process.cwd())}/data/news-sources.json`)) return true;
      return actual.existsSync(filePath);
    }),
    readFileSync: vi.fn((filePath, ...args) => {
      const p = String(filePath);
      if (p.includes(`${String(process.cwd())}/data/news-sources.json`)) {
        return JSON.stringify(MANIFEST);
      }
      return actual.readFileSync(filePath, ...args);
    }),
  };
  return { ...mocked, default: mocked };
});

function createMockReq({ headers = {}, query = {}, url = '/api/cron/actualites' } = {}) {
  return {
    method: 'GET',
    url,
    query,
    headers: {
      host: 'localhost:3000',
      'x-forwarded-proto': 'http',
      ...headers,
    },
  };
}

function createMockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    setHeader() {},
    writeHead(code) {
      this.statusCode = code;
      return this;
    },
    end() {
      return this;
    },
  };
  return res;
}

describe('P6 Cron Actualites (secure + idempotent)', () => {
  const ORIGINAL_CRON_SECRET = process.env.CRON_SECRET;
  /** @type {any} */
  let originalFetch;

  beforeEach(() => {
    process.env.CRON_SECRET = 'test-cron-secret';
    originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue(RSS_XML),
    });
  });

  afterEach(async () => {
    process.env.CRON_SECRET = ORIGINAL_CRON_SECRET;
    global.fetch = originalFetch;

    await prisma.actualite.deleteMany({ where: { canonical_url: CANONICAL_URL } });
    await prisma.rssSource.deleteMany({ where: { feed_url: FEED_URL } });
    await prisma.cronRun.deleteMany({ where: { job: 'actualites' } });
  });

  it('does not duplicate items when executed twice', async () => {
    // Import after fs mock is applied.
    const { default: handler } = await import('../../api/_handlers/cron/actualites.js');

    const req1 = createMockReq({
      url: '/api/cron/actualites?limit=1',
      query: { limit: '1' },
      headers: { 'x-cron-secret': 'test-cron-secret' },
    });
    const res1 = createMockRes();

    await handler(req1, res1);
    expect(res1.statusCode).toBe(200);
    expect(res1.body?.cronRunId).toBeTruthy();

    const req2 = createMockReq({
      url: '/api/cron/actualites?limit=1',
      query: { limit: '1' },
      headers: { 'x-cron-secret': 'test-cron-secret' },
    });
    const res2 = createMockRes();

    await handler(req2, res2);
    expect(res2.statusCode).toBe(200);
    expect(res2.body?.cronRunId).toBeTruthy();

    const count = await prisma.actualite.count({ where: { canonical_url: CANONICAL_URL } });
    expect(count).toBe(1);

    const runs = await prisma.cronRun.findMany({ where: { job: 'actualites' }, orderBy: { startedAt: 'asc' } });
    expect(runs).toHaveLength(2);
    expect(runs.every((run) => run.status === 'success')).toBe(true);
  });
});
