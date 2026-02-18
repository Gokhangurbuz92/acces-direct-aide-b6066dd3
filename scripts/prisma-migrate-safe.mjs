#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const TARGET_MIGRATION = '20260303000000_add_actualite_source_document_fk';
const P3009_PATTERN = /\bP3009\b/;

const SCHEMA_REPAIR_SQL = `
DO $$
DECLARE
  actualite_table regclass;
  source_table regclass;
BEGIN
  actualite_table := COALESCE(
    to_regclass('public."Actualite"'),
    to_regclass('"Actualite"'),
    to_regclass('public.actualite'),
    to_regclass('actualite')
  );

  source_table := COALESCE(
    to_regclass('public."SourceDocument"'),
    to_regclass('"SourceDocument"'),
    to_regclass('public.source_document'),
    to_regclass('source_document')
  );

  IF actualite_table IS NULL THEN
    RAISE EXCEPTION 'Auto-recovery aborted: Actualite table not found';
  END IF;

  IF source_table IS NULL THEN
    RAISE EXCEPTION 'Auto-recovery aborted: SourceDocument table not found';
  END IF;

  EXECUTE format('ALTER TABLE %s ADD COLUMN IF NOT EXISTS source_document_id TEXT', actualite_table);
  EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %s (source_document_id)', 'Actualite_source_document_id_idx', actualite_table);
  EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %s (source_url)', 'SourceDocument_source_url_idx', source_table);
  EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %s (content_hash)', 'SourceDocument_content_hash_idx', source_table);

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Actualite_source_document_id_fkey'
  ) THEN
    EXECUTE format(
      'ALTER TABLE %s ADD CONSTRAINT %I FOREIGN KEY (source_document_id) REFERENCES %s (id) ON DELETE SET NULL ON UPDATE CASCADE',
      actualite_table,
      'Actualite_source_document_id_fkey',
      source_table
    );
  END IF;
END $$;
`;

function npxCommand() {
  return process.platform === 'win32' ? 'npx.cmd' : 'npx';
}

function runPrisma(args) {
  const result = spawnSync(npxCommand(), ['prisma', ...args], {
    encoding: 'utf8',
    env: process.env,
  });

  const output = `${result.stdout || ''}\n${result.stderr || ''}`;
  return {
    ok: (result.status ?? 1) === 0,
    status: result.status ?? 1,
    output,
  };
}

function isAlreadyAppliedMessage(output) {
  return /already(?:\s+recorded)?\s+as\s+applied/i.test(output || '');
}

export function extractPrismaErrorCode(output) {
  const match = String(output || '').match(/\bP\d{4}\b/);
  return match ? match[0] : null;
}

export function shouldAutoRecoverP3009(output, migrationName = TARGET_MIGRATION) {
  const text = String(output || '');
  return P3009_PATTERN.test(text) && text.includes(migrationName);
}

function getRecoveryDatabaseUrl() {
  return (
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL ||
    ''
  ).trim();
}

async function repairSchemaForTargetMigration() {
  const url = getRecoveryDatabaseUrl();
  if (!url) {
    throw new Error('[prisma-migrate-safe] Missing database URL for recovery.');
  }

  const prisma = new PrismaClient({
    datasources: {
      db: { url },
    },
  });

  try {
    await prisma.$connect();
    await prisma.$executeRawUnsafe(SCHEMA_REPAIR_SQL);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

function failWithContext(prefix, output, statusCode = 1) {
  const prismaCode = extractPrismaErrorCode(output);
  const codeSuffix = prismaCode ? ` (${prismaCode})` : '';
  console.error(`${prefix}${codeSuffix}`);
  process.exit(statusCode);
}

async function main() {
  console.log('[prisma-migrate-safe] Running prisma migrate deploy');

  const firstDeploy = runPrisma(['migrate', 'deploy']);
  if (firstDeploy.ok) {
    console.log('[prisma-migrate-safe] prisma migrate deploy succeeded');
    return;
  }

  if (!shouldAutoRecoverP3009(firstDeploy.output, TARGET_MIGRATION)) {
    failWithContext(
      '[prisma-migrate-safe] prisma migrate deploy failed (non-recoverable error).',
      firstDeploy.output,
      firstDeploy.status,
    );
  }

  console.warn(
    `[prisma-migrate-safe] Detected targeted P3009 on migration ${TARGET_MIGRATION}; starting one-time auto-recovery`,
  );

  await repairSchemaForTargetMigration();
  console.log('[prisma-migrate-safe] Schema repair completed');

  console.log('[prisma-migrate-safe] Marking migration as applied');
  const resolveMigration = runPrisma(['migrate', 'resolve', '--applied', TARGET_MIGRATION]);
  if (!resolveMigration.ok && !isAlreadyAppliedMessage(resolveMigration.output)) {
    failWithContext(
      '[prisma-migrate-safe] prisma migrate resolve failed during recovery.',
      resolveMigration.output,
      resolveMigration.status,
    );
  }

  console.log('[prisma-migrate-safe] Re-running prisma migrate deploy after recovery');
  const secondDeploy = runPrisma(['migrate', 'deploy']);
  if (!secondDeploy.ok) {
    failWithContext(
      '[prisma-migrate-safe] prisma migrate deploy failed after recovery.',
      secondDeploy.output,
      secondDeploy.status,
    );
  }

  console.log('[prisma-migrate-safe] Auto-recovery completed successfully');
}

const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  main().catch((error) => {
    console.error('[prisma-migrate-safe] Fatal error during migration recovery flow');
    if (error && typeof error.message === 'string') {
      console.error(`[prisma-migrate-safe] ${error.message}`);
    }
    process.exit(1);
  });
}
