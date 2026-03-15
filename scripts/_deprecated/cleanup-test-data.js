#!/usr/bin/env node

/**
 * cleanup-test-data.js — Remove test/seed data from production database.
 * 
 * Usage:
 *   node scripts/cleanup-test-data.js           # dry-run (report only)
 *   node scripts/cleanup-test-data.js --execute  # actually delete
 */

import { db } from '../src/db/index.js';
import { Structure, Actualite, Aide, Demarche } from '../src/db/schema.js';
import { or, like, eq, inArray } from 'drizzle-orm';

const isDryRun = !process.argv.includes('--execute');

async function run() {
    console.log(`\n🧹 Cleanup Test Data — ${isDryRun ? 'DRY RUN' : '⚠️  EXECUTING'}\n`);

    const results = [];

    // 1. Structures
    const testStructures = await db.select({ id: Structure.id, slug: Structure.slug, nom: Structure.nom }).from(Structure)
        .where(or(
            like(Structure.slug, 'structure-test%'),
            like(Structure.siret, '000000%'),
            eq(Structure.source_name, 'Test Source'),
            like(Structure.nom, 'Structure Test%'),
        ));
    results.push({ model: 'Structure', count: testStructures.length, items: testStructures.map(s => s.nom || s.slug) });

    // 2. Actualités
    const testActus = await db.select({ id: Actualite.id, slug: Actualite.slug, titre: Actualite.titre }).from(Actualite)
        .where(or(
            like(Actualite.slug, 'actu-test%'),
            eq(Actualite.source_name, 'Test Source'),
            like(Actualite.titre, 'Actualité Test%'),
        ));
    results.push({ model: 'Actualite', count: testActus.length, items: testActus.map(a => a.titre || a.slug) });

    // 3. Aides
    const testAides = await db.select({ id: Aide.id, slug: Aide.slug, titre: Aide.titre }).from(Aide)
        .where(or(
            like(Aide.slug, 'aide-test%'),
            eq(Aide.source_name, 'Test Source'),
            like(Aide.titre, 'Aide Test%'),
        ));
    results.push({ model: 'Aide', count: testAides.length, items: testAides.map(a => a.titre || a.slug) });

    // 4. Démarches
    const testDemarches = await db.select({ id: Demarche.id, slug: Demarche.slug, titre: Demarche.titre }).from(Demarche)
        .where(or(
            like(Demarche.slug, 'demarche-test%'),
            like(Demarche.titre, 'Démarche Test%'),
        ));
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
        return;
    }

    if (isDryRun) {
        console.log(`\n⚠️  ${totalFound} record(s) would be deleted. Run with --execute to apply.\n`);
        return;
    }

    // Execute deletions
    console.log(`\n🗑️  Deleting ${totalFound} test record(s)...\n`);

    if (testStructures.length) {
        await db.delete(Structure).where(inArray(Structure.id, testStructures.map(s => s.id)));
        console.log(`  ✅ Deleted ${testStructures.length} Structure(s)`);
    }
    if (testActus.length) {
        await db.delete(Actualite).where(inArray(Actualite.id, testActus.map(a => a.id)));
        console.log(`  ✅ Deleted ${testActus.length} Actualite(s)`);
    }
    if (testAides.length) {
        await db.delete(Aide).where(inArray(Aide.id, testAides.map(a => a.id)));
        console.log(`  ✅ Deleted ${testAides.length} Aide(s)`);
    }
    if (testDemarches.length) {
        await db.delete(Demarche).where(inArray(Demarche.id, testDemarches.map(d => d.id)));
        console.log(`  ✅ Deleted ${testDemarches.length} Demarche(s)`);
    }

    console.log('\n✅ Cleanup complete.\n');
}

run().catch(err => {
    console.error('Cleanup failed:', err);
    process.exit(1);
});
