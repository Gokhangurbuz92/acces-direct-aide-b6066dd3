#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

const TARGET_MIGRATION = '20260305000000_add_pro_rdv_core';
const RDV_TABLES = ['ProRdvService', 'ProAvailabilityRule', 'ProAppointment', 'ProTimeOff'];

function npxCommand() {
  return process.platform === 'win32' ? 'npx.cmd' : 'npx';
}

function getDbUrl() {
  return (
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL ||
    ''
  ).trim();
}

/**
 * @param {string[]} args
 */
function runPrisma(args) {
  return spawnSync(npxCommand(), ['prisma', ...args], {
    encoding: 'utf8',
    env: process.env,
  });
}

/**
 * @returns {Promise<{
 *   tablesPresent: string[],
 *   missingTables: string[],
 *   migrationsTablePresent: boolean,
 *   migrationApplied: boolean,
 * }>} 
 */
async function inspectState() {
  const dbUrl = getDbUrl();
  if (!dbUrl) {
    throw new Error('[db:baseline:rdv] Missing database URL env (DATABASE_URL or POSTGRES_URL_NON_POOLING).');
  }

  const prisma = new PrismaClient({
    datasources: {
      db: { url: dbUrl },
    },
  });

  try {
    await prisma.$connect();

    const tableRows = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('ProRdvService', 'ProAvailabilityRule', 'ProAppointment', 'ProTimeOff')
    `;

    const tablesPresent = (Array.isArray(tableRows) ? tableRows : [])
      .map((row) => (row && typeof row === 'object' ? String(row.table_name || '') : ''))
      .filter(Boolean);

    const missingTables = RDV_TABLES.filter((tableName) => !tablesPresent.includes(tableName));

    const migrationTableProbe = await prisma.$queryRaw`
      SELECT to_regclass('public."_prisma_migrations"') AS migrations_regclass
    `;

    const firstProbe = Array.isArray(migrationTableProbe) ? migrationTableProbe[0] : null;
    const migrationsRegclass =
      firstProbe && typeof firstProbe === 'object' ? String(firstProbe.migrations_regclass || '') : '';

    const migrationsTablePresent = Boolean(migrationsRegclass);

    let migrationApplied = false;
    if (migrationsTablePresent) {
      const migrationRows = await prisma.$queryRaw`
        SELECT migration_name, finished_at, rolled_back_at
        FROM "_prisma_migrations"
        WHERE migration_name = ${TARGET_MIGRATION}
      `;

      migrationApplied = (Array.isArray(migrationRows) ? migrationRows : []).some((row) => {
        const migrationName = row && typeof row === 'object' ? String(row.migration_name || '') : '';
        const finishedAt = row && typeof row === 'object' ? row.finished_at : null;
        const rolledBackAt = row && typeof row === 'object' ? row.rolled_back_at : null;
        return migrationName === TARGET_MIGRATION && Boolean(finishedAt) && !rolledBackAt;
      });
    }

    return {
      tablesPresent,
      missingTables,
      migrationsTablePresent,
      migrationApplied,
    };
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

function printState(state) {
  console.log('[db:baseline:rdv] inspection summary');
  console.log(`- target migration: ${TARGET_MIGRATION}`);
  console.log(`- rdv tables present: ${state.tablesPresent.length}/${RDV_TABLES.length}`);
  if (state.missingTables.length > 0) {
    console.log(`- missing tables: ${state.missingTables.join(', ')}`);
  }
  console.log(`- _prisma_migrations present: ${state.migrationsTablePresent ? 'yes' : 'no'}`);
  console.log(`- migration applied: ${state.migrationApplied ? 'yes' : 'no'}`);
}

async function main() {
  const force = process.env.DB_BASELINE_FORCE === '1';
  const state = await inspectState();
  printState(state);

  if (state.missingTables.length > 0) {
    console.error('[db:baseline:rdv] Aborting: RDV schema is not fully present. Run `npm run db:deploy` first.');
    process.exit(1);
  }

  if (state.migrationApplied) {
    console.log('[db:baseline:rdv] Nothing to do. Migration history already aligned.');
    return;
  }

  if (!state.migrationsTablePresent) {
    console.error(
      '[db:baseline:rdv] _prisma_migrations is missing. Baseline resolve is not possible until Prisma migrations metadata is initialized.',
    );
    console.error('[db:baseline:rdv] Run `npm run db:deploy` on the target environment first.');
    process.exit(1);
  }

  if (!force) {
    console.log('[db:baseline:rdv] DRY-RUN: baseline resolve not applied.');
    console.log(`[db:baseline:rdv] To apply safely: DB_BASELINE_FORCE=1 npm run db:baseline:rdv`);
    return;
  }

  console.log(`[db:baseline:rdv] Applying prisma migrate resolve --applied ${TARGET_MIGRATION}`);
  const resolveResult = runPrisma(['migrate', 'resolve', '--applied', TARGET_MIGRATION]);

  const resolveOutput = `${resolveResult.stdout || ''}\n${resolveResult.stderr || ''}`;
  const alreadyApplied = /already(?:\s+recorded)?\s+as\s+applied/i.test(resolveOutput);
  const resolveOk = (resolveResult.status ?? 1) === 0 || alreadyApplied;

  if (!resolveOk) {
    console.error('[db:baseline:rdv] prisma migrate resolve failed.');
    process.exit(resolveResult.status ?? 1);
  }

  const postState = await inspectState();
  printState(postState);

  if (!postState.migrationApplied) {
    console.error('[db:baseline:rdv] Baseline resolve did not mark migration as applied.');
    process.exit(1);
  }

  console.log('[db:baseline:rdv] Baseline resolve completed successfully.');
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error('[db:baseline:rdv] Fatal error');
  console.error(`[db:baseline:rdv] ${message}`);
  process.exit(1);
});
