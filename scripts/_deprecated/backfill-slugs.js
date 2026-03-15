#!/usr/bin/env node
/**
 * Backfill missing slugs for Aide, Demarche, Structure, Actualite
 * 
 * Usage:
 *   node scripts/backfill-slugs.js --dry-run             (preview)
 *   node scripts/backfill-slugs.js --apply               (write to DB)
 *   node scripts/backfill-slugs.js --apply --limit 10    (batch of 10)
 *   node scripts/backfill-slugs.js --apply --report      (save JSON report)
 */

import { db } from '../src/db/index.js';
import * as schema from '../src/db/schema.js';
import { eq, isNull } from 'drizzle-orm';
import { generateUniqueSlug } from '../api/lib/slug.js';
import slugify from '@sindresorhus/slugify';
import fs from 'fs';

/**
 * Model name → { table, titleField } mapping
 */
const MODEL_MAP = {
  Aide:       { table: schema.Aide,       titleField: 'titre' },
  Demarche:   { table: schema.Demarche,   titleField: 'titre' },
  Structure:  { table: schema.Structure,  titleField: 'nom'   },
  Actualite:  { table: schema.Actualite,  titleField: 'titre' },
};

// Parse CLI args
const args = process.argv.slice(2);
const isDryRun = !args.includes('--apply');
const isReport = args.includes('--report');

// Parse --limit
const limitArgIndex = args.indexOf('--limit');
let limit = null;
if (limitArgIndex !== -1 && args[limitArgIndex + 1]) {
    limit = parseInt(args[limitArgIndex + 1], 10);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const reportFile = `slug-backfill-report-${timestamp}.json`;
const fullReport = {
    timestamp: new Date().toISOString(),
    mode: isDryRun ? 'DRY-RUN' : 'APPLY',
    details: [],
    summary: {}
};

console.log(`\n🔧 Slug Backfill Script`);
console.log(`Mode: ${isDryRun ? '🔍 DRY-RUN (preview)' : '✍️  APPLY (writing to DB)'}`);
if (limit) console.log(`Limit: ${limit} items per model`);
if (isReport) console.log(`Report: ${reportFile}\n`);

/**
 * Backfill slugs for a specific model
 */
async function backfillModel(modelName) {
    const config = MODEL_MAP[modelName];
    if (!config) throw new Error(`Unknown model: ${modelName}`);

    const { table, titleField } = config;
    console.log(`\n📦 Processing model: ${modelName}`);
    console.log(`─────────────────────────────────────`);

    // Find items without slug
    let query = db
        .select({ id: table.id, [titleField]: table[titleField] })
        .from(table)
        .where(isNull(table.slug));

    if (limit) {
        query = query.limit(limit);
    }

    const itemsWithoutSlug = await query;

    // Filter out items without title/nom
    const validItems = itemsWithoutSlug.filter(item => item[titleField] && item[titleField].trim() !== '');

    console.log(`Found ${itemsWithoutSlug.length} items without slug${limit ? ` (limited to ${limit})` : ''}`);
    if (validItems.length < itemsWithoutSlug.length) {
        console.log(`⚠️  Skipping ${itemsWithoutSlug.length - validItems.length} items with missing/empty ${titleField}`);
    }

    if (validItems.length === 0) {
        console.log(`✅ No items to backfill for ${modelName}.`);
        return { total: 0, updated: 0, collisions: 0, skipped: itemsWithoutSlug.length - validItems.length };
    }

    let updated = 0;
    let collisions = 0;
    const updates = [];

    for (const item of validItems) {
        const titleValue = item[titleField];

        try {
            const newSlug = await generateUniqueSlug(modelName.toLowerCase(), titleValue, item.id);

            // Detect collision (slug had to get a suffix)
            const baseSlug = slugify(titleValue, { locale: 'fr' });
            let isCollision = false;
            if (newSlug !== baseSlug && newSlug.startsWith(baseSlug)) {
                const suffix = newSlug.replace(baseSlug, '');
                if (/^-\d+$/.test(suffix)) {
                    isCollision = true;
                    collisions++;
                }
            }

            updates.push({
                id: item.id,
                title: titleValue.substring(0, 50),
                newSlug,
                isCollision
            });

            updated++;

        } catch (error) {
            console.error(`❌ Error generating slug for ${modelName} ${item.id}:`, error.message);
            fullReport.details.push({ model: modelName, id: item.id, error: error.message });
        }
    }

    // Show preview
    if (updates.length > 0) {
        console.log(`\nPreview (first 5):`);
        updates.slice(0, 5).forEach(u => {
            console.log(`  • "${u.title}" → "${u.newSlug}" ${u.isCollision ? '(collision resolved)' : ''}`);
        });
        if (updates.length > 5) console.log(`  ... and ${updates.length - 5} more`);
    }

    // Apply updates if not dry-run
    if (!isDryRun && updates.length > 0) {
        console.log(`\n✍️  Writing ${updates.length} slugs to database...`);

        for (const update of updates) {
            await db.update(table).set({ slug: update.newSlug }).where(eq(table.id, update.id));

            if (isReport) {
                fullReport.details.push({
                    model: modelName,
                    id: update.id,
                    slug: update.newSlug,
                    status: 'UPDATED'
                });
            }
        }
        console.log(`✅ Updated ${updated} ${modelName} items`);
    } else if (isReport) {
        updates.forEach(u => {
            fullReport.details.push({
                model: modelName,
                id: u.id,
                slug: u.newSlug,
                status: 'DRY-RUN'
            });
        });
    }

    return {
        total: itemsWithoutSlug.length,
        updated,
        collisions,
        skipped: itemsWithoutSlug.length - validItems.length
    };
}

/**
 * Main execution
 */
async function main() {
    const results = {};

    for (const modelName of Object.keys(MODEL_MAP)) {
        try {
            results[modelName] = await backfillModel(modelName);
        } catch (error) {
            console.error(`\n❌ Fatal error processing ${modelName}:`, error);
            results[modelName] = { error: error.message };
        }
    }

    // Summary
    console.log(`\n\n📊 SUMMARY`);
    console.log(`═════════════════════════════════════`);

    let grandUpdated = 0;

    for (const [modelName, stats] of Object.entries(results)) {
        console.log(`\n${modelName}:`);
        if (stats.error) {
            console.log(`  ⚠️  Error: ${stats.error}`);
            continue;
        }
        console.log(`  Found NULL: ${stats.total}`);
        console.log(`  ${isDryRun ? 'Would update' : 'Updated'}: ${stats.updated}`);
        console.log(`  Collisions: ${stats.collisions}`);
        console.log(`  Skipped (no title): ${stats.skipped}`);

        grandUpdated += stats.updated;
        fullReport.summary[modelName] = stats;
    }

    if (isReport) {
        fs.writeFileSync(reportFile, JSON.stringify(fullReport, null, 2));
        console.log(`\n📄 Report saved to ${reportFile}`);
    }

    if (!isDryRun && grandUpdated === 0) {
        console.log(`\n✅ IDEMPOTENCY CHECK PASSED: No updates were needed.`);
    }

    console.log(`\nDone.`);
}

main()
    .catch(error => {
        console.error('\n❌ Fatal error:', error);
        process.exit(1);
    });
