import logger from '../../_utils/logger.js';
import { randomUUID } from 'crypto';
import prisma from '../../_utils/prisma.js';
import { env } from '../../_utils/env.js';
import { applyNoIndex } from '../../_utils/robots.js';

const TIMEOUT_MS = 2000;

/**
 * @template T
 * @param {Promise<T>} promise
 * @param {number} ms
 * @returns {Promise<T>}
 */
function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

/**
 * @returns {Promise<{ openTotal: number, openP0: number, openP1: number }>}
 */
async function loadMetrics() {
  const [openTotal, openP0, openP1] = await Promise.all([
    withTimeout(prisma.reviewQueueItem.count({ where: { status: 'open' } }), TIMEOUT_MS),
    withTimeout(prisma.reviewQueueItem.count({ where: { status: 'open', severity: 'P0' } }), TIMEOUT_MS),
    withTimeout(prisma.reviewQueueItem.count({ where: { status: 'open', severity: 'P1' } }), TIMEOUT_MS),
  ]);

  return { openTotal, openP0, openP1 };
}

/**
 * Public monitoring endpoint for data-quality queue.
 *
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */
export default async function handler(req, res) {
  const requestId = typeof req.requestId === 'string' ? req.requestId : randomUUID();

  res.setHeader('x-request-id', requestId);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  applyNoIndex(res);

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed', requestId });
  }

  const thresholds = {
    openTotalMax: env.monitor.reviewQueueOpenTotalMax,
    openP0Max: env.monitor.reviewQueueOpenP0Max,
  };

  try {
    const metrics = await loadMetrics();
    const ok = metrics.openTotal <= thresholds.openTotalMax && metrics.openP0 <= thresholds.openP0Max;

    if (!ok) {
      logger.warn(
        {
          requestId,
          route: 'monitor/data-quality',
          openTotal: metrics.openTotal,
          openP0: metrics.openP0,
          openP1: metrics.openP1,
        },
        'monitor.data_quality.threshold_exceeded',
      );
    }

    return res.status(ok ? 200 : 503).json({
      ok,
      requestId,
      metrics,
      thresholds,
      ...(ok ? {} : { error: 'unavailable' }),
    });
  } catch {
    logger.warn(
      {
        requestId,
        route: 'monitor/data-quality',
      },
      'monitor.data_quality.unavailable',
    );

    return res.status(503).json({
      ok: false,
      requestId,
      metrics: {
        openTotal: null,
        openP0: null,
        openP1: null,
      },
      thresholds,
      error: 'unavailable',
    });
  }
}
