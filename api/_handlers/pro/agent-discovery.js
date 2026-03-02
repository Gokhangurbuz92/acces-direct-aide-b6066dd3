// @ts-nocheck
import { requireProAuth } from '../../_utils/auth.js';
import prisma from '../../_utils/prisma.js';
import logger from '../../_utils/logger.js';

/**
 * Agent Discovery API (Pro-only)
 *
 * POST /api/pro/agent-discovery
 * Body: { category: "Logement" | "Santé" | ..., submit?: boolean }
 *
 * Uses Gemini 2.0 Flash with Google Search grounding to find
 * new social aid updates for a given category.
 * Returns structured findings for human validation.
 *
 * When `submit: true`, findings are written into ReviewQueueItem
 * for admin validation before publication.
 */

const GEMINI_URL =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const { category, submit } = req.body || {};
    if (!category) {
        return res.status(400).json({ error: 'Catégorie requise.' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
    if (!apiKey) {
        return res.status(500).json({ error: 'Clé API IA non configurée.' });
    }

    const prompt = `Trouve les 5 dernières nouveautés ou changements concernant les aides sociales en France pour la catégorie "${category}". Pour chaque aide, donne : titre, source officielle, résumé court des critères d'éligibilité. Réponds en JSON : un tableau d'objets avec les clés "title", "source", "summary".`;

    try {
        const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                tools: [{ google_search: {} }],
                systemInstruction: {
                    parts: [
                        {
                            text: 'Tu es l\'Agent Chercheur de AccesDirectAide, une association solidaire. Fournis des informations sociales vérifiées et sourcées.',
                        },
                    ],
                },
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 1024,
                },
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            logger.error({ status: response.status, body: errText?.slice(0, 200) }, '[Discovery] Gemini error');
            return res.status(502).json({ error: 'Erreur IA lors du scan.' });
        }

        const result = await response.json();
        const raw = result?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

        // Parse JSON from AI response (strip markdown fences if present)
        const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        let findings = [];
        try {
            findings = JSON.parse(cleaned);
        } catch {
            findings = [{ title: 'Résultat brut', source: 'Gemini', summary: cleaned }];
        }

        // If submit flag is set, create ReviewQueueItems for admin validation
        let submitted = 0;
        if (submit && Array.isArray(findings) && findings.length > 0) {
            for (const item of findings) {
                try {
                    const entityId = `discovery-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                    await prisma.reviewQueueItem.create({
                        data: {
                            entityType: 'AIDE',
                            entityId,
                            title: String(item.title || 'Sans titre').slice(0, 255),
                            reason: 'AI_DISCOVERY',
                            severity: 'LOW',
                            status: 'OPEN',
                            details: {
                                source: item.source || 'Gemini Search',
                                summary: item.summary || '',
                                category,
                                aiGenerated: true,
                                discoveredBy: req.user?.userId || 'system',
                                discoveredAt: new Date().toISOString(),
                            },
                        },
                    });
                    submitted++;
                } catch (dbErr) {
                    logger.warn({ err: dbErr }, '[Discovery] ReviewQueueItem creation failed');
                }
            }
        }

        return res.status(200).json({
            ok: true,
            category,
            findings,
            count: findings.length,
            submitted,
            scannedAt: new Date().toISOString(),
        });
    } catch (error) {
        logger.error({ err: error }, '[Discovery] Erreur');
        return res.status(500).json({ error: 'Échec du scan autonome.' });
    }
}

export default requireProAuth(handler);
