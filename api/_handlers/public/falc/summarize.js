import prisma from '../../../_utils/prisma.js';
import logger from '../../../_utils/logger.js';
import { generateText } from '../../../lib/gemini.js';

/**
 * FALC Summarize API (Public)
 *
 * POST /api/public/falc/summarize
 * Body: { aideId: string }
 *
 * Generates a FALC (Facile À Lire et à Comprendre) version of an aide
 * using Gemini 2.0 Flash. Caches the result in DB columns for cost optimization.
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const { aideId } = req.body || {};
    if (!aideId) {
        return res.status(400).json({ error: 'aideId requis' });
    }

    try {
        // 1. Fetch the aide
        const aide = await prisma.aide.findUnique({ where: { id: aideId } });
        if (!aide) {
            return res.status(404).json({ error: 'Aide introuvable' });
        }

        // 2. Return cached FALC if available (cost optimization)
        if (aide.summary_falc && aide.conditions_falc) {
            logger.info(`[FALC] Cache hit pour aide=${aideId}`);
            return res.status(200).json({
                cached: true,
                titre_simple: aide.titre,
                summary_falc: aide.summary_falc,
                conditions_simples: aide.conditions_falc,
                montant_falc: aide.montant_falc || null,
                points_cles: aide.metadata?.falc_points_cles || [],
                action: aide.metadata?.falc_action || 'En savoir plus',
            });
        }

        // 3. Build source text for FALC generation
        const sourceText = [
            aide.cest_quoi,
            aide.pour_qui,
            aide.ce_que_ca_aide,
            aide.description,
        ].filter(Boolean).join('\n\n');

        if (!sourceText) {
            return res.status(422).json({ error: 'Aucun contenu à simplifier pour cette aide' });
        }

        // 4. FALC prompt engineering
        const prompt = `Tu es un expert en accessibilité cognitive certifié FALC (Facile À Lire et à Comprendre).

MISSION : Traduis le texte administratif suivant en langage FALC.

RÈGLES STRICTES :
- Phrases très courtes : Sujet + Verbe + Complément
- Un seul message par phrase
- Utilise "Vous" pour t'adresser au lecteur
- Supprime tout jargon administratif
- Développe les sigles (ex: CAF = Caisse d'Allocations Familiales)
- Pas de voix passive
- Mots de 3 syllabes maximum quand possible

TEXTE À SIMPLIFIER :
Titre : "${aide.titre}"
${sourceText}

RÉPONDS UNIQUEMENT en JSON valide avec cette structure exacte :
{
  "titre_simple": "Le titre simplifié de l'aide",
  "summary_falc": "1-2 phrases très simples expliquant l'aide",
  "points_cles": ["Point simple 1", "Point simple 2", "Point simple 3"],
  "conditions_simples": "Qui peut avoir cette aide (1-2 phrases simples)",
  "action": "Texte du bouton d'action (ex: Demander cette aide)"
}`;

        // 5. Call Gemini 2.0 Flash
        logger.info(`[FALC] Generating for aide=${aideId} titre="${aide.titre}"`);
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
        const updateData = {
            summary_falc: falcData.summary_falc,
            conditions_falc: falcData.conditions_simples || null,
        };

        // Handle montant_falc if column exists
        if ('montant_falc' in aide) {
            updateData.montant_falc = falcData.montant_falc || null;
        }

        await prisma.aide.update({
            where: { id: aideId },
            data: updateData,
        });

        logger.info(`[FALC] Generated and cached for aide=${aideId}`);

        return res.status(200).json({
            cached: false,
            titre_simple: falcData.titre_simple || aide.titre,
            summary_falc: falcData.summary_falc,
            conditions_simples: falcData.conditions_simples,
            points_cles: falcData.points_cles,
            action: falcData.action || 'En savoir plus',
        });
    } catch (error) {
        logger.error({ err: error }, '[FALC] Erreur critique');

        // Graceful fallback — return rules-based simplification
        try {
            const { summarizeFALC } = await import('../../../lib/falc-summarizer.js');
            const aide = await prisma.aide.findUnique({ where: { id: aideId } });
            if (aide) {
                const fallbackText = summarizeFALC(aide.cest_quoi || aide.description || '', 4);
                return res.status(200).json({
                    cached: false,
                    fallback: true,
                    titre_simple: aide.titre,
                    summary_falc: fallbackText,
                    points_cles: [],
                    conditions_simples: null,
                    action: 'En savoir plus',
                });
            }
        } catch {
            // Double fault — just return error
        }

        return res.status(500).json({ error: 'Échec de la simplification IA' });
    }
}
