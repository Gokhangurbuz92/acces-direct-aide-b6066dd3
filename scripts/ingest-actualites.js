import { runIngestActualitesRss } from '../api/_handlers/cron/ingest-actualites-rss.js';

function parseLimit(argv) {
  const idx = argv.findIndex((arg) => arg === '--limit' || arg === '-l');
  if (idx === -1) return undefined;
  const raw = argv[idx + 1];
  const parsed = Number.parseInt(String(raw ?? ''), 10);
  if (!Number.isFinite(parsed) || parsed < 1) return undefined;
  return parsed;
}

async function main() {
  const limit = parseLimit(process.argv.slice(2));
  const stats = await runIngestActualitesRss({ limit });

  const errorCount = Array.isArray(stats?.errors) ? stats.errors.length : 0;
  console.log('[actualites][ingest] done', {
    fetched: stats?.fetched ?? 0,
    processed: stats?.processed ?? 0,
    created: stats?.created ?? 0,
    updated: stats?.updated ?? 0,
    skippedExisting: stats?.skippedExisting ?? 0,
    errors: errorCount,
    fetchMs: stats?.durationByStage?.fetchMs ?? 0,
    processingMs: stats?.durationByStage?.processingMs ?? 0,
  });

  if (errorCount > 0) {
    console.warn('[actualites][ingest] some sources/items failed. See logs for details.');
    process.exitCode = 1;
  }
}

main()
  .catch((err) => {
    console.error('[actualites][ingest] fatal error', err?.message || err);
    process.exitCode = 1;
  });
