/**
 * Cleanup script for removing test data from production.
 *
 * Usage:
 *   DRY_RUN=true node scripts/cleanup-prod-test-data.js   # Preview only (default)
 *   DRY_RUN=false node scripts/cleanup-prod-test-data.js  # Actually delete
 */
import { db } from '../src/db/index.js';
import { Actualite, Structure, Aide, Demarche } from '../src/db/schema.js';
import { or, ilike, eq, inArray } from 'drizzle-orm';

const DRY_RUN = process.env.DRY_RUN !== 'false';

async function main() {
    console.log(`🧹 Cleanup prod test data ${DRY_RUN ? '(DRY RUN — no changes)' : '(LIVE — will delete!)'}\n`);

    if (!DRY_RUN && process.env.NODE_ENV === 'production') {
        console.warn('⚠️  Running in LIVE mode against PRODUCTION. Are you sure?');
        console.warn('   Set CONFIRM_PROD=true to proceed.');
        if (process.env.CONFIRM_PROD !== 'true') {
            process.exit(1);
        }
    }

    let totalDeleted = 0;

    // 1. Test actualités
    const testActus = await db.select({ id: Actualite.id, titre: Actualite.titre, source_name: Actualite.source_name })
        .from(Actualite)
        .where(or(
            ilike(Actualite.titre, 'Actualité Test%'),
            ilike(Actualite.titre, '%[TEST]%'),
            ilike(Actualite.source_name, 'Test Source'),
        )).catch(() => []);

    console.log(`📰 Actualités test trouvées: ${testActus.length}`);
    testActus.forEach(a => console.log(`   - [${a.id}] ${a.titre} (source: ${a.source_name})`));

    if (!DRY_RUN && testActus.length > 0) {
        const ids = testActus.map(a => a.id);
        await db.delete(Actualite).where(inArray(Actualite.id, ids));
        console.log(`   ✅ Supprimé ${testActus.length} actualités test.`);
        totalDeleted += testActus.length;
    }

    // 2. Test structures
    const testStructures = await db.select({ id: Structure.id, nom: Structure.nom, ville: Structure.ville, telephone: Structure.telephone, adresse: Structure.adresse })
        .from(Structure)
        .where(or(
            ilike(Structure.nom, '%test%'),
            ilike(Structure.adresse, '%rue de Test%'),
            eq(Structure.telephone, '0102030405'),
            eq(Structure.telephone, '01 02 03 04 05'),
        )).catch(() => []);

    console.log(`\n🏢 Structures test trouvées: ${testStructures.length}`);
    testStructures.forEach(s => console.log(`   - [${s.id}] ${s.nom} (${s.ville}) tel:${s.telephone} addr:${s.adresse}`));

    if (!DRY_RUN && testStructures.length > 0) {
        const ids = testStructures.map(s => s.id);
        await db.delete(Structure).where(inArray(Structure.id, ids));
        console.log(`   ✅ Supprimé ${testStructures.length} structures test.`);
        totalDeleted += testStructures.length;
    }

    // 3. Test aides
    const testAides = await db.select({ id: Aide.id, titre: Aide.titre, providerName: Aide.providerName })
        .from(Aide)
        .where(or(
            ilike(Aide.titre, 'Aide Test%'),
            ilike(Aide.titre, '%[TEST]%'),
            ilike(Aide.titre, '%[SEED]%'),
            eq(Aide.providerName, 'seed'),
            eq(Aide.providerName, 'test'),
        )).catch(() => []);

    console.log(`\n🆘 Aides test trouvées: ${testAides.length}`);
    testAides.forEach(a => console.log(`   - [${a.id}] ${a.titre} (provider: ${a.providerName})`));

    if (!DRY_RUN && testAides.length > 0) {
        const ids = testAides.map(a => a.id);
        await db.delete(Aide).where(inArray(Aide.id, ids));
        console.log(`   ✅ Supprimé ${testAides.length} aides test.`);
        totalDeleted += testAides.length;
    }

    // 4. Test démarches
    const testDemarches = await db.select({ id: Demarche.id, titre: Demarche.titre })
        .from(Demarche)
        .where(or(
            ilike(Demarche.titre, 'Démarche Test%'),
            ilike(Demarche.titre, 'Demarche Test%'),
            ilike(Demarche.titre, '%[TEST]%'),
        )).catch(() => []);

    console.log(`\n📋 Démarches test trouvées: ${testDemarches.length}`);
    testDemarches.forEach(d => console.log(`   - [${d.id}] ${d.titre}`));

    if (!DRY_RUN && testDemarches.length > 0) {
        const ids = testDemarches.map(d => d.id);
        await db.delete(Demarche).where(inArray(Demarche.id, ids));
        console.log(`   ✅ Supprimé ${testDemarches.length} démarches test.`);
        totalDeleted += testDemarches.length;
    }

    console.log(`\n✨ Cleanup terminé. ${DRY_RUN ? '(Aucune suppression — dry run)' : `${totalDeleted} entrées supprimées au total.`}`);
    if (DRY_RUN) {
        console.log('ℹ  Pour appliquer: DRY_RUN=false node scripts/cleanup-prod-test-data.js');
    }
}

main()
    .catch((e) => {
        console.error('❌ Erreur:', e);
        process.exit(1);
    });
