#!/usr/bin/env node
/**
 * Script de traitement par lot (batch) pour générer automatiquement du contenu FALC
 * (Facile À Lire et à Comprendre) pour les Aides et Démarches via l'API Gemini.
 *
 * Usage:
 *   node scripts/ingest-falc.js [batchSize]
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { db } from '../src/db/index.js';
import { Aide, Demarche } from '../src/db/schema.js';
import { or, isNull, eq } from 'drizzle-orm';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!apiKey) {
    console.error("❌ ERREUR: GEMINI_API_KEY (ou GOOGLE_API_KEY) n'est pas défini dans l'environnement.");
    process.exit(1);
}
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

const BATCH_SIZE = parseInt(process.argv[2], 10) || 10;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateFalcWithGemini(contextTitle, contextDesc) {
    const prompt = `
En tant qu'expert en accessibilité numérique et rédacteur spécialisé en FALC (Facile À Lire et à Comprendre), ta mission est de réécrire les informations suivantes.

Règles de rédaction strictes :
- Utilise des phrases très courtes (une idée par phrase).
- Utilise des mots simples du quotidien, évite le jargon administratif.
- Adresse-toi directement à l'usager ("Vous" ou "Tu", soit bienveillant).
- Ne renvoie AUCUN texte autour, retourne UNIQUEMENT le texte FALC généré. Le résultat sera inséré directement.

Contenu d'origine :
Titre : ${contextTitle}
Description : ${contextDesc || "Aucune description fournie."}

Réécris ce contenu en 2 à 3 phrases claires et accessibles :
`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error("❌ Erreur de génération Gemini:", error.message);
        return null;
    }
}

async function processAides() {
    console.log(`\n🔍 Recherche des Aides sans FALC (Limite: ${BATCH_SIZE})...`);
    const aides = await db.query.Aide.findMany({
        where: or(isNull(Aide.summary_falc), eq(Aide.summary_falc, '')),
        limit: BATCH_SIZE,
        columns: { id: true, titre: true, cest_quoi: true, description: true, slug: true },
    });

    if (aides.length === 0) {
        console.log("✅ Toutes les Aides ont déjà une description FALC.");
        return;
    }

    console.log(`Trouvé ${aides.length} Aides à traiter.`);
    for (const aide of aides) {
        console.log(`\n⏳ Traitement Aide: [${aide.slug}] ${aide.titre}`);
        const falcResult = await generateFalcWithGemini(aide.titre, aide.cest_quoi || aide.description);

        if (falcResult) {
            console.log(`📝 FALC Généré: "${falcResult}"`);
            await db.update(Aide).set({ summary_falc: falcResult }).where(eq(Aide.id, aide.id));
            console.log(`✅ Mise à jour DB réussie.`);
        } else {
            console.log(`⚠️ Échec de la génération pour cette Aide.`);
        }

        await delay(1500);
    }
}

async function processDemarches() {
    console.log(`\n🔍 Recherche des Démarches sans FALC (Limite: ${BATCH_SIZE})...`);
    const demarches = await db.query.Demarche.findMany({
        where: or(isNull(Demarche.summary_falc), eq(Demarche.summary_falc, '')),
        limit: BATCH_SIZE,
        columns: { id: true, titre: true, description_courte: true, slug: true },
    });

    if (demarches.length === 0) {
        console.log("✅ Toutes les Démarches ont déjà une description FALC.");
        return;
    }

    console.log(`Trouvé ${demarches.length} Démarches à traiter.`);
    for (const d of demarches) {
        console.log(`\n⏳ Traitement Démarche: [${d.slug}] ${d.titre}`);
        const falcResult = await generateFalcWithGemini(d.titre, d.description_courte);

        if (falcResult) {
            console.log(`📝 FALC Généré: "${falcResult}"`);
            await db.update(Demarche).set({ summary_falc: falcResult }).where(eq(Demarche.id, d.id));
            console.log(`✅ Mise à jour DB réussie.`);
        } else {
            console.log(`⚠️ Échec de la génération pour cette Démarche.`);
        }

        await delay(1500);
    }
}

async function main() {
    console.log(`🔧 Lancement du Pipeline d'ingestion FALC (Batch Size: ${BATCH_SIZE})`);
    await processAides();
    await processDemarches();
    console.log(`\n🎉 Pipeline d'ingestion FALC terminé !`);
}

main()
    .catch((e) => {
        console.error('❌ Erreur globale du script:', e);
        process.exit(1);
    });
