import logger from '../../../_utils/logger.js';
import { requireProAuth, requireProStructureContext } from '../../../_utils/auth.js';

/**
 * AI Assist pour SecureChat (Pro-only)
 *
 * POST /api/pro/ai/assist
 *
 * Reçoit les messages en clair (après déchiffrement E2EE côté client et consentement)
 * et les transmet à Gemini pour analyse. Le serveur ne conserve PAS ces messages.
 *
 * Body: { messages: array, action: "summarize" | "detect-urgency" | "suggest-reply" }
 */

const GEMINI_ENDPOINT =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const PROMPTS = {
    'summarize': `Tu es un assistant pour travailleur social. 
Analyse cet historique de conversation et réalise un résumé psychologique et social concis en 3 à 5 points à puces.
Garde un ton professionnel, neutre et bienveillant.`,

    'detect-urgency': `Tu es une IA spécialisée dans la détection des vulnérabilités sociales et psychologiques.
Lis cette conversation et évalue si la situation présente un risque immédiat (violences, risque suicidaire, perte imminente de logement, précarité vitale).
Réponds uniquement au format JSON : { "isUrgent": boolean, "reasons": ["raison 1", "raison 2"], "recommendedAction": "Action à prendre" }.`,

    'suggest-reply': `Tu es un travailleur social empathique. 
En te basant sur cette dernière conversation, rédige 2 propositions de réponse courte pour l'usager.
La réponse doit être chaleureuse, déculpabilisante et claire.
Format JSON uniquement: { "suggestions": ["Reponse 1", "Reponse 2"] }`
};

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const proCtx = requireProStructureContext(req, res);
    if (!proCtx) return;

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        return res.status(503).json({ error: 'IA non configurée.' });
    }

    const { messages, action } = req.body || {};
    if (!messages || !Array.isArray(messages) || !action || !PROMPTS[action]) {
        return res.status(400).json({ error: 'Payload invalide ou action inconnue.' });
    }

    // Limitation de sécurité: éviter l'envoi de payloads massifs
    if (messages.length > 50) {
        messages.splice(0, messages.length - 50); // Garder les 50 derniers
    }

    try {
        const conversationText = messages.map(m => `[${m.role === 'pro' ? 'Travailleur Social' : 'Usager'}]: ${m.body}`).join('\n');
        const userQuery = `Voici la conversation entre le travailleur social et l'usager :\n\n${conversationText}`;

        const response = await fetch(
            `${GEMINI_ENDPOINT}?key=${encodeURIComponent(apiKey)}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: userQuery }] }],
                    systemInstruction: { parts: [{ text: PROMPTS[action] }] },
                    generationConfig: {
                        temperature: action === 'suggest-reply' ? 0.7 : 0.2, // Plus créatif pour les suggestions
                        maxOutputTokens: 800,
                    },
                }),
            }
        );

        if (!response.ok) {
            const errText = await response.text().catch(() => '');
            logger.error({ status: response.status, body: errText.slice(0, 200) }, '[AI Assist] Gemini error');
            return res.status(502).json({ error: 'Erreur du service IA.' });
        }

        const result = await response.json();
        const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';

        let finalData = rawText;

        // Parse JSON if the action expects it
        if (action === 'detect-urgency' || action === 'suggest-reply') {
            const jsonMatch = rawText.match(/\\{[\s\S]*?\\}/);
            if (jsonMatch) {
                try {
                    finalData = JSON.parse(jsonMatch[0]);
                } catch {
                    // Fallback
                    logger.warn('[AI Assist] JSON Parse failed from Gemini');
                }
            }
        }

        return res.status(200).json({ ok: true, result: finalData });
    } catch (error) {
        logger.error({ err: error }, '[AI Assist] Erreur');
        return res.status(500).json({ error: 'Échec de l\'analyse IA.' });
    }
}

export default requireProAuth(handler);
