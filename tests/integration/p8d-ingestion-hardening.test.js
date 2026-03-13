import { afterEach, describe, expect, it } from 'vitest';

import { db } from '../../src/db/index.js';
import * as schema from '../../src/db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { scanDataQuality } from '../../api/_utils/dataQuality.js';
import { upsertActualiteFromFeedItem } from '../../api/_handlers/cron/ingest-actualites-rss.js';
import { ensureSlugOrNull } from '../../api/_utils/slug.js';

/** @type {{ actualiteIds: string[], aideIds: string[], demarcheIds: string[], sourceDocumentIds: string[] }} */
const created = {
  actualiteIds: [],
  aideIds: [],
  demarcheIds: [],
  sourceDocumentIds: [],
};

afterEach(async () => {
  const entityIds = [...created.actualiteIds, ...created.aideIds, ...created.demarcheIds];
  if (entityIds.length > 0) {
    await await db.delete(schema.ReviewQueueItem);
  }

  if (created.actualiteIds.length > 0) {
    await await db.delete(schema.Actualite);
  }
  if (created.aideIds.length > 0) {
    await await db.delete(schema.Aide);
  }
  if (created.demarcheIds.length > 0) {
    await await db.delete(schema.Demarche);
  }
  if (created.sourceDocumentIds.length > 0) {
    await await db.delete(schema.SourceDocument);
  }

  created.actualiteIds = [];
  created.aideIds = [];
  created.demarcheIds = [];
  created.sourceDocumentIds = [];
});

describe('P8-D ingestion hardening contracts', () => {
  it('is idempotent on rerun, links SourceDocument, and skips unchanged payloads', async () => {
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const canonicalUrl = `https://example.org/p8d/${uniqueSuffix}`;

    const source = { id: `src-${uniqueSuffix}`, name: 'P8D Source' };
    const item = {
      title: 'Aide Étudiant Strasbourg',
      link: canonicalUrl,
      contentSnippet: 'Résumé stable',
      content: 'Contenu stable',
      isoDate: '2026-02-01T10:00:00.000Z',
      guid: canonicalUrl,
    };

    const first = await upsertActualiteFromFeedItem({
      prismaClient: prisma,
      source,
      feedUrl: 'https://example.org/rss.xml',
      category: 'general',
      territory: 'FRANCE',
      item,
      runId: `run-${uniqueSuffix}`,
      isOfficial: true,
    });

    expect(first.action).toBe('created');

    const createdActualite = await db.query.Actualite.findFirst({ where: eq(schema.Actualite.id, "TODO_FIX_WHERE") /* AUTOMIGRATED: { canonical_url: canonicalUrl },       select: { id: true, updatedAt: true, source_document_id: true },      */ });
    expect(createdActualite?.id).toBeTruthy();
    expect(createdActualite?.source_document_id).toBeTruthy();

    created.actualiteIds.push(createdActualite.id);
    created.sourceDocumentIds.push(String(createdActualite.source_document_id));

    const linkedSource = await db.query.SourceDocument.findFirst({ where: eq(schema.SourceDocument.id, "TODO_FIX_WHERE") /* AUTOMIGRATED: { id: String(createdActualite.source_document_id) },       select: { source_url: true, content_hash: true },      */ });
    expect(linkedSource?.source_url).toBe(canonicalUrl);
    expect(typeof linkedSource?.content_hash).toBe('string');

    const second = await upsertActualiteFromFeedItem({
      prismaClient: prisma,
      source,
      feedUrl: 'https://example.org/rss.xml',
      category: 'general',
      territory: 'FRANCE',
      item,
      runId: `run-${uniqueSuffix}-2`,
      isOfficial: true,
    });

    expect(second.action).toBe('skipped');

    const afterSecondRun = await db.query.Actualite.findFirst({ where: eq(schema.Actualite.id, "TODO_FIX_WHERE") /* AUTOMIGRATED: { canonical_url: canonicalUrl },       select: { id: true, updatedAt: true },      */ });

    expect(afterSecondRun?.id).toBe(createdActualite.id);
    expect(afterSecondRun?.updatedAt.getTime()).toBe(createdActualite.updatedAt.getTime());

    const duplicateCount = await (await db.select({ count: sql`count(*)` }).from(schema.Actualite))[0].count;
    expect(duplicateCount).toBe(1);
  });

  it('normalizes slugs and maps invalid slugs to null', async () => {
    expect(ensureSlugOrNull('  Àide Été 2026 !!! ')).toBe('aide-ete-2026');
    expect(ensureSlugOrNull('###')).toBeNull();
  });

  it('feeds review queue for missing slug, missing source document and missing source URL', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

    const aideMissingSlug = await (await db.insert(schema.Aide).values({
        titre: `P8D aide missing slug ${suffix}`,
        slug: ensureSlugOrNull('###'),
        territoires: ['FRANCE'],
        documents_necessaires: ['piece-identite'],
        date_verification: new Date(),
        statut: 'publie',
      },
      select: { id: true },
    ).returning())[0];
    created.aideIds.push(aideMissingSlug.id);

    const sourceWithoutUrl = await (await db.insert(schema.SourceDocument).values({
        source_url: null,
        content_hash: `p8d-${suffix}`,
        metadata: {},
      },
      select: { id: true },
    ).returning())[0];
    created.sourceDocumentIds.push(sourceWithoutUrl.id);

    const demarcheWithBrokenSource = await (await db.insert(schema.Demarche).values({
        titre: `P8D demarche source url ${suffix}`,
        slug: `p8d-demarche-${suffix}`,
        date_verification: new Date(),
        documents_necessaires: ['piece-identite'],
        statut: 'publie',
        source_document_id: sourceWithoutUrl.id,
      },
      select: { id: true },
    ).returning())[0];
    created.demarcheIds.push(demarcheWithBrokenSource.id);

    const summary = await scanDataQuality({
      prismaClient: prisma,
      limitPerType: 1000,
    });
    expect(summary.openTotal).toBeGreaterThan(0);

    const aideOpenItems = await db.query.ReviewQueueItem.findMany({
      where: {
        entityType: 'aide',
        entityId: aideMissingSlug.id,
        status: 'open',
      },
      select: { reason: true },
    });
    const aideReasons = new Set(aideOpenItems.map((item) => item.reason));
    expect(aideReasons.has('MISSING_SLUG')).toBe(true);
    expect(aideReasons.has('MISSING_SOURCE_DOCUMENT')).toBe(true);

    const demarcheOpenItems = await db.query.ReviewQueueItem.findMany({
      where: {
        entityType: 'demarche',
        entityId: demarcheWithBrokenSource.id,
        status: 'open',
      },
      select: { reason: true },
    });
    const demarcheReasons = new Set(demarcheOpenItems.map((item) => item.reason));
    expect(demarcheReasons.has('MISSING_SOURCE_URL')).toBe(true);
  });
});
