import { randomUUID } from 'crypto';
import prisma from '../../_utils/prisma.js';
import { env } from '../../_utils/env.js';
import logger from '../../_utils/logger.js';
import { applyNoIndex } from '../../_utils/robots.js';

const REQUIRED_TABLES = [
  'ProRdvService',
  'ProAvailabilityRule',
  'ProAppointment',
  'ProTimeOff',
];
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
 * @returns {Promise<Set<string>>}
 */
async function loadExistingTables() {
  const rows = await withTimeout(
    prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('ProRdvService', 'ProAvailabilityRule', 'ProAppointment', 'ProTimeOff')
    `,
    TIMEOUT_MS,
  );

  const existing = new Set();
  for (const row of Array.isArray(rows) ? rows : []) {
    const tableName = row && typeof row === 'object' ? String(row.table_name || '') : '';
    if (tableName) existing.add(tableName);
  }
  return existing;
}

/**
 * Public monitor endpoint for pro RDV schema readiness.
 *
 * - 200 when all required P9-C tables exist.
 * - 503 when one or more tables are missing, or DB probe fails.
 *
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */
export default async function handler(req, res) {
  const requestId = typeof req.requestId === 'string' ? req.requestId : randomUUID();
  const checkedAt = new Date().toISOString();
  const runtimeEnv = env.runtime.vercelEnv || env.runtime.nodeEnv || 'development';

  res.setHeader('x-request-id', requestId);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  applyNoIndex(res);

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed', requestId });
  }

  try {
    const existingTables = await loadExistingTables();
    const missingTables = REQUIRED_TABLES.filter((tableName) => !existingTables.has(tableName));
    const ok = missingTables.length === 0;

    if (!ok) {
      logger.warn(
        {
          requestId,
          route: 'monitor/pro-rdv',
          missingTables,
          env: runtimeEnv,
        },
        'monitor.pro_rdv.not_ready',
      );
    }

    return res.status(ok ? 200 : 503).json({
      ok,
      missingTables,
      checkedAt,
      env: runtimeEnv,
      requestId,
      ...(ok ? {} : { error: 'unavailable' }),
    });
  } catch {
    logger.warn(
      {
        requestId,
        route: 'monitor/pro-rdv',
        env: runtimeEnv,
      },
      'monitor.pro_rdv.error',
    );

    return res.status(503).json({
      ok: false,
      missingTables: [...REQUIRED_TABLES],
      checkedAt,
      env: runtimeEnv,
      requestId,
      error: 'unavailable',
    });
  }
}
