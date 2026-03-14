import { db } from '../src/db/index.js';
import { Aide, Structure, Demarche, Dispositif } from '../src/db/schema.js';
import { sql, eq, inArray, isNotNull, and } from 'drizzle-orm';

async function verifyImports() {
    console.log('🚀 Starting Import Verification...');

    try {
        // 1. Check Aides Alsace
        const [aidesResult] = await db.select({ c: sql`count(*)::int` }).from(Aide)
            .where(sql`${Aide.territoires} @> ARRAY['Alsace']::text[]`);
        const aidesCount = aidesResult?.c ?? 0;
        console.log(`📊 Aides in Alsace: ${aidesCount}`);
        if (aidesCount >= 5) {
            console.log('✅ Alsace Aides verified.');
        } else {
            console.warn('⚠️ Alsace Aides count low or zero.');
        }

        // 2. Check Structures Alsace
        const [structuresResult] = await db.select({ c: sql`count(*)::int` }).from(Structure)
            .where(inArray(Structure.departement, ['67', '68']));
        const structuresCount = structuresResult?.c ?? 0;
        console.log(`📊 Structures in 67/68: ${structuresCount}`);
        if (structuresCount >= 10) {
            console.log('✅ Alsace Structures verified.');
        } else {
            console.warn('⚠️ Alsace Structures count low or zero.');
        }

        // 3. Check Demarches Alsace
        const [demarchesResult] = await db.select({ c: sql`count(*)::int` }).from(Demarche)
            .where(sql`${Demarche.departements} && ARRAY['67','68']::text[]`);
        const demarchesCount = demarchesResult?.c ?? 0;
        console.log(`📊 Demarches in 67/68: ${demarchesCount}`);
        if (demarchesCount >= 5) {
            console.log('✅ Alsace Demarches verified.');
        } else {
            console.warn('⚠️ Alsace Demarches count low or zero.');
        }

        // 4. Check Dispositifs
        const [dispositifsResult] = await db.select({ c: sql`count(*)::int` }).from(Dispositif);
        const dispositifsCount = dispositifsResult?.c ?? 0;
        console.log(`📊 Dispositifs: ${dispositifsCount}`);

        // 5. Data Quality Check (FALC)
        const [falcResult] = await db.select({ c: sql`count(*)::int` }).from(Aide)
            .where(and(isNotNull(Aide.conditions_falc), isNotNull(Aide.montant_falc)));
        const falcAides = falcResult?.c ?? 0;
        console.log(`📊 Aides with FALC fields: ${falcAides}`);

        console.log('🎉 Import Verification complete!');
    } catch (e) {
        console.error('❌ Import Verification failed:', e.message);
        process.exit(1);
    }
}

verifyImports();
