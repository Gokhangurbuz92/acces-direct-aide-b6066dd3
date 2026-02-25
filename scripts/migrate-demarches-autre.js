#!/usr/bin/env node
/**
 * Migrate démarches with category "Autre" → canonical categories.
 *
 * Looks at BOTH:
 *   - demarche.categorie (legacy string field, e.g. "Autre")
 *   - demarche.category  (FK relation → AidCategory.slug, e.g. "autre")
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
    { keywords: ['emploi', 'formation', 'cv', 'travail', 'apprentissage', 'stage', 'chômage', 'france travail'], slug: 'travail-formation' },
    { keywords: ['santé', 'médical', 'soin', 'hôpital', 'carte vitale', 'maladie', 'css', 'ameli'], slug: 'social-sante' },
    { keywords: ['famille', 'enfant', 'naissance', 'mariage', 'scolarité', 'caf'], slug: 'famille' },
    { keywords: ['handicap', 'invalidité', 'aah', 'mdph', 'rqth'], slug: 'handicap' },
    { keywords: ['retraite', 'âgé', 'senior', 'ehpad', 'apa', 'aspa'], slug: 'personnes-agees' },
    { keywords: ['impôt', 'argent', 'dette', 'budget', 'surendettement'], slug: 'argent-impots' },
    { keywords: ['justice', 'tribunal', 'avocat', 'aide juridictionnelle'], slug: 'justice' },
    { keywords: ['étranger', 'titre de séjour', 'asile', 'naturalisation'], slug: 'etranger' },
    { keywords: ['identité', 'passeport', 'état civil', 'carte d\'identité', 'cni'], slug: 'papiers-citoyennete' },
    { keywords: ['numérique', 'internet', 'ordinateur'], slug: 'numerique' },
    { keywords: ['alimentaire', 'épicerie', 'repas', 'colis'], slug: 'social-sante' },
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

    // Strategy 1: Check via AidCategory relation (categoryId → AidCategory.slug = "autre")
    const autreCat = await prisma.aidCategory.findFirst({ where: { slug: 'autre' } });

    // Strategy 2: Check via legacy string field (categorie = "Autre")
    const demarchesFromRelation = autreCat
        ? await prisma.demarche.findMany({
            where: { categoryId: autreCat.id },
            select: { id: true, titre: true, description_courte: true, slug: true, categorie: true, categoryId: true },
        })
        : [];

    const demarchesFromString = await prisma.demarche.findMany({
        where: {
            categorie: { in: ['Autre', 'autre', 'AUTRE'], mode: 'insensitive' },
        },
        select: { id: true, titre: true, description_courte: true, slug: true, categorie: true, categoryId: true },
    });

    // Merge and deduplicate
    const seen = new Set();
    const allDemarches = [];
    for (const d of [...demarchesFromRelation, ...demarchesFromString]) {
        if (!seen.has(d.id)) {
            seen.add(d.id);
            allDemarches.push(d);
        }
    }

    if (allDemarches.length === 0) {
        console.log('✅ No démarches with "autre" category found. Nothing to do.');
        return;
    }

    console.log(`Found ${allDemarches.length} démarche(s) with category "autre":\n`);

    // Load all categories for mapping
    const allCategories = await prisma.aidCategory.findMany({ select: { id: true, slug: true, label: true } });
    const catBySlug = Object.fromEntries(allCategories.map(c => [c.slug, c]));

    let updated = 0;
    for (const d of allDemarches) {
        const newSlug = guessCategory(d.titre, d.description_courte);
        const targetCat = catBySlug[newSlug];

        console.log(`  📝 [${d.slug || d.id}] "${d.titre}"`);
        console.log(`     categorie: "${d.categorie}" | categoryId: ${d.categoryId ? '✓' : '∅'}`);

        if (!targetCat) {
            console.log(`     ⚠️  Target "${newSlug}" not found in AidCategory table — skipping`);
            continue;
        }

        console.log(`     → ${newSlug} (${targetCat.label})`);

        if (!DRY_RUN) {
            const updateData = {};
            // Update string field
            if (d.categorie && d.categorie.toLowerCase() === 'autre') {
                updateData.categorie = targetCat.label;
            }
            // Update relation
            if (d.categoryId === (autreCat?.id || null)) {
                updateData.categoryId = targetCat.id;
            }

            if (Object.keys(updateData).length > 0) {
                await prisma.demarche.update({
                    where: { id: d.id },
                    data: updateData,
                });
                console.log(`     ✅ Updated`);
                updated++;
            } else {
                console.log(`     ℹ  No fields to update`);
            }
        }
    }

    console.log(`\n${DRY_RUN ? 'ℹ  Pour appliquer: DRY_RUN=false node scripts/migrate-demarches-autre.js' : `✅ Migration complete (${updated} updated)`}\n`);
}

main()
    .catch(e => { console.error('❌ Migration error:', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
