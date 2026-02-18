import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import prisma from '../../_utils/prisma.js';
import { verifyAdmin } from '../../_utils/auth.js';
import logger from '../../_utils/logger.js';
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
  if (!raw || raw.toLowerCase() === 'scan') return null;
  return raw;
}

/**
 * @param {string} pathname
 */
function isScanPath(pathname) {
  return /^\/(?:api\/)?admin\/review-queue\/scan\/?$/.test(pathname);
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
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */
export default async function handler(req, res) {
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
        prismaClient: prisma,
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

      const where = {
        status,
        ...(entityType ? { entityType } : {}),
        ...(reason ? { reason } : {}),
      };

      const items = await prisma.reviewQueueItem.findMany({
        where,
        ...(cursor
          ? {
              cursor: { id: cursor },
              skip: 1,
            }
          : {}),
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: limit + 1,
      });

      let nextCursor = null;
      if (items.length > limit) {
        const next = items.pop();
        nextCursor = next?.id || null;
      }

      return res.status(200).json({
        ok: true,
        requestId,
        items,
        pagination: {
          limit,
          nextCursor,
        },
      });
    }

    if (req.method === 'PATCH') {
      if (!itemId) {
        return res.status(400).json({ error: 'Missing review queue item id', requestId });
      }

      const body = parseJsonBody(req.body);
      const nextStatus = parsePatchStatus(/** @type {{ status?: unknown }} */ (body).status);
      if (!nextStatus) {
        return res.status(400).json({ error: 'Invalid status', requestId });
      }

      const item = await prisma.reviewQueueItem.update({
        where: { id: itemId },
        data: { status: nextStatus },
      });

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

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'Not found', requestId });
    }

    return res.status(500).json({ ok: false, requestId, error: 'internal' });
  }
}
