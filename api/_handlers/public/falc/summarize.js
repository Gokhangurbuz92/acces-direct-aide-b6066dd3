import { db } from '../../../../src/db/index.js';
import { Aide, Demarche, Actualite } from '../../../../src/db/schema.js';
import { eq } from 'drizzle-orm';
import logger from '../../../_utils/logger.js';
import { generateText } from '../../../lib/gemini.js';

/**
 * FALC Summarize API (Public) — Multi-Entity
 *
 * POST /api/public/falc/summarize
 * Body: { aideId?: string, entityId?: string, type?: 'aide' | 'demarche' | 'actualite' }
 *
 * Generates a FALC version using Gemini 2.0 Flash.
 * Caches the result in DB columns for cost optimization.
 * Supports: Aides, Démarches, and Actualités.
 */

/** Entity configuration map */
const ENTITY_CONFIG = {
    aide: {
        model: Aide,
        titleField: 'titre',
        sourceFields: ['cest_quoi', 'pour_qui', 'ce_que_ca_aide', 'description'],
        cacheFields: ['summary_falc', 'conditions_falc'],
        contextLabel: "une aide sociale",
    },
    demarche: {
        model: Demarche,
        titleField: 'titre',
        sourceFields: ['description_courte', 'pour_qui', 'contenu_detaille', 'ou_faire'],
        cacheFields: ['summary_falc'],
        contextLabel: "une démarche administrative",
    },
    actualite: {
        model: Actualite,
        titleField: 'titre',
        sourceFields: ['contenu', 'resume'],
        cacheFields: ['summary_falc'],
        contextLabel: "une actualité d'aide sociale",
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const body = req.body || {};
    // Support both { aideId } (backward compat) and { entityId, type }
    const type = body.type || 'aide';
    const entityId = body.entityId || body.aideId;

    if (!entityId) {
        return res.status(400).json({ error: 'entityId (ou aideId) requis' });
    }

    const config = ENTITY_CONFIG[type];
    if (!config) {
        return res.status(400).json({ error: `Type inconnu : ${type}. Types valides : aide, demarche, actualite` });
    }

    try {
        // 1. Fetch the entity
        // We use dynamic query fallback or standard
        const entityTableName = type === 'aide' ? 'Aide' : type === 'demarche' ? 'Demarche' : 'Actualite';
        const entity = await db.query[entityTableName].findFirst({ where: (t, { eq }) => eq(t.id, entityId) });
        if (!entity) {
            return res.status(404).json({ error: `${type} introuvable` });
        }

        // 2. Return cached FALC if available (cost optimization)
        const hasCachedFalc = config.cacheFields.every(f => !!entity[f]);
        if (hasCachedFalc) {
            logger.info(`[FALC] Cache hit pour ${type}=${entityId}`);
            return res.status(200).json({
                cached: true,
                type,
                titre_simple: entity[config.titleField],
                summary_falc: entity.summary_falc,
                conditions_simples: entity.conditions_falc || null,
                montant_falc: entity.montant_falc || null,
                points_cles: entity.key_points_falc || [],
                action: 'En savoir plus',
            });
        }

        // 3. Build source text for FALC generation
        const sourceText = config.sourceFields
            .map(f => entity[f])
            .filter(Boolean)
            .join('\n\n');

        if (!sourceText) {
            return res.status(422).json({ error: `Aucun contenu à simplifier pour ${type}` });
        }

        // 4. FALC prompt engineering (entity-aware)
        const prompt = `Tu es un expert en accessibilité cognitive certifié FALC (Facile À Lire et à Comprendre).

MISSION : Simplifie ${config.contextLabel} en langage FALC en suivant un raisonnement en chaîne.

═══ ÉTAPE 1 — ANALYSE ═══
Lis le texte ci-dessous. Identifie mentalement :
- Le sujet principal (en 1 mot)
- Les 3-4 informations essentielles
- Les termes techniques/jargon à remplacer
- Les sigles à développer

═══ ÉTAPE 2 — SIMPLIFICATION STRICTE ═══
Réécris CHAQUE information selon ces règles IMPÉRATIVES :
- Maximum 8 mots par phrase
- Structure : Sujet + Verbe + Complément
- 1 seule idée par phrase
- 1 seule phrase par ligne
- Utilise "Vous" pour le lecteur
- Mots de 3 syllabes maximum
- Pas de voix passive (jamais "est donné", toujours "vous recevez")
- Pas de jargon (remplace "éligibilité" par "droit", "bénéficiaire" par "personne aidée")
- Développe les sigles : CAF = Caisse d'Allocations Familiales

═══ ÉTAPE 3 — AUTO-VÉRIFICATION ═══
Avant de répondre, vérifie CHAQUE phrase :
✅ Contient-elle 8 mots ou moins ?
✅ Est-elle en voix active ?
✅ Utilise-t-elle des mots simples ?
Si une phrase échoue, réécris-la.

═══ TEXTE À SIMPLIFIER ═══
Titre : "${entity[config.titleField]}"
${sourceText}

═══ FORMAT DE RÉPONSE ═══
RÉPONDS UNIQUEMENT en JSON valide :
{
  "titre_simple": "Titre en 5 mots maximum",
  "summary_falc": "2 phrases très simples. Maximum 8 mots chacune.",
  "points_cles": ["Point simple 1", "Point simple 2", "Point simple 3"],
  "conditions_simples": "Qui peut en profiter. 1-2 phrases simples.",
  "action": "Texte du bouton (3 mots max)"
}`;


        // 5. Call Gemini 2.0 Flash
        logger.info(`[FALC] Generating for ${type}=${entityId} titre="${entity[config.titleField]}"`);
        const responseText = await generateText(prompt);

        // 6. Parse JSON response (handle markdown code fences)
        let falcData;
        try {
            const cleaned = responseText
                .replace(/```json\s*/gi, '')
                .replace(/```\s*/g, '')
                .trim();
            falcData = JSON.parse(cleaned);
        } catch (parseErr) {
            logger.error({ err: parseErr, raw: responseText.slice(0, 500) }, '[FALC] JSON parse failed');
            return res.status(502).json({ error: 'Réponse IA invalide' });
        }

        // 7. Validate required fields
        if (!falcData.summary_falc || !falcData.points_cles) {
            logger.error({ falcData }, '[FALC] Missing required fields in AI response');
            return res.status(502).json({ error: 'Réponse IA incomplète' });
        }

        // 8. Cache in DB (permanent — avoids re-paying Gemini)
        const updateData = { summary_falc: falcData.summary_falc };

        // Entity-specific caching
        if (type === 'aide') {
            if (falcData.conditions_simples) updateData.conditions_falc = falcData.conditions_simples;
            if ('montant_falc' in entity && falcData.montant_falc) updateData.montant_falc = falcData.montant_falc;
        }
        if (type === 'actualite') {
            if (falcData.points_cles) updateData.key_points_falc = falcData.points_cles;
            updateData.falc_status = 'done';
        }

        await db.update(config.model).set(updateData).where(eq(config.model.id, entityId));

        logger.info(`[FALC] Generated and cached for ${type}=${entityId}`);

        return res.status(200).json({
            cached: false,
            type,
            titre_simple: falcData.titre_simple || entity[config.titleField],
            summary_falc: falcData.summary_falc,
            conditions_simples: falcData.conditions_simples || null,
            points_cles: falcData.points_cles,
            action: falcData.action || 'En savoir plus',
        });
    } catch (error) {
        logger.error({ err: error }, `[FALC] Erreur critique (${type})`);

        // Graceful fallback — rules-based simplification
        try {
            const { summarizeFALC } = await import('../../../lib/falc-summarizer.js');
            const entityTableName = type === 'aide' ? 'Aide' : type === 'demarche' ? 'Demarche' : 'Actualite';
            const entity = await db.query[entityTableName].findFirst({ where: (t, { eq }) => eq(t.id, entityId) });
            if (entity) {
                const fallbackSource = config.sourceFields.map(f => entity[f]).filter(Boolean).join(' ');
                const fallbackText = summarizeFALC(fallbackSource, 4);
                return res.status(200).json({
                    cached: false,
                    fallback: true,
                    type,
                    titre_simple: entity[config.titleField],
                    summary_falc: fallbackText,
                    points_cles: [],
                    conditions_simples: null,
                    action: 'En savoir plus',
                });
            }
        } catch {
            // Double fault — return error
        }

        return res.status(500).json({ error: 'Échec de la simplification IA' });
    }
}
