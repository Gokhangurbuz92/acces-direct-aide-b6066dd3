/**
 * Cleanup script for removing test data from production.
 * 
 * Usage:
 *   DRY_RUN=true node scripts/cleanup-prod-test-data.js   # Preview only (default)
 *   DRY_RUN=false node scripts/cleanup-prod-test-data.js  # Actually delete
 * 
 * Targets:
 *   - Actualités with "test" in title/source
 *   - Structures with "test" in name
 *   - Aides/Démarches flagged as seed/test data
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

    // 1. Test actualités
    const testActus = await prisma.actualite.findMany({
        where: {
            OR: [
                { titre: { contains: 'test', mode: 'insensitive' } },
                { titre: { contains: 'Test', mode: 'insensitive' } },
                { source: { contains: 'test', mode: 'insensitive' } },
            ],
        },
        select: { id: true, titre: true, source: true },
    }).catch(() => []);

    console.log(`📰 Actualités test trouvées: ${testActus.length}`);
    testActus.forEach(a => console.log(`   - [${a.id}] ${a.titre} (source: ${a.source})`));

    if (!DRY_RUN && testActus.length > 0) {
        const ids = testActus.map(a => a.id);
        await prisma.actualite.deleteMany({ where: { id: { in: ids } } });
        console.log(`   ✅ Supprimé ${ids.length} actualités test.`);
    }

    // 2. Test structures
    const testStructures = await prisma.structure.findMany({
        where: {
            OR: [
                { nom: { contains: 'test', mode: 'insensitive' } },
                { nom: { contains: 'Test', mode: 'insensitive' } },
            ],
        },
        select: { id: true, nom: true, ville: true },
    }).catch(() => []);

    console.log(`\n🏢 Structures test trouvées: ${testStructures.length}`);
    testStructures.forEach(s => console.log(`   - [${s.id}] ${s.nom} (${s.ville})`));

    if (!DRY_RUN && testStructures.length > 0) {
        const ids = testStructures.map(s => s.id);
        await prisma.structure.deleteMany({ where: { id: { in: ids } } });
        console.log(`   ✅ Supprimé ${ids.length} structures test.`);
    }

    // 3. Test aides (flagged as seed/test)
    const testAides = await prisma.aide.findMany({
        where: {
            OR: [
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
        await prisma.aide.deleteMany({ where: { id: { in: ids } } });
        console.log(`   ✅ Supprimé ${ids.length} aides test.`);
    }

    console.log('\n✨ Cleanup terminé.');
    if (DRY_RUN) {
        console.log('ℹ  C\'était un dry run. Pour appliquer: DRY_RUN=false node scripts/cleanup-prod-test-data.js');
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
