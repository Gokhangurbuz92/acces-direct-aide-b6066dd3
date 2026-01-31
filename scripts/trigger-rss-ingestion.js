#!/usr/bin/env node
/**
 * Manual trigger script for RSS ingestion
 * Usage: node scripts/trigger-rss-ingestion.js [--limit=N] [--dry-run] [--source-id=ID]
 */

import { runRssIngest } from '../api/_handlers/cron/rss-ingest.js';

async function main() {
  const args = process.argv.slice(2);
  
  const options = {
    limit: undefined,
    dryRun: false,
    sourceId: null,
  };

  // Parse arguments
  args.forEach(arg => {
    if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg.startsWith('--source-id=')) {
      options.sourceId = arg.split('=')[1];
    }
  });

  console.log('🚀 Starting RSS Ingestion...');
  console.log('Options:', options);
  console.log('');

  try {
    const stats = await runRssIngest(options);

    console.log('');
    console.log('📊 Ingestion Results:');
    console.log('─'.repeat(50));
    console.log(`  Fetched:  ${stats.fetched} items`);
    console.log(`  Created:  ${stats.created} items`);
    console.log(`  Updated:  ${stats.updated} items`);
    console.log(`  Skipped:  ${stats.skipped} items`);
    console.log(`  Duration: ${stats.durationMs}ms`);
    console.log('');

    if (stats.sourceResults && stats.sourceResults.length > 0) {
      console.log('📰 Source Breakdown:');
      console.log('─'.repeat(50));
      stats.sourceResults.forEach(source => {
        console.log(`  ${source.sourceName}:`);
        console.log(`    Fetched: ${source.fetched}, Created: ${source.created}, Updated: ${source.updated}, Skipped: ${source.skipped}`);
        if (source.errors.length > 0) {
          console.log(`    Errors: ${source.errors.join(', ')}`);
        }
      });
      console.log('');
    }

    if (stats.errors.length > 0) {
      console.log('⚠️  Errors:');
      console.log('─'.repeat(50));
      stats.errors.forEach(err => console.log(`  - ${err}`));
      console.log('');
    }

    console.log('✅ Ingestion complete!');
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Ingestion failed:');
    console.error(error);
    process.exit(1);
  }
}

main();
