#!/usr/bin/env node
/**
 * Backfill missing slugs for Aide, Demarche, Structure, Actualite
 * 
 * Usage:
 *   node scripts/backfill-slugs.js --dry-run  (default, preview only)
 *   node scripts/backfill-slugs.js --apply    (write to DB)
 */

import { PrismaClient } from '@prisma/client';
import { generateUniqueSlug } from '../api/lib/slug.js';
import slugify from '@sindresorhus/slugify';

const prisma = new PrismaClient();

// Parse CLI args
const args = process.argv.slice(2);
const isDryRun = !args.includes('--apply');

console.log(`\n🔧 Slug Backfill Script`);
console.log(`Mode: ${isDryRun ? '🔍 DRY-RUN (preview only)' : '✍️  APPLY (writing to DB)'}\n`);

/**
 * Backfill slugs for a specific model
 */
async function backfillModel(modelName, titleField) {
    console.log(`\n📦 Processing model: ${modelName}`);
    console.log(`─────────────────────────────────────`);

    // Find items without slug (and ensure they have a title/nom)
    const itemsWithoutSlug = await prisma[modelName.toLowerCase()].findMany({
        where: {
            slug: null
        },
        select: {
            id: true,
            [titleField]: true
        }
    });

    // Filter out items without title/nom
    const validItems = itemsWithoutSlug.filter(item => item[titleField] && item[titleField].trim() !== '');

    console.log(`Found ${itemsWithoutSlug.length} items without slug`);
    if (validItems.length < itemsWithoutSlug.length) {
        console.log(`⚠️  Skipping ${itemsWithoutSlug.length - validItems.length} items with missing or empty ${titleField}`);
    }

    if (validItems.length === 0) {
        console.log(`✅ All ${modelName} items already have slugs or have no valid title!`);
        return { total: 0, updated: 0, collisions: 0 };
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
            if (newSlug !== baseSlug) {
                collisions++;
            }

            updates.push({
                id: item.id,
                title: titleValue.substring(0, 60) + (titleValue.length > 60 ? '...' : ''),
                oldSlug: null,
                newSlug
            });

            updated++;

        } catch (error) {
            console.error(`❌ Error generating slug for ${modelName} ${item.id}:`, error.message);
        }
    }

    // Show preview
    if (updates.length > 0) {
        console.log(`\nPreview (first 5):`);
        updates.slice(0, 5).forEach(u => {
            console.log(`  • "${u.title}" → "${u.newSlug}"`);
        });
        if (updates.length > 5) {
            console.log(`  ... and ${updates.length - 5} more`);
        }
    }

    // Apply updates if not dry-run
    if (!isDryRun && updates.length > 0) {
        console.log(`\n✍️  Writing ${updates.length} slugs to database...`);

        for (const update of updates) {
            await prisma[modelName.toLowerCase()].update({
                where: { id: update.id },
                data: { slug: update.newSlug }
            });
        }

        console.log(`✅ Updated ${updated} ${modelName} items`);
    }

    return {
        total: validItems.length,
        updated,
        collisions
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
            results[model.name] = { total: 0, updated: 0, collisions: 0, error: error.message };
        }
    }

    // Summary
    console.log(`\n\n📊 SUMMARY`);
    console.log(`═════════════════════════════════════`);

    let grandTotal = 0;
    let grandUpdated = 0;
    let grandCollisions = 0;

    for (const [modelName, stats] of Object.entries(results)) {
        console.log(`\n${modelName}:`);
        console.log(`  Items without slug: ${stats.total}`);
        console.log(`  ${isDryRun ? 'Would update' : 'Updated'}: ${stats.updated}`);
        console.log(`  Collisions handled: ${stats.collisions}`);
        if (stats.error) {
            console.log(`  ⚠️  Error: ${stats.error}`);
        }

        grandTotal += stats.total;
        grandUpdated += stats.updated;
        grandCollisions += stats.collisions;
    }

    console.log(`\n─────────────────────────────────────`);
    console.log(`TOTALS:`);
    console.log(`  Items without slug: ${grandTotal}`);
    console.log(`  ${isDryRun ? 'Would update' : 'Updated'}: ${grandUpdated}`);
    console.log(`  Collisions handled: ${grandCollisions}`);

    if (isDryRun && grandTotal > 0) {
        console.log(`\n💡 To apply these changes, run:`);
        console.log(`   node scripts/backfill-slugs.js --apply\n`);
    } else if (!isDryRun && grandUpdated > 0) {
        console.log(`\n✅ Backfill complete!\n`);
    } else if (grandTotal === 0) {
        console.log(`\n✅ No backfill needed - all items have slugs!\n`);
    }

    // Verification queries
    if (!isDryRun && grandUpdated > 0) {
        console.log(`\n🔍 Verification queries (run in psql or DB tool):`);
        console.log(`   SELECT COUNT(*) as missing_slugs FROM "Aide" WHERE slug IS NULL;`);
        console.log(`   SELECT COUNT(*) as missing_slugs FROM "Demarche" WHERE slug IS NULL;`);
        console.log(`   SELECT COUNT(*) as missing_slugs FROM "Structure" WHERE slug IS NULL;`);
        console.log(`   SELECT COUNT(*) as missing_slugs FROM "Actualite" WHERE slug IS NULL;\n`);
    }
}

main()
    .catch(error => {
        console.error('\n❌ Fatal error:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
