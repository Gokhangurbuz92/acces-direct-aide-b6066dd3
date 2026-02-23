import { randomUUID } from 'crypto';
import * as Sentry from '@sentry/node';

import logger from '../../_utils/logger.js';
import prisma from '../../_utils/prisma.js';
import { checkRateLimit, getClientIp, getRateLimitStatus } from '../../_utils/rateLimit.js';
import { generateEmbedding } from '../../lib/gemini-embedding.js';
import { searchAidesHybrid } from '../../lib/hybrid-search.js';
import { searchDemarches, searchStructures } from '../../lib/search-query.js';

// --- Constants ---
const VALID_TYPES = ['aide', 'demarche', 'structure'];
const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 20;
const MAX_NEED_LENGTH = 200;

// --- Normalizers ---

/**
 * @param {unknown} body
 * @returns {Record<string, unknown>}
 */
function parseBody(body) {
    if (!body) return {};
    if (typeof body === 'string') {
        try { return JSON.parse(body); } catch { return {}; }
    }
    if (typeof body === 'object') return /** @type {Record<string, unknown>} */ (body);
    return {};
}

/**
 * Normalize an aide item into the unified recommendation schema.
 * @param {Record<string, unknown>} item
 * @returns {Record<string, unknown>}
 */
function normalizeAide(item) {
    const slug = item.slug || null;
    return {
        type: 'aide',
        slug,
        title: item.title || item.titre || null,
        excerpt: item.description || item.cest_quoi || item.summary_falc || null,
        url: slug ? `/aides/${slug}` : null,
        sourceLabel: item.source_name || item.source_org || item.providerName || null,
        sourceUrl: item.provenance?.sourceUrl || item.source_url || null,
        verifiedAt: item.provenance?.verifiedAt || item.date_verification || null,
    };
}

/**
 * Normalize a demarche item into the unified recommendation schema.
 * @param {Record<string, unknown>} item
 * @returns {Record<string, unknown>}
 */
function normalizeDemarche(item) {
    const slug = item.slug || null;
    return {
        type: 'demarche',
        slug,
        title: item.titre || null,
        excerpt: item.description_courte || item.summary_falc || null,
        url: slug ? `/demarches/${slug}` : null,
        sourceLabel: null,
        sourceUrl: item.provenance?.sourceUrl || item.source_url || item.source_url_exact || null,
        verifiedAt: item.provenance?.verifiedAt || item.date_verification || null,
    };
}

/**
 * Normalize a structure item into the unified recommendation schema.
 * @param {Record<string, unknown>} item
 * @returns {Record<string, unknown>}
 */
function normalizeStructure(item) {
    const slug = item.slug || null;
    return {
        type: 'structure',
        slug,
        title: item.nom || null,
        excerpt: item.description_courte || null,
        url: slug ? `/annuaire/${slug}` : null,
        sourceLabel: null,
        sourceUrl: item.provenance?.sourceUrl || item.source_url || item.source_url_exact || null,
        verifiedAt: item.provenance?.verifiedAt || item.date_verification || null,
    };
}

/**
 * POST /api/assistant/recommendations
 *
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */
export default async function handler(req, res) {
    const requestId = req.requestId || randomUUID();
    const log = logger.child({ handler: 'assistant-recommendations', requestId });

    // --- Method gate ---
    if (req.method !== 'POST') {
        return res.status(405).json({ ok: false, requestId, error: 'method_not_allowed' });
    }

    // --- Rate limit ---
    const ip = getClientIp(req);
    const limit = await checkRateLimit('ASSISTANT_RECOS', ip);
    if (!limit.allowed) {
        return res.status(getRateLimitStatus(limit)).json({
            ...(limit.error || { error: 'rate_limited' }),
            requestId,
        });
    }

    // --- Parse & validate input ---
    const payload = parseBody(req.body);
    const { need, territory, limit: rawLimit, types: rawTypes } = payload;

    if (typeof need !== 'string' || need.trim().length === 0) {
        return res.status(400).json({
            ok: false,
            requestId,
            error: 'invalid_need',
            message: 'Le champ "need" est requis (1-200 caractères).',
        });
    }

    const trimmedNeed = need.trim();
    if (trimmedNeed.length > MAX_NEED_LENGTH) {
        return res.status(400).json({
            ok: false,
            requestId,
            error: 'need_too_long',
            message: `Le champ "need" ne peut pas dépasser ${MAX_NEED_LENGTH} caractères.`,
        });
    }

    const resultLimit = Math.min(
        Math.max(1, typeof rawLimit === 'number' ? rawLimit : DEFAULT_LIMIT),
        MAX_LIMIT,
    );

    // Validate types
    let requestedTypes = VALID_TYPES;
    if (Array.isArray(rawTypes) && rawTypes.length > 0) {
        const filtered = rawTypes.filter((t) => typeof t === 'string' && VALID_TYPES.includes(t));
        if (filtered.length === 0) {
            return res.status(400).json({
                ok: false,
                requestId,
                error: 'invalid_types',
                message: `Les types valides sont : ${VALID_TYPES.join(', ')}.`,
            });
        }
        requestedTypes = filtered;
    }

    const territoryStr = typeof territory === 'string' ? territory.trim() || undefined : undefined;

    // --- Execute searches in parallel ---
    try {
        /** @type {Array<Record<string, unknown>>} */
        const allItems = [];

        // Calculate per-type limit (distribute evenly, minimum 2 per type)
        const perTypeLimit = Math.max(2, Math.ceil(resultLimit / requestedTypes.length));

        const searchPromises = [];

        // --- Aides: embedding + lexical hybrid ---
        if (requestedTypes.includes('aide')) {
            searchPromises.push(
                (async () => {
                    let embedding = null;
                    try {
                        embedding = await generateEmbedding(trimmedNeed);
                    } catch (embErr) {
                        log.warn({ msg: 'recos.embedding_failed', error: embErr instanceof Error ? embErr.message : String(embErr) });
                    }

                    const { items } = await searchAidesHybrid(prisma, {
                        query: trimmedNeed,
                        limit: perTypeLimit,
                        embedding,
                    });

                    return items.map(normalizeAide);
                })(),
            );
        }

        // --- Demarches: lexical ---
        if (requestedTypes.includes('demarche')) {
            searchPromises.push(
                (async () => {
                    const { items } = await searchDemarches(prisma, {
                        q: trimmedNeed,
                        territoire: territoryStr,
                        pageSize: perTypeLimit,
                        page: 1,
                        sort: 'relevance',
                        statut: 'publie',
                        hideTestContent: true,
                    });

                    return items.map(normalizeDemarche);
                })(),
            );
        }

        // --- Structures: lexical ---
        if (requestedTypes.includes('structure')) {
            searchPromises.push(
                (async () => {
                    const { items } = await searchStructures(prisma, {
                        q: trimmedNeed,
                        departement: territoryStr,
                        pageSize: perTypeLimit,
                        page: 1,
                        sort: 'relevance',
                    });

                    return items.map(normalizeStructure);
                })(),
            );
        }

        // Await all searches in parallel
        const results = await Promise.allSettled(searchPromises);

        for (const result of results) {
            if (result.status === 'fulfilled') {
                allItems.push(...result.value);
            } else {
                log.warn({ msg: 'recos.search_partial_failure', error: result.reason?.message || String(result.reason) });
            }
        }

        // Trim to requested limit
        const finalItems = allItems.slice(0, resultLimit);

        log.info({ msg: 'recos.success', requestId, count: finalItems.length, types: requestedTypes });

        return res.status(200).json({
            items: finalItems,
            meta: {
                from: 'search',
                method: 'embedding+lexical',
                requestId,
            },
        });
    } catch (error) {
        const errorName = error instanceof Error ? error.name : 'unknown';
        log.error({ msg: 'recos.failed', errorName, requestId });

        Sentry.captureException(error, {
            tags: { route: 'assistant/recommendations', requestId },
        });

        return res.status(500).json({
            ok: false,
            requestId,
            error: 'internal',
            message: 'Une erreur interne est survenue.',
        });
    }
}
