import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { runRssIngest } from '../../api/_handlers/cron/rss-ingest.js';

const prisma = new PrismaClient();

describe('RSS Ingestion Pipeline', () => {
  let testSourceId;

  beforeAll(async () => {
    // Create a test RSS source
    const testSource = await prisma.rssSource.create({
      data: {
        name: 'Test Source',
        feed_url: 'https://www.service-public.fr/particuliers/actualites.rss',
        domain: 'service-public.fr',
        trust_level: 'OFFICIAL',
        enabled: true,
      },
    });
    testSourceId = testSource.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.actualite.deleteMany({
      where: { source_id: testSourceId },
    });
    await prisma.rssSource.delete({
      where: { id: testSourceId },
    });
    await prisma.$disconnect();
  });

  it('should fetch and process RSS feed items', async () => {
    const stats = await runRssIngest({ 
      limit: 5, 
      dryRun: false,
      sourceId: testSourceId 
    });

    expect(stats).toBeDefined();
    expect(stats.fetched).toBeGreaterThan(0);
    expect(stats.processed).toBeGreaterThan(0);
    expect(stats.errors).toBeInstanceOf(Array);
  }, 30000); // 30s timeout for network request

  it('should deduplicate items correctly', async () => {
    // First run
    const firstRun = await runRssIngest({ 
      limit: 3, 
      dryRun: false,
      sourceId: testSourceId 
    });

    // Second run (should skip duplicates)
    const secondRun = await runRssIngest({ 
      limit: 3, 
      dryRun: false,
      sourceId: testSourceId 
    });

    expect(secondRun.skipped).toBeGreaterThan(0);
    expect(secondRun.created).toBe(0);
  }, 60000);

  it('should categorize items based on content', async () => {
    await runRssIngest({ 
      limit: 5, 
      dryRun: false,
      sourceId: testSourceId 
    });

    const items = await prisma.actualite.findMany({
      where: { source_id: testSourceId },
      take: 5,
    });

    expect(items.length).toBeGreaterThan(0);
    items.forEach(item => {
      expect(item.categorie).toBeDefined();
      expect(typeof item.categorie).toBe('string');
    });
  }, 30000);

  it('should calculate reliability scores', async () => {
    await runRssIngest({ 
      limit: 5, 
      dryRun: false,
      sourceId: testSourceId 
    });

    const items = await prisma.actualite.findMany({
      where: { source_id: testSourceId },
      take: 5,
    });

    items.forEach(item => {
      expect(item.score_fiabilite).toBeGreaterThanOrEqual(0);
      expect(item.score_fiabilite).toBeLessThanOrEqual(100);
      // Official sources should have high scores
      expect(item.score_fiabilite).toBeGreaterThan(80);
    });
  }, 30000);

  it('should generate unique slugs', async () => {
    await runRssIngest({ 
      limit: 10, 
      dryRun: false,
      sourceId: testSourceId 
    });

    const items = await prisma.actualite.findMany({
      where: { source_id: testSourceId },
    });

    const slugs = items.map(item => item.slug);
    const uniqueSlugs = new Set(slugs);

    expect(slugs.length).toBe(uniqueSlugs.size);
  }, 30000);

  it('should handle dry run mode', async () => {
    const beforeCount = await prisma.actualite.count({
      where: { source_id: testSourceId },
    });

    const stats = await runRssIngest({ 
      limit: 5, 
      dryRun: true,
      sourceId: testSourceId 
    });

    const afterCount = await prisma.actualite.count({
      where: { source_id: testSourceId },
    });

    expect(stats.fetched).toBeGreaterThan(0);
    expect(afterCount).toBe(beforeCount); // No new items created
  }, 30000);

  it('should create update logs', async () => {
    const beforeLogCount = await prisma.updateLog.count();

    await runRssIngest({ 
      limit: 3, 
      dryRun: false,
      sourceId: testSourceId 
    });

    const afterLogCount = await prisma.updateLog.count();

    expect(afterLogCount).toBeGreaterThan(beforeLogCount);

    const latestLog = await prisma.updateLog.findFirst({
      orderBy: { ran_at: 'desc' },
    });

    expect(latestLog.source_name).toBe('RSS_INGEST');
    expect(latestLog.status).toMatch(/SUCCESS|PARTIAL/);
  }, 30000);

  it('should update source last_run_at timestamp', async () => {
    const beforeSource = await prisma.rssSource.findUnique({
      where: { id: testSourceId },
    });

    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s

    await runRssIngest({ 
      limit: 2, 
      dryRun: false,
      sourceId: testSourceId 
    });

    const afterSource = await prisma.rssSource.findUnique({
      where: { id: testSourceId },
    });

    if (beforeSource.last_run_at) {
      expect(afterSource.last_run_at.getTime()).toBeGreaterThan(
        beforeSource.last_run_at.getTime()
      );
    } else {
      expect(afterSource.last_run_at).toBeDefined();
    }
  }, 30000);
});
