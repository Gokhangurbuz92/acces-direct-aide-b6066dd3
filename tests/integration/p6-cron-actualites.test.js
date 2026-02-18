import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import prisma from '../../api/_utils/prisma.js';
import { kv } from '../../api/_utils/kv.js';

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

    await kv.del('cron:actualites:lock');
    await prisma.actualite.deleteMany({ where: { canonical_url: CANONICAL_URL } });
    await prisma.rssSource.deleteMany({ where: { feed_url: FEED_URL } });
    await prisma.cronRun.deleteMany({ where: { job: 'actualites' } });
  });

  it('prevents flooding via lock and remains idempotent across runs', async () => {
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
    expect(res2.statusCode).toBe(202);
    expect(res2.body?.skipped).toBe(true);
    expect(res2.body?.reason).toBe('locked');

    // Simulate lock expiry + cooldown window passing (no waiting in tests).
    await kv.del('cron:actualites:lock');
    await prisma.cronRun.updateMany({
      where: { job: 'actualites' },
      data: { startedAt: new Date(Date.now() - 11 * 60 * 1000) },
    });

    const req3 = createMockReq({
      url: '/api/cron/actualites?limit=1',
      query: { limit: '1' },
      headers: { 'x-cron-secret': 'test-cron-secret' },
    });
    const res3 = createMockRes();

    await handler(req3, res3);
    expect(res3.statusCode).toBe(200);
    expect(res3.body?.cronRunId).toBeTruthy();

    const count = await prisma.actualite.count({ where: { canonical_url: CANONICAL_URL } });
    expect(count).toBe(1);

    const runs = await prisma.cronRun.findMany({ where: { job: 'actualites' }, orderBy: { startedAt: 'asc' } });
    expect(runs).toHaveLength(3);
    expect(runs[0]?.status).toBe('success');
    expect(runs[1]?.status).toBe('skipped');
    expect(runs[1]?.skipReason).toBe('locked');
    expect(runs[2]?.status).toBe('success');
  });

  it('records skipped cooldown runs after a recent success', async () => {
    const { default: handler } = await import('../../api/_handlers/cron/actualites.js');

    const successReq = createMockReq({
      url: '/api/cron/actualites?limit=1',
      query: { limit: '1' },
      headers: { 'x-cron-secret': 'test-cron-secret' },
    });
    const successRes = createMockRes();

    await handler(successReq, successRes);
    expect(successRes.statusCode).toBe(200);

    // Bypass lock TTL to reach cooldown logic immediately.
    await kv.del('cron:actualites:lock');

    const cooldownReq = createMockReq({
      url: '/api/cron/actualites?limit=1',
      query: { limit: '1' },
      headers: { 'x-cron-secret': 'test-cron-secret' },
    });
    const cooldownRes = createMockRes();

    await handler(cooldownReq, cooldownRes);
    expect(cooldownRes.statusCode).toBe(202);
    expect(cooldownRes.body?.skipped).toBe(true);
    expect(cooldownRes.body?.reason).toBe('cooldown');

    const latestRuns = await prisma.cronRun.findMany({
      where: { job: 'actualites' },
      orderBy: { startedAt: 'desc' },
      take: 2,
    });
    expect(latestRuns).toHaveLength(2);
    expect(latestRuns[0]?.status).toBe('skipped');
    expect(latestRuns[0]?.skipReason).toBe('cooldown');
    expect(latestRuns[1]?.status).toBe('success');
  });
});
