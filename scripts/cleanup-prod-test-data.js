/**
 * Cleanup script for removing test data from production.
 *
 * Usage:
 *   DRY_RUN=true node scripts/cleanup-prod-test-data.js   # Preview only (default)
 *   DRY_RUN=false node scripts/cleanup-prod-test-data.js  # Actually delete
 *
 * Targets:
 *   - Actualités with "Actualité Test" in title or source_name = "Test Source"
 *   - Structures with "rue de Test" in address or phone "0102030405" or "test" in name
 *   - Aides with "Aide Test" in title, providerName = "test"/"seed"
 *   - Démarches with "Démarche Test" in title
 */
import prisma from '../api/_utils/prisma.js';

const DRY_RUN = process.env.DRY_RUN !== 'false';

async function main() {
    console.log(`🧹 Cleanup prod test data ${DRY_RUN ? '(DRY RUN — no changes)' : '(LIVE — will delete!)'}\n`);

    // Guard: never run in production without explicit opt-in
    if (!DRY_RUN && process.env.NODE_ENV === 'production') {
        console.warn('⚠️  Running in LIVE mode against PRODUCTION. Are you sure?');
        console.warn('   Set CONFIRM_PROD=true to proceed.');
        if (process.env.CONFIRM_PROD !== 'true') {
            process.exit(1);
        }
    }

    let totalDeleted = 0;

    // 1. Test actualités
    const testActus = await prisma.actualite.findMany({
        where: {
            OR: [
                { titre: { startsWith: 'Actualité Test', mode: 'insensitive' } },
                { titre: { startsWith: 'Actualité test', mode: 'insensitive' } },
                { titre: { contains: '[TEST]', mode: 'insensitive' } },
                { source_nom: { equals: 'Test Source', mode: 'insensitive' } },
                { source_name: { equals: 'Test Source', mode: 'insensitive' } },
                { source: { equals: 'Test Source', mode: 'insensitive' } },
            ],
        },
        select: { id: true, titre: true, source_nom: true, source_name: true, source: true },
    }).catch(() => []);

    console.log(`📰 Actualités test trouvées: ${testActus.length}`);
    testActus.forEach(a => console.log(`   - [${a.id}] ${a.titre} (source: ${a.source_nom || a.source_name || a.source})`));

    if (!DRY_RUN && testActus.length > 0) {
        const ids = testActus.map(a => a.id);
        const result = await prisma.actualite.deleteMany({ where: { id: { in: ids } } });
        console.log(`   ✅ Supprimé ${result.count} actualités test.`);
        totalDeleted += result.count;
    }

    // 2. Test structures
    const testStructures = await prisma.structure.findMany({
        where: {
            OR: [
                { nom: { contains: 'test', mode: 'insensitive' } },
                { nom: { startsWith: 'Structure Test', mode: 'insensitive' } },
                { adresse: { contains: 'rue de Test', mode: 'insensitive' } },
                { telephone: { equals: '0102030405' } },
                { telephone: { equals: '01 02 03 04 05' } },
            ],
        },
        select: { id: true, nom: true, ville: true, telephone: true, adresse: true },
    }).catch(() => []);

    console.log(`\n🏢 Structures test trouvées: ${testStructures.length}`);
    testStructures.forEach(s => console.log(`   - [${s.id}] ${s.nom} (${s.ville}) tel:${s.telephone} addr:${s.adresse}`));

    if (!DRY_RUN && testStructures.length > 0) {
        const ids = testStructures.map(s => s.id);
        const result = await prisma.structure.deleteMany({ where: { id: { in: ids } } });
        console.log(`   ✅ Supprimé ${result.count} structures test.`);
        totalDeleted += result.count;
    }

    // 3. Test aides
    const testAides = await prisma.aide.findMany({
        where: {
            OR: [
                { titre: { startsWith: 'Aide Test', mode: 'insensitive' } },
                { titre: { startsWith: 'Aide test', mode: 'insensitive' } },
                { titre: { contains: '[TEST]', mode: 'insensitive' } },
                { titre: { contains: '[SEED]', mode: 'insensitive' } },
                { providerName: 'seed' },
                { providerName: 'test' },
            ],
        },
        select: { id: true, titre: true, providerName: true },
    }).catch(() => []);

    console.log(`\n🆘 Aides test trouvées: ${testAides.length}`);
    testAides.forEach(a => console.log(`   - [${a.id}] ${a.titre} (provider: ${a.providerName})`));

    if (!DRY_RUN && testAides.length > 0) {
        const ids = testAides.map(a => a.id);
        const result = await prisma.aide.deleteMany({ where: { id: { in: ids } } });
        console.log(`   ✅ Supprimé ${result.count} aides test.`);
        totalDeleted += result.count;
    }

    // 4. Test démarches
    const testDemarches = await prisma.demarche.findMany({
        where: {
            OR: [
                { titre: { startsWith: 'Démarche Test', mode: 'insensitive' } },
                { titre: { startsWith: 'Demarche Test', mode: 'insensitive' } },
                { titre: { contains: '[TEST]', mode: 'insensitive' } },
            ],
        },
        select: { id: true, titre: true },
    }).catch(() => []);

    console.log(`\n📋 Démarches test trouvées: ${testDemarches.length}`);
    testDemarches.forEach(d => console.log(`   - [${d.id}] ${d.titre}`));

    if (!DRY_RUN && testDemarches.length > 0) {
        const ids = testDemarches.map(d => d.id);
        const result = await prisma.demarche.deleteMany({ where: { id: { in: ids } } });
        console.log(`   ✅ Supprimé ${result.count} démarches test.`);
        totalDeleted += result.count;
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
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
