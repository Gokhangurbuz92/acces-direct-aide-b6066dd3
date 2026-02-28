// @ts-nocheck
import prisma from '../../_utils/prisma.js';
import { verifyProToken } from '../../lib/pro-auth.js';

/**
 * Dossier AI Synthesis API (Pro-only)
 *
 * POST /api/pro/dossier-synthesis
 *
 * Uses Gemini to analyze a shared diagnostic and extract
 * exactly 3 actionable priority points for the agent.
 * API key stays server-side.
 *
 * Body: { shareId: string }
 */

const GEMINI_ENDPOINT =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const SYSTEM_PROMPT = `Tu es un accompagnateur bienveillant pour une association solidaire. 
Analyse les données d'un diagnostic usager et extrais exactement 3 points clés prioritaires.
Chaque point doit être une phrase courte, factuelle et actionnable pour le bénévole ou l'agent.
Format ta réponse UNIQUEMENT comme un tableau JSON de 3 chaînes de caractères.
Exemple: ["Point 1", "Point 2", "Point 3"]`;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    // Auth: only pro users
    const token = req.cookies?.pro_token;
    if (!token) {
        return res.status(401).json({ error: 'Non autorisé.' });
    }
    const user = verifyProToken(token);
    if (!user) {
        return res.status(401).json({ error: 'Session invalide.' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        return res.status(503).json({ error: 'IA non configurée.' });
    }

    const { shareId } = req.body || {};
    if (!shareId) {
        return res.status(400).json({ error: 'shareId requis.' });
    }

    try {
        // Fetch dossier data
        const shared = await prisma.sharedDiagnostic.findUnique({
            where: { id: shareId },
        });

        if (!shared) {
            return res.status(404).json({ error: 'Dossier introuvable.' });
        }

        // Remove sensitive fields before sending to AI
        const safeData = { ...(shared.results || {}) };
        delete safeData._files;
        delete safeData._consent;

        const userQuery = `Analyse ce dossier anonymisé et donne exactement 3 points clés prioritaires pour l'agent :\n${JSON.stringify(safeData, null, 2)}`;

        const response = await fetch(
            `${GEMINI_ENDPOINT}?key=${encodeURIComponent(apiKey)}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: userQuery }] }],
                    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
                    generationConfig: {
                        temperature: 0.3,
                        maxOutputTokens: 300,
                    },
                }),
            }
        );

        if (!response.ok) {
            const errText = await response.text().catch(() => '');
            console.error('[Synthesis] Gemini error:', response.status, errText.slice(0, 200));
            return res.status(502).json({ error: 'Erreur du service IA.' });
        }

        const result = await response.json();
        const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Parse JSON array from response (may be wrapped in markdown)
        const jsonMatch = rawText.match(/\[[\s\S]*?\]/);
        let points = [];
        if (jsonMatch) {
            try {
                points = JSON.parse(jsonMatch[0]);
            } catch {
                points = [rawText.trim()];
            }
        } else {
            points = [rawText.trim()];
        }

        // Ensure exactly 3 points
        while (points.length < 3) points.push('Données insuffisantes pour ce point.');
        points = points.slice(0, 3);

        return res.status(200).json({ ok: true, points });
    } catch (error) {
        console.error('[Synthesis] Erreur:', error.message);
        return res.status(500).json({ error: 'Échec de la synthèse IA.' });
    }
}
