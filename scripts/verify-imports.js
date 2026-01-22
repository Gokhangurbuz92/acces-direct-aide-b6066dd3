import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyImports() {
    console.log('🚀 Starting Import Verification...');

    try {
        // 1. Check Aides Alsace
        const aidesCount = await prisma.aide.count({
            where: { territoires: { has: 'Alsace' } }
        });
        console.log(`📊 Aides in Alsace: ${aidesCount}`);
        if (aidesCount >= 5) { // We imported 15
            console.log('✅ Alsace Aides verified.');
        } else {
            console.warn('⚠️ Alsace Aides count low or zero.');
        }

        // 2. Check Structures Alsace
        const structuresCount = await prisma.structure.count({
            where: { departement: { in: ['67', '68'] } }
        });
        console.log(`📊 Structures in 67/68: ${structuresCount}`);
        if (structuresCount >= 10) { // We imported 30
            console.log('✅ Alsace Structures verified.');
        } else {
            console.warn('⚠️ Alsace Structures count low or zero.');
        }

        // 3. Check Demarches Alsace
        const demarchesCount = await prisma.demarche.count({
            where: { departements: { hasSome: ['67', '68'] } }
        });
        console.log(`📊 Demarches in 67/68: ${demarchesCount}`);
        if (demarchesCount >= 5) { // We imported 10
            console.log('✅ Alsace Demarches verified.');
        } else {
            console.warn('⚠️ Alsace Demarches count low or zero.');
        }

        // 4. Check Dispositifs
        const dispositifsCount = await prisma.dispositif.count();
        console.log(`📊 Dispositifs: ${dispositifsCount}`);

        // 5. Data Quality Check (FALC)
        const falcAides = await prisma.aide.count({
            where: {
                conditions_falc: { not: null },
                montant_falc: { not: null }
            }
        });
        console.log(`📊 Aides with FALC fields: ${falcAides}`);

        console.log('🎉 Import Verification complete!');
    } catch (e) {
        console.error('❌ Import Verification failed:', e.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

verifyImports();
