import { describe, expect, it } from 'vitest';
import { extractPrismaErrorCode, shouldAutoRecoverP3009 } from '../../scripts/prisma-migrate-safe.mjs';

describe('prisma-migrate-safe helpers', () => {
  const target = '20260303000000_add_actualite_source_document_fk';

  it('detects recoverable P3009 output for the targeted migration', () => {
    const output = [
      'Error: P3009',
      'migrate found failed migrations in the target database',
      `migration_name: ${target}`,
    ].join('\n');

    expect(shouldAutoRecoverP3009(output, target)).toBe(true);
  });

  it('does not recover when migration name does not match', () => {
    const output = [
      'Error: P3009',
      'migrate found failed migrations in the target database',
      'migration_name: 20260301000001_add_cron_run',
    ].join('\n');

    expect(shouldAutoRecoverP3009(output, target)).toBe(false);
  });

  it('extracts Prisma error codes from command output', () => {
    expect(extractPrismaErrorCode('Prisma error P3009 happened')).toBe('P3009');
    expect(extractPrismaErrorCode('No prisma code here')).toBeNull();
  });
});
