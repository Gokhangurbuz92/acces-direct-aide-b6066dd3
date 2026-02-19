import { randomUUID } from 'crypto';
import prisma from '../../_utils/prisma.js';
import { env } from '../../_utils/env.js';
import logger from '../../_utils/logger.js';
import { applyNoIndex } from '../../_utils/robots.js';
import Sentry from '../../_utils/sentry.js';

const REQUIRED_TABLES = [
  'ProRdvService',
  'ProAvailabilityRule',
  'ProAppointment',
  'ProTimeOff',
];

const REQUIRED_MIGRATIONS = ['20260305000000_add_pro_rdv_core'];
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
 * @returns {Promise<{ prismaMigrationsOk: boolean, missingMigrations: string[], migrationsTablePresent: boolean }>}
 */
async function loadMigrationStatus() {
  const tableProbe = await withTimeout(
    prisma.$queryRaw`SELECT to_regclass('public."_prisma_migrations"') AS migrations_regclass`,
    TIMEOUT_MS,
  );

  const firstProbe = Array.isArray(tableProbe) && tableProbe.length > 0 ? tableProbe[0] : null;
  const regclass = firstProbe && typeof firstProbe === 'object'
    ? String(firstProbe.migrations_regclass || '')
    : '';

  if (!regclass) {
    return {
      prismaMigrationsOk: false,
      missingMigrations: [...REQUIRED_MIGRATIONS],
      migrationsTablePresent: false,
    };
  }

  const rows = await withTimeout(
    prisma.$queryRaw`
      SELECT migration_name, finished_at, rolled_back_at
      FROM "_prisma_migrations"
      WHERE migration_name IN ('20260305000000_add_pro_rdv_core')
    `,
    TIMEOUT_MS,
  );

  const applied = new Set();
  for (const row of Array.isArray(rows) ? rows : []) {
    const migrationName = row && typeof row === 'object' ? String(row.migration_name || '') : '';
    const finishedAt = row && typeof row === 'object' ? row.finished_at : null;
    const rolledBackAt = row && typeof row === 'object' ? row.rolled_back_at : null;
    if (migrationName && finishedAt && !rolledBackAt) {
      applied.add(migrationName);
    }
  }

  const missingMigrations = REQUIRED_MIGRATIONS.filter((migrationName) => !applied.has(migrationName));

  return {
    prismaMigrationsOk: missingMigrations.length === 0,
    missingMigrations,
    migrationsTablePresent: true,
  };
}

/**
 * Public monitor endpoint for pro RDV schema readiness.
 *
 * - 200 when required P9-C tables and migration baseline are present.
 * - 503 otherwise.
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
    const [existingTables, migrationStatus] = await Promise.all([
      loadExistingTables(),
      loadMigrationStatus(),
    ]);

    const missingTables = REQUIRED_TABLES.filter((tableName) => !existingTables.has(tableName));
    const ok = missingTables.length === 0 && migrationStatus.prismaMigrationsOk;

    if (!ok) {
      logger.warn(
        {
          requestId,
          route: 'monitor/pro-rdv',
          missingTables,
          missingMigrations: migrationStatus.missingMigrations,
          migrationsTablePresent: migrationStatus.migrationsTablePresent,
          env: runtimeEnv,
        },
        'monitor.pro_rdv.not_ready',
      );
    }

    return res.status(ok ? 200 : 503).json({
      ok,
      missingTables,
      prismaMigrationsOk: migrationStatus.prismaMigrationsOk,
      missingMigrations: migrationStatus.missingMigrations,
      checkedAt,
      env: runtimeEnv,
      requestId,
      ...(ok ? {} : { error: 'unavailable' }),
    });
  } catch (error) {
    logger.warn(
      {
        requestId,
        route: 'monitor/pro-rdv',
        env: runtimeEnv,
      },
      'monitor.pro_rdv.error',
    );

    try {
      Sentry.captureException(error, {
        tags: {
          module: 'rdv',
          surface: 'monitor',
          handler: 'monitor/pro-rdv',
          requestId,
          route: 'monitor/pro-rdv',
          'http.method': 'GET',
          'http.status_code': '503',
        },
      });
      await Sentry.flush(1500);
    } catch {
      // best-effort
    }

    return res.status(503).json({
      ok: false,
      missingTables: [...REQUIRED_TABLES],
      prismaMigrationsOk: false,
      missingMigrations: [...REQUIRED_MIGRATIONS],
      checkedAt,
      env: runtimeEnv,
      requestId,
      error: 'unavailable',
    });
  }
}
