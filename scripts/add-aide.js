#!/usr/bin/env node

/**
 * add-aide.js
 *
 * Ajoute une aide depuis un fichier JSON et génère son embedding immédiatement.
 *
 * Usage:
 *   GEMINI_API_KEY=xxx node scripts/add-aide.js path/to/aide.json
 *   GEMINI_API_KEY=xxx node scripts/add-aide.js path/to/aide.json --dry-run
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../src/db/index.js';
import { Aide } from '../src/db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

function toSlug(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function buildEmbedText(aide) {
    const parts = [aide.titre];
    if (aide.cest_quoi) parts.push(aide.cest_quoi);
    if (aide.pour_qui) parts.push(aide.pour_qui);
    if (aide.ce_que_ca_aide) parts.push(aide.ce_que_ca_aide);
    if (aide.summary_falc) parts.push(aide.summary_falc);
    return parts.join('\n');
}

async function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const filePath = args.find(a => !a.startsWith('--'));

    if (!filePath) {
        console.error('❌ Usage: node scripts/add-aide.js path/to/aide.json [--dry-run]');
        process.exit(1);
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        console.error('❌ GEMINI_API_KEY (ou GOOGLE_API_KEY) manquante.');
        process.exit(1);
    }

    let aideData;
    try {
        const rawData = readFileSync(resolve(filePath), 'utf8');
        aideData = JSON.parse(rawData);
    } catch (err) {
        console.error(`❌ Impossible de lire le fichier : ${err.message}`);
        process.exit(1);
    }

    if (!aideData.titre) {
        console.error('❌ Le champ "titre" est obligatoire dans le fichier JSON.');
        process.exit(1);
    }
    if (!aideData.cest_quoi) {
        console.error('❌ Le champ "cest_quoi" est obligatoire dans le fichier JSON.');
        process.exit(1);
    }

    const slug = aideData.slug || toSlug(aideData.titre);

    console.log(`\n🚀 Traitement de l'aide : "${aideData.titre}"`);
    console.log(`   Slug : ${slug}`);

    const existing = await db.query.Aide.findFirst({
        where: eq(Aide.slug, slug),
        columns: { id: true },
    });
    if (existing) {
        console.error(`❌ Une aide avec le slug "${slug}" existe déjà (ID: ${existing.id}).`);
        console.error('   Utilisez un slug différent ou modifiez l\'aide existante.');
        process.exit(1);
    }

    console.log('   ⚡ Génération du vecteur (gemini-embedding-001)...');
    const genAI = new GoogleGenerativeAI(apiKey);
    const embedModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

    const textToEmbed = buildEmbedText(aideData);
    let vectorStr;

    try {
        const result = await embedModel.embedContent(textToEmbed);
        const vector = result.embedding.values;
        vectorStr = `[${vector.join(',')}]`;
        console.log(`   ✅ Vecteur généré (${vector.length} dimensions)`);
    } catch (err) {
        console.error(`❌ Erreur Gemini : ${err.message}`);
        if (err.message?.includes('429') || err.message?.includes('quota')) {
            console.error('   💡 Quota épuisé. Réessayez demain.');
        }
        process.exit(1);
    }

    if (dryRun) {
        console.log('\n🏷️  --dry-run : aucune insertion en base.');
        console.log('   Données qui seraient insérées :');
        console.log(`     titre: ${aideData.titre}`);
        console.log(`     slug: ${slug}`);
        console.log(`     cest_quoi: ${aideData.cest_quoi?.slice(0, 80)}...`);
        console.log(`     embedding: ${vectorStr.slice(0, 50)}... (${vectorStr.length} chars)`);
        return;
    }

    console.log('   💾 Insertion en base de données...');
    const [newAide] = await db.insert(Aide).values({
        titre: aideData.titre,
        slug,
        cest_quoi: aideData.cest_quoi || null,
        pour_qui: aideData.pour_qui || null,
        ce_que_ca_aide: aideData.ce_que_ca_aide || null,
        summary_falc: aideData.summary_falc || null,
        conditions_falc: aideData.conditions_falc || null,
        montant_falc: aideData.montant_falc || null,
        categorie: aideData.categorie || null,
        est_urgent: aideData.est_urgent || false,
        territoires: aideData.territoires || [],
        delai_indicatif: aideData.delai_indicatif || null,
        ou_demander: aideData.ou_demander || null,
        lien_demande: aideData.lien_demande || null,
        documents_necessaires: aideData.documents_necessaires || [],
        mots_cles: aideData.mots_cles || [],
        audiences: aideData.audiences || [],
        departements: aideData.departements || [],
        situations_vie: aideData.situations_vie || [],
        montant_max: aideData.montant_max || null,
        echelon_territorial: aideData.echelon_territorial || null,
        lien_demarche: aideData.lien_demarche || null,
        source_donnee: aideData.source_donnee || 'MANUAL',
        statut: aideData.statut || 'brouillon',
    }).returning();

    await db.execute(sql`UPDATE "Aide" SET embedding = ${vectorStr}::vector WHERE id = ${newAide.id}`);

    console.log(`\n✅ Aide ajoutée et indexée avec succès !`);
    console.log(`   ID    : ${newAide.id}`);
    console.log(`   Slug  : ${slug}`);
    console.log(`   Statut: ${newAide.statut}`);
    console.log(`\n💡 Pour publier : UPDATE "Aide" SET statut = 'publié', published_at = NOW() WHERE id = '${newAide.id}';`);
    console.log(`   Ou utilisez l'interface admin : /admin/aides/${newAide.id}\n`);
}

main()
    .catch(err => {
        console.error('Erreur fatale:', err);
        process.exit(1);
    });
