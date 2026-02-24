#!/usr/bin/env node

/**
 * cleanup-test-data.js — Remove test/seed data from production database.
 * 
 * Usage:
 *   node scripts/cleanup-test-data.js           # dry-run (report only)
 *   node scripts/cleanup-test-data.js --execute  # actually delete
 *
 * Patterns removed:
 *   - Structures with slug matching 'structure-test-*' or siret '000*'
 *   - Actualités with slug matching 'actu-test-*'
 *   - Aides with slug matching 'aide-test-*'
 *   - Any record with source_name = 'Test Source'
 *
 * SAFE: This script is idempotent — running it multiple times has no ill effect.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const isDryRun = !process.argv.includes('--execute');

async function run() {
    console.log(`\n🧹 Cleanup Test Data — ${isDryRun ? 'DRY RUN' : '⚠️  EXECUTING'}\n`);

    const results = [];

    // 1. Structures
    const testStructures = await prisma.structure.findMany({
        where: {
            OR: [
                { slug: { startsWith: 'structure-test' } },
                { siret: { startsWith: '000000' } },
                { source_name: 'Test Source' },
                { nom: { startsWith: 'Structure Test' } },
            ],
        },
        select: { id: true, slug: true, nom: true },
    });
    results.push({ model: 'Structure', count: testStructures.length, items: testStructures.map(s => s.nom || s.slug) });

    // 2. Actualités
    const testActus = await prisma.actualite.findMany({
        where: {
            OR: [
                { slug: { startsWith: 'actu-test' } },
                { source_name: 'Test Source' },
                { titre: { startsWith: 'Actualité Test' } },
            ],
        },
        select: { id: true, slug: true, titre: true },
    });
    results.push({ model: 'Actualite', count: testActus.length, items: testActus.map(a => a.titre || a.slug) });

    // 3. Aides
    const testAides = await prisma.aide.findMany({
        where: {
            OR: [
                { slug: { startsWith: 'aide-test' } },
                { source_name: 'Test Source' },
                { titre: { startsWith: 'Aide Test' } },
            ],
        },
        select: { id: true, slug: true, titre: true },
    });
    results.push({ model: 'Aide', count: testAides.length, items: testAides.map(a => a.titre || a.slug) });

    // 4. Démarches
    const testDemarches = await prisma.demarche.findMany({
        where: {
            OR: [
                { slug: { startsWith: 'demarche-test' } },
                { titre: { startsWith: 'Démarche Test' } },
            ],
        },
        select: { id: true, slug: true, titre: true },
    });
    results.push({ model: 'Demarche', count: testDemarches.length, items: testDemarches.map(d => d.titre || d.slug) });

    // Report
    let totalFound = 0;
    for (const r of results) {
        totalFound += r.count;
        if (r.count > 0) {
            console.log(`  ${r.model}: ${r.count} test record(s) found`);
            for (const item of r.items.slice(0, 5)) {
                console.log(`    - ${item}`);
            }
            if (r.items.length > 5) console.log(`    ... and ${r.items.length - 5} more`);
        } else {
            console.log(`  ${r.model}: ✅ clean`);
        }
    }

    if (totalFound === 0) {
        console.log('\n✅ No test data found — database is clean.\n');
        await prisma.$disconnect();
        return;
    }

    if (isDryRun) {
        console.log(`\n⚠️  ${totalFound} record(s) would be deleted. Run with --execute to apply.\n`);
        await prisma.$disconnect();
        return;
    }

    // Execute deletions
    console.log(`\n🗑️  Deleting ${totalFound} test record(s)...\n`);

    if (testStructures.length) {
        await prisma.structure.deleteMany({ where: { id: { in: testStructures.map(s => s.id) } } });
        console.log(`  ✅ Deleted ${testStructures.length} Structure(s)`);
    }
    if (testActus.length) {
        await prisma.actualite.deleteMany({ where: { id: { in: testActus.map(a => a.id) } } });
        console.log(`  ✅ Deleted ${testActus.length} Actualite(s)`);
    }
    if (testAides.length) {
        await prisma.aide.deleteMany({ where: { id: { in: testAides.map(a => a.id) } } });
        console.log(`  ✅ Deleted ${testAides.length} Aide(s)`);
    }
    if (testDemarches.length) {
        await prisma.demarche.deleteMany({ where: { id: { in: testDemarches.map(d => d.id) } } });
        console.log(`  ✅ Deleted ${testDemarches.length} Demarche(s)`);
    }

    console.log('\n✅ Cleanup complete.\n');
    await prisma.$disconnect();
}

run().catch(err => {
    console.error('Cleanup failed:', err);
    process.exit(1);
});
