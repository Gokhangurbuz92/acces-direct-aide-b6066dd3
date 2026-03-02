// @ts-nocheck
import prisma from '../../_utils/prisma.js';
import { requireProAuth } from '../../_utils/auth.js';
import logger from '../../_utils/logger.js';

/**
 * Agent Scheduler API (Pro-only)
 *
 * POST /api/pro/agent-scheduler
 * Body: { poleId, categoryId }
 *
 * Orchestrates the 3-tier enrichment cycle by calling the
 * real agent-discovery pipeline (Gemini 2.0 Flash + Google Search).
 *   1. Sub-agents scan via agent-discovery
 *   2. Superior agents analyze & auto-validate high-confidence findings
 *   3. Grand Chef logs audit trail
 */

const GEMINI_URL =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const { poleId, categoryId } = req.body || {};
    if (!poleId) {
        return res.status(400).json({ error: 'poleId requis.' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
    const category = categoryId || 'toutes catégories';

    try {
        // 1. Real sub-agent discovery via Gemini 2.0 Flash
        let discoveries = [];

        if (apiKey) {
            const prompt = `Trouve les 5 dernières nouveautés ou changements concernant les aides sociales en France pour la catégorie "${category}". Pour chaque aide, donne : titre, source officielle, résumé court des critères d'éligibilité, et un score de confiance (0-100). Réponds en JSON : un tableau d'objets avec les clés "title", "source", "summary", "confidence".`;

            const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    tools: [{ google_search: {} }],
                    generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
                }),
            });

            if (response.ok) {
                const result = await response.json();
                const raw = result?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
                const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                try {
                    discoveries = JSON.parse(cleaned);
                } catch {
                    discoveries = [{ title: 'Résultat brut', source: 'Gemini', summary: cleaned, confidence: 50 }];
                }
            }
        }

        // 2. Superior agent analysis — auto-validate if confidence > 95
        const validated = discoveries.filter((d) => (d.confidence || 0) > 95);
        const pending = discoveries.filter((d) => (d.confidence || 0) <= 95);

        // 3. Submit high-confidence findings to review queue
        let submitted = 0;
        for (const item of validated) {
            try {
                const entityId = `sched-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                await prisma.reviewQueueItem.create({
                    data: {
                        entityType: 'AIDE',
                        entityId,
                        title: String(item.title || 'Sans titre').slice(0, 255),
                        reason: 'AI_SCHEDULED_DISCOVERY',
                        severity: 'LOW',
                        status: 'OPEN',
                        details: {
                            source: item.source || 'Gemini Search',
                            summary: item.summary || '',
                            category,
                            confidence: item.confidence,
                            scheduledBy: req.user?.userId || 'system',
                        },
                    },
                });
                submitted++;
            } catch {
                // Skip individual failures
            }
        }

        // 4. Audit trail
        await prisma.auditLog.create({
            data: {
                action: 'AI_HIVE_ENRICHMENT_CYCLE',
                entityId: poleId,
                entityType: 'CONTENT_FACTORY',
                details: JSON.stringify({
                    category,
                    discovered: discoveries.length,
                    autoValidated: validated.length,
                    pendingReview: pending.length,
                    submitted,
                    aiPowered: Boolean(apiKey),
                }),
                ipHash: 'AI_ORCHESTRATOR',
            },
        });

        return res.status(200).json({
            ok: true,
            poleId,
            categoryId: category,
            discovered: discoveries.length,
            autoValidated: validated.length,
            pendingReview: pending.length,
            submitted,
            nextSchedule: 'Prochain cycle automatique',
        });
    } catch (error) {
        logger.error({ err: error }, '[Scheduler] Erreur');
        return res.status(500).json({ error: "Échec de l'orchestration." });
    }
}

export default requireProAuth(handler);
