import { computeRawContentHash } from './contentHash.js';
import { env } from './env.js';

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function safeString(value) {
  if (value == null) return null;
  const normalized = String(value).trim();
  return normalized || null;
}

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function safeShortString(value) {
  const normalized = safeString(value);
  if (!normalized) return null;
  return normalized.slice(0, 200);
}

/**
 * Create/update a traceability SourceDocument row and return its id.
 * Reuses the latest row when `(source_url, content_hash)` already exists.
 *
 * @param {import('@prisma/client').PrismaClient} prismaClient
 * @param {{
 *   sourceUrl?: string | null,
 *   rawContent?: string | null,
 *   metadata?: Record<string, unknown> | null,
 * }} input
 * @returns {Promise<{ id: string | null, contentHash: string | null }>}
 */
export async function upsertSourceDocument(prismaClient, input) {
  const sourceUrl = safeString(input?.sourceUrl);
  const rawContent = safeString(input?.rawContent);

  if (!sourceUrl && !rawContent) {
    return { id: null, contentHash: null };
  }

  const contentHash = computeRawContentHash(rawContent || sourceUrl || '');
  const parserVersion = safeShortString(env.ingestion.parserVersion) || 'v1';

  const metadata = {
    parserVersion,
    ...(input?.metadata || {}),
  };

  const existing = await prismaClient.sourceDocument.findFirst({
    where: {
      ...(sourceUrl ? { source_url: sourceUrl } : {}),
      content_hash: contentHash,
    },
    orderBy: { fetched_at: 'desc' },
    select: { id: true },
  });

  if (existing) {
    await prismaClient.sourceDocument.update({
      where: { id: existing.id },
      data: {
        fetched_at: new Date(),
        metadata,
      },
    });
    return { id: existing.id, contentHash };
  }

  const created = await prismaClient.sourceDocument.create({
    data: {
      source_url: sourceUrl,
      fetched_at: new Date(),
      content_hash: contentHash,
      raw_content: rawContent,
      metadata,
    },
    select: { id: true },
  });

  return { id: created.id, contentHash };
}
