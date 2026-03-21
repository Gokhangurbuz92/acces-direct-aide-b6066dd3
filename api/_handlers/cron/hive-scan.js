import logger from '../../_utils/logger.js';
import { randomUUID } from 'crypto';
import { getCronAuth, getHeader } from '../../_utils/cronAuth.js';
import { env } from '../../_utils/env.js';
import { db } from '../../../src/db/index.js';
import { ReviewQueueItem, CronRun } from '../../../src/db/schema.js';

/**
 * Hive Scan — Automated AI discovery cron
 *
 * Scans each category via Gemini 2.0 Flash + Google Search grounding
 * and creates ReviewQueueItems for human validation.
 *
 * Endpoint: GET/POST /api/cron/hive-scan
 * Auth: CRON_SECRET (header, bearer, or query param)
 *
 * Uses the @google/generative-ai SDK (secure, no API key in URL).
 */

const AGENT_TIMEOUT_MS = 30_000;

/** @type {import('@google/generative-ai').GoogleGenerativeAI | null} */
let genAI = null;

/** @returns {Promise<import('@google/generative-ai').GoogleGenerativeAI>} */
async function getGenAI() {
    if (genAI) return genAI;
    const apiKey = env.ai?.geminiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    genAI = new GoogleGenerativeAI(apiKey);
    return genAI;
}

const CATEGORIES = ['LOGEMENT', 'SANTE', 'EMPLOI', 'FAMILLE'];

/**
 * @param {string} category
 * @returns {Promise<Array<{title: string, source: string, summary: string}>>}
 */
async function scanCategory(category) {
    const prompt = `En tant qu'Agent Chercheur de AccesDirectAide (association solidaire), trouve les 3 dernières nouveautés ou changements concernant les aides sociales en France pour la catégorie "${category}". Pour chaque aide, donne : titre, source officielle, résumé court des critères d'éligibilité. Réponds en JSON : un tableau d'objets avec les clés "title", "source", "summary".`;

    const ai = await getGenAI();
    const model = ai.getGenerativeModel({
        model: 'gemini-2.0-flash',
        systemInstruction: {
            parts: [
                {
                    text: 'Tu es un agent de veille sociale automatisé. Fournis des informations vérifiées et sourcées. Réponds UNIQUEMENT en JSON valide.',
                },
            ],
        },
        generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
        },
    });

    const result = await Promise.race([
        model.generateContent(prompt),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Gemini timeout (30s)')), AGENT_TIMEOUT_MS)
        ),
    ]);

    const response = await result.response;
    const raw = response.text() || '[]';
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
        const parsed = JSON.parse(cleaned);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 */
function isAuthorizedByVercelCronUA(req) {
    if (env.runtime.vercelEnv !== 'production') return false;
    const ua = String(getHeader(req, 'user-agent') || '');
    return ua.startsWith('vercel-cron/');
}

/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */
export default async function handler(req, res) {
    const requestId = typeof req.requestId === 'string' ? req.requestId : randomUUID();

    res.setHeader('x-request-id', requestId);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed', requestId });
    }

    const auth = getCronAuth(req);
    const vercelCronOk = isAuthorizedByVercelCronUA(req);

    if (!auth.ok && auth.reason === 'missing_secret') {
        return res.status(500).json({ error: 'CRON_SECRET is not configured', requestId });
    }

    if (!auth.ok && !vercelCronOk) {
        return res.status(401).json({ error: 'Unauthorized', requestId });
    }

    const startedAt = new Date();
    let totalFound = 0;
    const perCategory = {};

    try {
        for (const category of CATEGORIES) {
            logger.info({ requestId, category }, 'cron.hive_scan.scanning');

            try {
                const findings = await scanCategory(category);
                let created = 0;

                for (const item of findings) {
                    try {
                        const entityId = `cron-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                        await db.insert(ReviewQueueItem).values({
                            entityType: 'AIDE',
                            entityId,
                            title: String(item.title || 'Sans titre').slice(0, 255),
                            reason: 'CRON_HIVE_SCAN',
                            severity: 'LOW',
                            status: 'OPEN',
                            details: {
                                source: item.source || 'Google Search',
                                summary: item.summary || '',
                                category,
                                aiGenerated: true,
                                discoveredAt: new Date().toISOString(),
                            },
                        });
                        created++;
                    } catch (dbErr) {
                        // Unique constraint violation = duplicate, skip silently
                        // PostgreSQL native code 23505 (was Prisma P2002)
                        const pgCode = dbErr?.cause?.code || dbErr?.code;
                        if (pgCode !== '23505') {
                            logger.error({ requestId, category, error: dbErr.message }, 'cron.hive_scan.db_error');
                        }
                    }
                }

                perCategory[category] = { scanned: findings.length, created };
                totalFound += created;
            } catch (catErr) {
                logger.error({ requestId, category, error: catErr.message }, 'cron.hive_scan.category_error');
                perCategory[category] = { scanned: 0, created: 0, error: catErr.message };
            }
        }

        const finishedAt = new Date();
        const durationMs = finishedAt.getTime() - startedAt.getTime();

        await db.insert(CronRun).values({
            job: 'HIVE_SCAN',
            status: 'success',
            trigger: vercelCronOk ? 'vercel' : 'manual',
            startedAt,
            finishedAt,
            durationMs,
            requestId,
            vercelEnv: env.runtime.vercelEnv || null,
            metrics: { totalFound, perCategory },
        });

        return res.status(200).json({
            ok: true,
            requestId,
            totalFound,
            perCategory,
            durationMs,
        });
    } catch (error) {
        const finishedAt = new Date();
        const durationMs = finishedAt.getTime() - startedAt.getTime();

        logger.error({ requestId, error: error.message }, 'cron.hive_scan.fatal');

        try {
            await db.insert(CronRun).values({
                job: 'HIVE_SCAN',
                status: 'failed',
                trigger: vercelCronOk ? 'vercel' : 'manual',
                startedAt,
                finishedAt,
                durationMs,
                requestId,
                vercelEnv: env.runtime.vercelEnv || null,
                errorSample: String(error.message).slice(0, 500),
            });
        } catch {
            // If even the error logging fails, we still return gracefully
        }

        return res.status(500).json({
            ok: false,
            requestId,
            error: 'Hive scan failed',
        });
    }
}
