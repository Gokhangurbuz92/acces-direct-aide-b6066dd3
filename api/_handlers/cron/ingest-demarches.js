/**
 * Démarches Ingestion Pipeline
 *
 * Fetches, parses, and upserts démarches from multiple sources
 * Idempotent: Uses source_url_exact for deduplication
 * Logs: created/updated/skipped/errors
 *
 * Usage:
 * - Vercel Cron: /api/cron/ingest-demarches
 * - Local: node api/_handlers/cron/ingest-demarches.js
 */

import prisma from '../../_utils/prisma.js';
import { ALL_CONNECTORS } from '../../lib/connectors/demarches/index.js';
import * as Sentry from '@sentry/node';

/**
 * Main ingestion function
 */
export async function ingestDemarches(options = {}) {
  const startTime = Date.now();
  const stats = {
    total_fetched: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    connectors: {}
  };

  console.log('[INGEST-DEMARCHES] Starting ingestion', {
    timestamp: new Date().toISOString(),
    connectors: ALL_CONNECTORS.map(c => c.name)
  });

  // Run all connectors
  for (const connector of ALL_CONNECTORS) {
    const connectorStats = {
      fetched: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    try {
      console.log(`[INGEST-DEMARCHES] Running connector: ${connector.name}`);

      // Fetch raw data
      const rawItems = await connector.fetch();
      connectorStats.fetched = rawItems.length;
      stats.total_fetched += rawItems.length;

      console.log(`[INGEST-DEMARCHES] Fetched ${rawItems.length} items from ${connector.name}`);

      // Process each item
      for (const rawItem of rawItems) {
        try {
          // Parse
          const parsedData = await connector.parse(rawItem);

          // Map to Demarche model
          const demarcheData = await connector.mapToDemarche(parsedData);

          // Upsert
          const result = await upsertDemarche(demarcheData);

          if (result.created) {
            connectorStats.created++;
            stats.created++;
          } else if (result.updated) {
            connectorStats.updated++;
            stats.updated++;
          } else {
            connectorStats.skipped++;
            stats.skipped++;
          }

          console.log(`[INGEST-DEMARCHES] Processed: ${demarcheData.titre} (${result.action})`);
        } catch (itemError) {
          const error = {
            connector: connector.name,
            item: rawItem.url || rawItem.titre || 'unknown',
            message: itemError.message,
            stack: itemError.stack
          };
          connectorStats.errors.push(error);
          stats.errors.push(error);

          console.error(`[INGEST-DEMARCHES] Error processing item:`, error);

          // Report to Sentry
          if (Sentry.captureException) {
            Sentry.captureException(itemError, {
              tags: {
                connector: connector.name,
                operation: 'ingest-demarches'
              },
              extra: error
            });
          }
        }
      }

      stats.connectors[connector.name] = connectorStats;
      console.log(`[INGEST-DEMARCHES] Connector ${connector.name} completed:`, connectorStats);
    } catch (connectorError) {
      const error = {
        connector: connector.name,
        message: connectorError.message,
        stack: connectorError.stack
      };
      stats.errors.push(error);

      console.error(`[INGEST-DEMARCHES] Connector ${connector.name} failed:`, error);

      if (Sentry.captureException) {
        Sentry.captureException(connectorError, {
          tags: {
            connector: connector.name,
            operation: 'ingest-demarches'
          }
        });
      }
    }
  }

  const duration = Date.now() - startTime;

  // Log summary
  const summary = {
    timestamp: new Date().toISOString(),
    duration_ms: duration,
    ...stats
  };

  console.log('[INGEST-DEMARCHES] Ingestion completed:', summary);

  // Write to UpdateLog
  try {
    await prisma.updateLog.create({
      data: {
        source_name: 'demarches-pipeline',
        status: stats.errors.length > 0 ? 'partial_success' : 'success',
        duration_ms: duration,
        items_fetched_count: stats.total_fetched,
        items_created_count: stats.created,
        items_updated_count: stats.updated,
        items_skipped_count: stats.skipped,
        errors: stats.errors.map(e => `${e.connector}: ${e.message}`),
        is_dry_run: options.dryRun || false
      }
    });
  } catch (logError) {
    console.error('[INGEST-DEMARCHES] Failed to write UpdateLog:', logError);
  }

  return summary;
}

/**
 * Upsert a single démarche
 * Returns: { created: boolean, updated: boolean, action: string }
 */
async function upsertDemarche(demarcheData) {
  const { source_url_exact, content_hash, _categoryKey, _situationKey, ...data } = demarcheData;

  if (!source_url_exact) {
    throw new Error('source_url_exact is required for upsert');
  }

  // Find existing by source_url_exact
  const existing = await prisma.demarche.findFirst({
    where: { source_url_exact }
  });

  if (existing) {
    // Check if content changed
    if (existing.content_hash === content_hash) {
      // No change, skip
      return { created: false, updated: false, action: 'skipped' };
    }

    // Update
    await prisma.demarche.update({
      where: { id: existing.id },
      data: {
        ...data,
        content_hash,
        updatedAt: new Date()
      }
    });

    return { created: false, updated: true, action: 'updated' };
  }

  // Create new
  // Resolve categoryId from _categoryKey
  let categoryId = null;
  if (_categoryKey) {
    const category = await prisma.aidCategory.findFirst({
      where: { slug: _categoryKey }
    });
    if (category) {
      categoryId = category.id;
    } else {
      // Create category if missing (optional, or skip)
      console.warn(`[INGEST-DEMARCHES] Category not found: ${_categoryKey}, creating...`);
      const newCategory = await prisma.aidCategory.create({
        data: {
          slug: _categoryKey,
          label: _categoryKey.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        }
      });
      categoryId = newCategory.id;
    }
  }

  // Resolve situations (optional)
  const situationIds = [];
  if (_situationKey) {
    const situation = await prisma.lifeSituation.findFirst({
      where: { slug: _situationKey }
    });
    if (situation) {
      situationIds.push(situation.id);
    }
  }

  await prisma.demarche.create({
    data: {
      ...data,
      source_url_exact,
      content_hash,
      categoryId,
      situations: {
        connect: situationIds.map(id => ({ id }))
      }
    }
  });

  return { created: true, updated: false, action: 'created' };
}

/**
 * HTTP Handler (for Vercel Cron)
 */
export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await ingestDemarches();
    return res.status(200).json(result);
  } catch (error) {
    console.error('[INGEST-DEMARCHES] Handler error:', error);

    if (Sentry.captureException) {
      Sentry.captureException(error);
    }

    return res.status(500).json({
      error: 'Ingestion failed',
      message: error.message
    });
  }
}

// Allow direct execution for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  ingestDemarches()
    .then(result => {
      console.log('Ingestion completed:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Ingestion failed:', error);
      process.exit(1);
    });
}
