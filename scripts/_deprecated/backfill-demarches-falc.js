#!/usr/bin/env node
/**
 * Backfill summary_falc for démarches that have null FALC summary.
 *
 * Usage:
 *   DRY_RUN=true  node scripts/backfill-demarches-falc.js   # Preview (default)
 *   DRY_RUN=false node scripts/backfill-demarches-falc.js   # Apply changes
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { db } from '../src/db/index.js';
import { Demarche } from '../src/db/schema.js';
import { isNull, eq } from 'drizzle-orm';

const DRY_RUN = process.env.DRY_RUN !== 'false';

function generateFalcSummary(titre, descriptionCourte) {
    const name = (titre || 'cette démarche').replace(/^Demander\s+/i, '').replace(/^Mettre à jour\s+/i, '');

    if (descriptionCourte && descriptionCourte.length > 10) {
        const simplified = descriptionCourte
            .replace(/étapes pour/gi, 'Voici comment')
            .replace(/selon votre situation/gi, '')
            .trim();
        return `${simplified} Cette démarche est gratuite. Vous pouvez la faire en ligne ou dans un guichet.`;
    }

    return `Cette démarche vous aide pour ${name}. Elle est gratuite. Vous pouvez la faire en ligne ou dans un point d'accueil.`;
}

async function main() {
    console.log(`\n📖 Backfill summary_falc for démarches`);
    console.log(`   Mode: ${DRY_RUN ? '🔍 DRY RUN (preview)' : '⚡ LIVE (applying)'}\n`);

    const demarches = await db.query.Demarche.findMany({
        where: isNull(Demarche.summary_falc),
        columns: { id: true, titre: true, description_courte: true, slug: true },
    });

    if (demarches.length === 0) {
        console.log('✅ All démarches already have summary_falc. Nothing to do.');
        return;
    }

    console.log(`Found ${demarches.length} démarche(s) with missing summary_falc:\n`);

    for (const d of demarches) {
        const falc = generateFalcSummary(d.titre, d.description_courte);
        console.log(`  📝 [${d.slug}] "${d.titre}"`);
        console.log(`     FALC: "${falc}"`);

        if (!DRY_RUN) {
            await db.update(Demarche).set({ summary_falc: falc }).where(eq(Demarche.id, d.id));
            console.log(`     ✅ Updated`);
        }
    }

    console.log(`\n${DRY_RUN ? 'ℹ  Pour appliquer: DRY_RUN=false node scripts/backfill-demarches-falc.js' : '✅ Backfill complete'}\n`);
}

main()
    .catch(e => { console.error('❌ Backfill error:', e); process.exit(1); });
