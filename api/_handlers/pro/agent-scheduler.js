import logger from '../../_utils/logger.js';
import { db } from '../../../src/db/index.js';
import { createGeminiBreaker } from '../../lib/gemini-circuit-breaker.js';
import { ReviewQueueItem, AuditLog } from '../../../src/db/schema.js';
import { requireProAuth } from '../../_utils/auth.js';
import { recordMetric } from '../../lib/gemini-metrics.js';

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

const AGENT_TIMEOUT_MS = 30_000;

/** @type {import('@google/generative-ai').GoogleGenerativeAI | null} */
let genAI = null;

/** @returns {Promise<import('@google/generative-ai').GoogleGenerativeAI>} */
async function getGenAI() {
    if (genAI) return genAI;
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
    if (!apiKey) return null;
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    genAI = new GoogleGenerativeAI(apiKey);
    return genAI;
}

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    // Feature flag — agents can be disabled without redeployment
    if (process.env.ENABLE_AI_AGENT !== 'true') {
        return res.status(503).json({ error: 'AI agents are disabled', flag: 'ENABLE_AI_AGENT' });
    }

    const { poleId, categoryId } = req.body || {};
    if (!poleId) {
        return res.status(400).json({ error: 'poleId requis.' });
    }

    // Sanitize category input against prompt injection
    const category = String(categoryId || 'toutes catégories').replace(/<[^>]*>/g, '').slice(0, 100);

    try {
        // 1. Real sub-agent discovery via Gemini 2.0 Flash
        let discoveries = [];

        const ai = await getGenAI();
        if (ai) {
            const prompt = `Trouve les 5 dernières nouveautés ou changements concernant les aides sociales en France pour la catégorie "${category}". Pour chaque aide, donne : titre, source officielle, résumé court des critères d'éligibilité, et un score de confiance (0-100). Réponds en JSON : un tableau d'objets avec les clés "title", "source", "summary", "confidence".`;

            const model = ai.getGenerativeModel({
                model: 'gemini-2.0-flash',
                generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
            });

            try {
                const breaker = createGeminiBreaker((p) => model.generateContent(p));
                const startTime = Date.now();
                const result = await breaker.fire(prompt);

                // Check for circuit breaker fallback
                if (result && result.fallback) {
                    logger.warn('[Scheduler] Circuit breaker fallback — skipping Gemini');
                    recordMetric({ type: 'scheduler', model: 'gemini-2.0-flash', latencyMs: Date.now() - startTime, success: false, circuitBreakerOpen: true });
                    discoveries = [];
                } else {
                    const response = await result.response;
                    const raw = response.text() || '[]';
                    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

                    recordMetric({
                        type: 'scheduler',
                        model: 'gemini-2.0-flash',
                        promptTokens: response.usageMetadata?.promptTokenCount || 0,
                        completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
                        totalTokens: response.usageMetadata?.totalTokenCount || 0,
                        latencyMs: Date.now() - startTime,
                        success: true,
                    });

                    try {
                        discoveries = JSON.parse(cleaned);
                    } catch {
                        discoveries = [{ title: 'Résultat brut', source: 'Gemini', summary: cleaned, confidence: 50 }];
                    }
                }
            } catch (geminiErr) {
                logger.warn({ err: geminiErr }, '[Scheduler] Gemini call failed, continuing with empty discoveries');
            }
        }

        // 2. ALL discoveries go to review queue (NO auto-validation)
        // Previously auto-validated at confidence > 95 — removed for safety.
        // A human must always review AI-generated content.
        let submitted = 0;
        for (const item of discoveries) {
            try {
                const entityId = `sched-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                await db.insert(ReviewQueueItem).values({
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
                            confidence: item.confidence || 0,
                            scheduledBy: req.user?.userId || 'system',
                        },
                });
                submitted++;
            } catch {
                // Skip individual failures
            }
        }

        logger.info({ poleId, category, discovered: discoveries.length, submitted }, '[Scheduler] All results queued for human review');

        // 3. Audit trail
        await db.insert(AuditLog).values({
                action: 'AI_HIVE_ENRICHMENT_CYCLE',
                entityId: String(poleId).slice(0, 255),
                entityType: 'CONTENT_FACTORY',
                details: {
                    category,
                    discovered: discoveries.length,
                    autoValidated: 0,  // No more auto-validation
                    pendingReview: discoveries.length,
                    submitted,
                    aiPowered: Boolean(ai),
                },
                ipHash: 'AI_ORCHESTRATOR',
        });

        return res.status(200).json({
            ok: true,
            poleId,
            categoryId: category,
            discovered: discoveries.length,
            autoValidated: 0,
            pendingReview: discoveries.length,
            submitted,
            nextSchedule: 'Prochain cycle automatique',
        });
    } catch (error) {
        logger.error({ err: error }, '[Scheduler] Erreur');
        return res.status(500).json({ error: "Échec de l'orchestration." });
    }
}

export default requireProAuth(handler);

