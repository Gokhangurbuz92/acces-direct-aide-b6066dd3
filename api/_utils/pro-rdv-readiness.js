import { db as defaultDb } from '../../src/db/index.js';
import { sql } from 'drizzle-orm';

export const REQUIRED_PRO_RDV_TABLES = [
  'ProRdvService',
  'ProAvailabilityRule',
  'ProAppointment',
  'ProTimeOff',
];

export const REQUIRED_PRO_RDV_MIGRATIONS = ['20260305000000_add_pro_rdv_core'];

const DEFAULT_TIMEOUT_MS = 2000;

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
 * @param {import('drizzle-orm/pg-core').PgDatabase<any>} dbClient
 * @param {number} timeoutMs
 * @returns {Promise<Set<string>>}
 */
async function loadExistingTables(dbClient, timeoutMs) {
  const { rows } = await withTimeout(
    dbClient.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('ProRdvService', 'ProAvailabilityRule', 'ProAppointment', 'ProTimeOff')
    `),
    timeoutMs,
  );

  const existing = new Set();
  for (const row of Array.isArray(rows) ? rows : []) {
    const tableName = row && typeof row === 'object' ? String(row.table_name || '') : '';
    if (tableName) existing.add(tableName);
  }
  return existing;
}

/**
 * @param {import('drizzle-orm/pg-core').PgDatabase<any>} dbClient
 * @param {number} timeoutMs
 * @returns {Promise<{ prismaMigrationsOk: boolean, missingMigrations: string[], migrationsTablePresent: boolean }>}
 */
async function loadMigrationStatus(dbClient, timeoutMs) {
  const tableProbe = await withTimeout(
    dbClient.execute(sql`SELECT to_regclass('public."_prisma_migrations"') AS migrations_regclass`),
    timeoutMs,
  );

  const probeRows = tableProbe.rows || [];
  const firstProbe = Array.isArray(probeRows) && probeRows.length > 0 ? probeRows[0] : null;
  const regclass = firstProbe && typeof firstProbe === 'object'
    ? String(firstProbe.migrations_regclass || '')
    : '';

  if (!regclass) {
    return {
      prismaMigrationsOk: false,
      missingMigrations: [...REQUIRED_PRO_RDV_MIGRATIONS],
      migrationsTablePresent: false,
    };
  }

  const dbRows = await withTimeout(
    dbClient.execute(sql`
      SELECT migration_name, finished_at, rolled_back_at
      FROM "_prisma_migrations"
      WHERE migration_name IN ('20260305000000_add_pro_rdv_core')
    `),
    timeoutMs,
  );

  const rows = dbRows.rows || [];
  const applied = new Set();
  for (const row of Array.isArray(rows) ? rows : []) {
    const migrationName = row && typeof row === 'object' ? String(row.migration_name || '') : '';
    const finishedAt = row && typeof row === 'object' ? row.finished_at : null;
    const rolledBackAt = row && typeof row === 'object' ? row.rolled_back_at : null;
    if (migrationName && finishedAt && !rolledBackAt) {
      applied.add(migrationName);
    }
  }

  const missingMigrations = REQUIRED_PRO_RDV_MIGRATIONS.filter((migrationName) => !applied.has(migrationName));

  return {
    prismaMigrationsOk: missingMigrations.length === 0,
    missingMigrations,
    migrationsTablePresent: true,
  };
}

/**
 * @param {import('drizzle-orm/pg-core').PgDatabase<any>} dbClient
 * @param {number=} timeoutMs
 */
export async function getProRdvReadiness(dbClient = defaultDb, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const [existingTables, migrationStatus] = await Promise.all([
    loadExistingTables(dbClient, timeoutMs),
    loadMigrationStatus(dbClient, timeoutMs),
  ]);

  const missingTables = REQUIRED_PRO_RDV_TABLES.filter((tableName) => !existingTables.has(tableName));
  const ok = missingTables.length === 0 && migrationStatus.prismaMigrationsOk;

  return {
    ok,
    missingTables,
    prismaMigrationsOk: migrationStatus.prismaMigrationsOk,
    missingMigrations: migrationStatus.missingMigrations,
    migrationsTablePresent: migrationStatus.migrationsTablePresent,
  };
}
