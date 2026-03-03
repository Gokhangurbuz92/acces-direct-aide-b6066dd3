import logger from '../../_utils/logger.js';
import { randomUUID } from 'crypto';
import { getCronAuth, getHeader } from '../../_utils/cronAuth.js';
import { env } from '../../_utils/env.js';
import prisma from '../../_utils/prisma.js';

/**
 * Hive Scan — Automated AI discovery cron
 *
 * Scans each category via Gemini 2.0 Flash + Google Search grounding
 * and creates ReviewQueueItems for human validation.
 *
 * Endpoint: GET/POST /api/cron/hive-scan
 * Auth: CRON_SECRET (header, bearer, or query param)
 *
 * Uses the same Gemini REST API pattern as agent-discovery.js.
 */

const GEMINI_URL =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const CATEGORIES = ['LOGEMENT', 'SANTE', 'EMPLOI', 'FAMILLE'];

/**
 * @param {string} category
 * @param {string} apiKey
 * @returns {Promise<Array<{title: string, source: string, summary: string}>>}
 */
async function scanCategory(category, apiKey) {
    const prompt = `En tant qu'Agent Chercheur de AccesDirectAide (association solidaire), trouve les 3 dernières nouveautés ou changements concernant les aides sociales en France pour la catégorie "${category}". Pour chaque aide, donne : titre, source officielle, résumé court des critères d'éligibilité. Réponds en JSON : un tableau d'objets avec les clés "title", "source", "summary".`;

    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            tools: [{ google_search: {} }],
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
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API ${response.status}: ${errText.slice(0, 200)}`);
    }

    const result = await response.json();
    const raw = result?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
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

    const apiKey = env.ai?.geminiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
    if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not configured', requestId });
    }

    const startedAt = new Date();
    let totalFound = 0;
    const perCategory = {};

    try {
        for (const category of CATEGORIES) {
            logger.info({ requestId, category }, 'cron.hive_scan.scanning');

            try {
                const findings = await scanCategory(category, apiKey);
                let created = 0;

                for (const item of findings) {
                    try {
                        const entityId = `cron-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                        await prisma.reviewQueueItem.create({
                            data: {
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
                            },
                        });
                        created++;
                    } catch (dbErr) {
                        // Unique constraint violation = duplicate, skip silently
                        if (dbErr?.code !== 'P2002') {
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

        await prisma.cronRun.create({
            data: {
                job: 'HIVE_SCAN',
                status: 'success',
                trigger: vercelCronOk ? 'vercel' : 'manual',
                startedAt,
                finishedAt,
                durationMs,
                requestId,
                vercelEnv: env.runtime.vercelEnv || null,
                metrics: { totalFound, perCategory },
            },
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
            await prisma.cronRun.create({
                data: {
                    job: 'HIVE_SCAN',
                    status: 'failed',
                    trigger: vercelCronOk ? 'vercel' : 'manual',
                    startedAt,
                    finishedAt,
                    durationMs,
                    requestId,
                    vercelEnv: env.runtime.vercelEnv || null,
                    errorSample: String(error.message).slice(0, 500),
                },
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
