#!/usr/bin/env node
/**
 * Migrate démarches with category "Autre" → canonical categories.
 *
 * Usage:
 *   DRY_RUN=true  node scripts/migrate-demarches-autre.js   # Preview (default)
 *   DRY_RUN=false node scripts/migrate-demarches-autre.js   # Apply changes
 *
 * Requires: DATABASE_URL in environment or .env
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const DRY_RUN = process.env.DRY_RUN !== 'false';
const prisma = new PrismaClient();

// ── Keyword → canonical category mapping ──────────────────────
const KEYWORD_MAP = [
    { keywords: ['mobilit', 'transport', 'permis', 'vélo', 'voiture', 'déplac'], slug: 'transports' },
    { keywords: ['logement', 'loyer', 'hébergement', 'habitation', 'hlm', 'locataire'], slug: 'logement' },
    { keywords: ['emploi', 'formation', 'cv', 'travail', 'apprentissage', 'stage', 'chômage'], slug: 'travail-formation' },
    { keywords: ['santé', 'médical', 'soin', 'hôpital', 'carte vitale', 'maladie'], slug: 'social-sante' },
    { keywords: ['famille', 'enfant', 'naissance', 'mariage', 'scolarité'], slug: 'famille' },
    { keywords: ['handicap', 'invalidité', 'aah', 'mdph', 'rqth'], slug: 'handicap' },
    { keywords: ['retraite', 'âgé', 'senior', 'ehpad', 'apa', 'aspa'], slug: 'personnes-agees' },
    { keywords: ['impôt', 'argent', 'dette', 'budget', 'surendettement'], slug: 'argent-impots' },
    { keywords: ['justice', 'tribunal', 'avocat', 'aide juridictionnelle'], slug: 'justice' },
    { keywords: ['étranger', 'titre de séjour', 'asile', 'naturalisation'], slug: 'etranger' },
    { keywords: ['identité', 'passeport', 'état civil', 'carte d\'identité'], slug: 'papiers-citoyennete' },
    { keywords: ['numérique', 'internet', 'ordinateur'], slug: 'numerique' },
];

function guessCategory(titre, description) {
    const text = `${titre || ''} ${description || ''}`.toLowerCase();
    for (const { keywords, slug } of KEYWORD_MAP) {
        for (const kw of keywords) {
            if (text.includes(kw)) return slug;
        }
    }
    return 'papiers-citoyennete'; // neutral fallback — never "autre"
}

async function main() {
    console.log(`\n🏷️  Migrate démarches "Autre" → canonical category`);
    console.log(`   Mode: ${DRY_RUN ? '🔍 DRY RUN (preview)' : '⚡ LIVE (applying)'}\n`);

    // Find the "autre" category
    const autreCat = await prisma.category.findFirst({ where: { slug: 'autre' } });
    if (!autreCat) {
        console.log('✅ No "autre" category found in database. Nothing to do.');
        return;
    }

    // Find démarches with "autre" category
    const demarches = await prisma.demarche.findMany({
        where: { categoryId: autreCat.id },
        select: { id: true, titre: true, description_courte: true, slug: true },
    });

    if (demarches.length === 0) {
        console.log('✅ No démarches with "autre" category. Nothing to do.');
        return;
    }

    console.log(`Found ${demarches.length} démarche(s) with category "autre":\n`);

    for (const d of demarches) {
        const newSlug = guessCategory(d.titre, d.description_courte);
        const targetCat = await prisma.category.findFirst({ where: { slug: newSlug } });

        if (!targetCat) {
            console.log(`  ⚠️  [${d.slug}] "${d.titre}" → ${newSlug} — CATEGORY NOT FOUND, skipping`);
            continue;
        }

        console.log(`  📝 [${d.slug}] "${d.titre}"`);
        console.log(`     autre → ${newSlug} (${targetCat.label})`);

        if (!DRY_RUN) {
            await prisma.demarche.update({
                where: { id: d.id },
                data: { categoryId: targetCat.id },
            });
            console.log(`     ✅ Updated`);
        }
    }

    console.log(`\n${DRY_RUN ? 'ℹ  Pour appliquer: DRY_RUN=false node scripts/migrate-demarches-autre.js' : '✅ Migration complete'}\n`);
}

main()
    .catch(e => { console.error('❌ Migration error:', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
