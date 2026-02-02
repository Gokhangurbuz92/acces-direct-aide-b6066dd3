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

import { PrismaClient } from '@prisma/client';
import { generateUniqueSlug } from '../api/lib/slug.js';
import slugify from '@sindresorhus/slugify';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

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
async function backfillModel(modelName, titleField) {
    console.log(`\n📦 Processing model: ${modelName}`);
    console.log(`─────────────────────────────────────`);

    // Find items without slug
    // If limit is set, we just take that many.
    // This acts as a cursor/resume mechanism naturally: 
    // each run picks up the next batch of NULL slugs.
    const itemsWithoutSlug = await prisma[modelName.toLowerCase()].findMany({
        where: {
            slug: null
        },
        select: {
            id: true,
            [titleField]: true
        },
        take: limit || undefined
    });

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
            const newSlug = await generateUniqueSlug(prisma, modelName.toLowerCase(), titleValue, item.id);

            // Detect collision (slug had to get a suffix)
            const baseSlug = slugify(titleValue, { locale: 'fr' });
            // Simple check: if newSlug starts with baseSlug but is longer
            let isCollision = false;
            if (newSlug !== baseSlug && newSlug.startsWith(baseSlug)) {
                // verify it's a suffix like -1, -2
                const suffix = newSlug.replace(baseSlug, '');
                if (/^-\d+$/.test(suffix)) {
                    isCollision = true;
                    collisions++;
                }
            }
            // Edge case: title "foo" -> "foo" (ok). title "foo" -> "foo-1" (collision).
            // Edge case: title "foo?" -> "foo" (ok). 

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

        // Serial update to prevent DB lock issues with large batches, 
        // though parallel is faster. For safety/robustness we go serial or small Promise.all batches.
        // Given existing code was serial, we stick to it for maximum safety.
        for (const update of updates) {
            await prisma[modelName.toLowerCase()].update({
                where: { id: update.id },
                data: { slug: update.newSlug }
            });

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
    const models = [
        { name: 'Aide', titleField: 'titre' },
        { name: 'Demarche', titleField: 'titre' },
        { name: 'Structure', titleField: 'nom' },
        { name: 'Actualite', titleField: 'titre' }
    ];

    const results = {};

    for (const model of models) {
        try {
            results[model.name] = await backfillModel(model.name, model.titleField);
        } catch (error) {
            console.error(`\n❌ Fatal error processing ${model.name}:`, error);
            results[model.name] = { error: error.message };
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
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
