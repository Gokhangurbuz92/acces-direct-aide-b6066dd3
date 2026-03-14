import { checkRateLimit, getClientIp, getRateLimitStatus } from '../../_utils/rateLimit.js';
import logger from '../../_utils/logger.js';
import { randomUUID } from 'crypto';
import { db } from '../../../src/db/index.js';
import { ReviewQueueItem } from '../../../src/db/schema.js';
import { eq, inArray, and, desc } from 'drizzle-orm';
import { verifyAdmin } from '../../_utils/auth.js';
import { reviewQueuePatchSchema, reviewQueueBulkPatchSchema } from '../../../src/db/drizzle-schemas.js';
import {
  normalizeEntityType,
  normalizeReviewStatus,
  parsePatchStatus,
  scanDataQuality,
} from '../../_utils/dataQuality.js';

/**
 * @param {string | undefined} url
 * @param {string | undefined} host
 */
function extractPath(url, host = 'localhost') {
  if (!url) return '';
  try {
    return new URL(url, `https://${host}`).pathname || '';
  } catch {
    return '';
  }
}

/**
 * @param {string} pathname
 */
function extractReviewQueueId(pathname) {
  const match = pathname.match(/^\/(?:api\/)?admin\/review-queue\/([^/?#]+)/);
  if (!match) return null;
  const raw = decodeURIComponent(match[1] || '').trim();
  const lowered = raw.toLowerCase();
  if (!raw || lowered === 'scan' || lowered === 'bulk') return null;
  return raw;
}

/**
 * @param {string} pathname
 */
function isScanPath(pathname) {
  return /^\/(?:api\/)?admin\/review-queue\/scan\/?$/.test(pathname);
}

/**
 * @param {string} pathname
 */
function isBulkPath(pathname) {
  return /^\/(?:api\/)?admin\/review-queue\/bulk\/?$/.test(pathname);
}

/**
 * @param {unknown} raw
 */
function parseJsonBody(raw) {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === 'object' && parsed ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

/**
 * @param {unknown} raw
 * @param {number} fallback
 */
function parseLimit(raw, fallback) {
  const parsed = Number.parseInt(String(raw || ''), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, 200);
}

/**
 * @param {unknown} raw
 */
function parseReason(raw) {
  const value = String(raw || '').trim();
  if (!value) return null;
  return value.slice(0, 120);
}

/**
 * @param {unknown} raw
 * @returns {string[] | null}
 */
function parseBulkIds(raw) {
  if (!Array.isArray(raw)) return null;
  if (raw.length === 0 || raw.length > 200) return null;

  /** @type {string[]} */
  const out = [];
  const seen = new Set();

  for (const candidate of raw) {
    const normalized = String(candidate || '').trim();
    if (!normalized) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
    if (out.length > 200) return null;
  }

  if (out.length === 0) return null;
  return out;
}

/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */
export default async function handler(req, res) {
    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit('ADMIN_API', ip);
    if (!rateLimit.allowed) {
        return res.status(getRateLimitStatus(rateLimit)).json(rateLimit.error);
    }

  const requestId = typeof req.requestId === 'string' ? req.requestId : randomUUID();

  if (!verifyAdmin(req)) {
    return res.status(401).json({ error: 'Unauthorized: Admin Token Required', requestId });
  }

  const pathname = extractPath(req.url, req.headers?.host);
  const itemId = extractReviewQueueId(pathname);

  try {
    if (req.method === 'POST') {
      if (!isScanPath(pathname)) {
        return res.status(404).json({ error: 'Not found', requestId });
      }

      const body = parseJsonBody(req.body);
      const bodyLimit = /** @type {{ limitPerType?: unknown }} */ (body).limitPerType;
      const limitPerType = bodyLimit == null ? undefined : parseLimit(bodyLimit, 200);

      const summary = await scanDataQuality({
        db,
        limitPerType,
      });

      return res.status(200).json({
        ok: true,
        requestId,
        ...summary,
      });
    }

    if (req.method === 'GET') {
      const status = normalizeReviewStatus(req.query?.status, 'open');
      const entityType = normalizeEntityType(req.query?.entityType);
      const reason = parseReason(req.query?.reason);
      const limit = parseLimit(req.query?.limit, 50);
      const cursor = req.query?.cursor ? String(req.query.cursor).trim() : null;

      const conditions = [];
      if (status) conditions.push(eq(ReviewQueueItem.status, status.toUpperCase()));
      if (entityType) conditions.push(eq(ReviewQueueItem.entityType, entityType.toUpperCase()));
      if (reason) conditions.push(eq(ReviewQueueItem.reason, reason));
      let selectQuery = db.select().from(ReviewQueueItem).$dynamic();
      if (conditions.length > 0) {
        selectQuery = selectQuery.where(and(...conditions));
      }
      const items = await selectQuery.orderBy(desc(ReviewQueueItem.createdAt), desc(ReviewQueueItem.id)).limit(limit + 1);


      let nextCursor = null;
      if (items.length > limit) {
        const next = items.pop();
        nextCursor = next?.id || null;
      }

      return res.status(200).json({
        ok: true,
        requestId,
        _debugSQL: selectQuery.toSQL(),
        items,
        pagination: {
          limit,
          nextCursor,
        },
      });
    }

    if (req.method === 'PATCH') {
      if (isBulkPath(pathname)) {
        const bulkResult = reviewQueueBulkPatchSchema.safeParse(parseJsonBody(req.body));
        if (!bulkResult.success) {
          return res.status(400).json({ error: 'Invalid bulk payload', requestId, details: bulkResult.error.flatten() });
        }

        const { ids, status: nextStatus } = bulkResult.data;

        const existing = await db.select({ id: ReviewQueueItem.id, status: ReviewQueueItem.status }).from(ReviewQueueItem).where(inArray(ReviewQueueItem.id, ids));

        const updatableIds = existing
          .filter(/** @param {{ id: string, status: string }} item */ (item) => item.status === 'open')
          .map(/** @param {{ id: string }} item */ (item) => item.id);

        const updateResult = updatableIds.length > 0
          ? await db.update(ReviewQueueItem).set({ status: nextStatus }).where(
              and(inArray(ReviewQueueItem.id, updatableIds), eq(ReviewQueueItem.status, 'open'))
            ).returning({ id: ReviewQueueItem.id })
          : [];

        const updated = updateResult.length;
        const existingCount = existing.length;
        const notFound = Math.max(0, ids.length - existingCount);
        const skipped = Math.max(0, existingCount - updated);

        return res.status(200).json({
          ok: true,
          requestId,
          result: {
            updated,
            skipped,
            notFound,
          },
        });
      }

      if (!itemId) {
        return res.status(400).json({ error: 'Missing review queue item id', requestId });
      }

      const patchResult = reviewQueuePatchSchema.safeParse(parseJsonBody(req.body));
      if (!patchResult.success) {
        return res.status(400).json({ error: 'Invalid status', requestId, details: patchResult.error.flatten() });
      }

      const { status: nextStatus } = patchResult.data;

      const [item] = await db.update(ReviewQueueItem).set({ status: nextStatus }).where(eq(ReviewQueueItem.id, itemId)).returning();
      if (!item) {
        return res.status(404).json({ error: 'Not found', requestId });
      }

      return res.status(200).json({
        ok: true,
        requestId,
        item,
      });
    }

    return res.status(405).json({ error: 'Method Not Allowed', requestId });
  } catch (error) {
    logger.error(
      {
        requestId,
        path: pathname,
        method: req.method,
        error: error instanceof Error ? error.message : 'unknown_error',
      },
      'admin.review_queue.error',
    );

    if (error instanceof Error && error.message.includes('Not found')) {
      return res.status(404).json({ error: 'Not found', requestId });
    }

    return res.status(500).json({ ok: false, requestId, error: 'internal' });
  }
}
