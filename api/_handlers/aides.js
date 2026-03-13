import { db } from '../../src/db/index.js';
import { Aide } from '../../src/db/schema.js';
import { count, and, eq, ilike, desc } from 'drizzle-orm';
import { checkRateLimit, getClientIp } from '../_utils/rateLimit.js';
import { searchAidesSchema } from '../_utils/validators.js';
import { searchAides } from '../lib/search-query.js';
import { logger } from '../lib/logger.js';
import * as Sentry from '@sentry/node';
import crypto from 'crypto';
import { buildProvenance } from '../_utils/provenance.js';

function extractSlugFromPath(url, host = 'localhost') {
    if (!url) return null;
    try {
        const urlObj = new URL(url, `https://${host}`);
        const pathname = urlObj.pathname || '';
        // Support both `/api/aides/:slug` and `/aides/:slug` (depending on runtime rewrites).
        const match = pathname.match(/^\/(?:api\/)?aides\/([^/?#]+)/);
        if (!match) return null;
        const slug = decodeURIComponent(match[1] || '').trim();
        return slug || null;
    } catch {
        return null;
    }
}

function normalizeCategoryLikeParam(value) {
    if (!value) return value;
    const raw = String(value).trim();
    if (!raw) return undefined;

    // Allow callers to pass category codes (LOGEMENT, SANTE, ...) or slugs (logement, sante, ...).
    if (/^[A-Z_]+$/.test(raw)) return raw.toLowerCase();
    return raw;
}
/**
 * @param {import('../_utils/http-types').ApiRequest} req
 * @param {import('../_utils/http-types').ApiResponse} res
 */

async function handler(req, res) {
    const requestId = crypto.randomUUID();
    const start = Date.now();

    try {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const ip = getClientIp(req);

        // Logger Start
        logger.info('SEARCH_AIDES_START', { requestId, path: req.url, query: req.query, ip });

        const rateLimit = await checkRateLimit('SEARCH_AIDES', ip);
        if (!rateLimit.allowed) {
            logger.warn('SEARCH_AIDES_RATELIMIT', { requestId, ip });
            return res.status(429).json(rateLimit.error);
        }

        // Validate Input
        Sentry.addBreadcrumb({
            category: 'validation',
            message: 'Validating search params',
            level: 'info'
        });

        const rawQuery = req.query || {};
        const slugFromPath = extractSlugFromPath(req.url, req.headers?.host);
        const queryWithPath = { ...rawQuery };
        if (slugFromPath && !queryWithPath.slug && !queryWithPath.id) {
            queryWithPath.slug = slugFromPath;
        }

        const validation = searchAidesSchema.safeParse(queryWithPath);
        if (!validation.success) {
            logger.warn('SEARCH_AIDES_INVALID_PARAMS', { requestId, error: validation.error });
            return res.status(400).json({ error: 'Invalid parameters', details: validation.error.format() });
        }
        const params = validation.data;
        const effectiveParams = { ...params };

        // Query param aliases
        if (effectiveParams.territory && !effectiveParams.territoire) {
            effectiveParams.territoire = effectiveParams.territory;
        }
        if (effectiveParams.limit != null) {
            effectiveParams.pageSize = effectiveParams.limit;
        }
        if (effectiveParams.category) {
            effectiveParams.category = normalizeCategoryLikeParam(effectiveParams.category);
        }
        if (effectiveParams.theme) {
            effectiveParams.theme = normalizeCategoryLikeParam(effectiveParams.theme);
        }

        // Default sort:
        // - With q: relevance
        // - Without q: quality first (then recent)
        if (!effectiveParams.sort) {
            effectiveParams.sort = effectiveParams.q ? 'pertinence' : 'quality';
        }

        // 1. Single Item (Direct access via ID/Slug)
        if (effectiveParams.id || effectiveParams.slug) {
            Sentry.addBreadcrumb({
                category: 'db',
                message: 'Fetching single aide',
                data: { id: effectiveParams.id, slug: effectiveParams.slug },
                level: 'info'
            });

            let aide = await db.query.Aide.findFirst({
                where: (a, { eq }) => effectiveParams.id ? eq(a.id, effectiveParams.id) : eq(a.slug, effectiveParams.slug),
                with: {
                    category: true,
                    situations: {
                        with: {
                            LifeSituation: true
                        }
                    },
                    aidSituations: { with: { situation: true } },
                    sourceDocument: {
                        columns: {
                            fetched_at: true,
                            source_url: true,
                        },
                    },
                }
            });

            if (!aide || aide.statut !== 'publie') {
                return res.status(404).json({ error: "Aide non trouvée" });
            }

            // Flatten Drizzle Many-To-Many representation back to Prisma array
            if (aide.situations) {
                aide.situations = aide.situations.map(s => s.LifeSituation).filter(Boolean);
            }

            const { sourceDocument, ...safeAide } = aide;
            const payload = {
                ...safeAide,
                provenance: buildProvenance({
                    verifiedAt: safeAide.date_verification,
                    fetchedAt: sourceDocument?.fetched_at || safeAide.fetched_at,
                    sourceUrl: sourceDocument?.source_url || safeAide.source_url,
                }),
            };

            logger.info('SEARCH_AIDES_SINGLE_SUCCESS', { requestId, duration_ms: Date.now() - start });
            return res.status(200).json(payload);
        }

        // 2. Search / List (Unified)
        Sentry.addBreadcrumb({
            category: 'db',
            message: 'Executing search query',
            data: effectiveParams,
            level: 'info'
        });

        // Ensure ONLY ONE declaration of items/total
        const { items, total, facets } = await searchAides(prisma, effectiveParams);

        logger.info('SEARCH_AIDES_SUCCESS', {
            requestId,
            duration_ms: Date.now() - start,
            total,
            count: items.length,
            page: effectiveParams.page,
            limit: effectiveParams.pageSize
        });

        Sentry.addBreadcrumb({
            category: 'response',
            message: 'Sending search results',
            level: 'info'
        });

        return res.status(200).json({
            items,
            facets,
            pagination: {
                total,
                page: effectiveParams.page,
                limit: effectiveParams.pageSize,
                pageSize: effectiveParams.pageSize,
                totalPages: Math.ceil(total / effectiveParams.pageSize),
                hasNext: effectiveParams.page * effectiveParams.pageSize < total
            }
        });
    } catch (error) {
        // Attempt fallback: simple Prisma findMany (no raw SQL, no search_vector, no unaccent)
        logger.error('SEARCH_AIDES_ERROR', { requestId, duration_ms: Date.now() - start, error: error.message || error });

        try {
            const fallbackPage = Number(req.query?.page) || 1;
            const fallbackLimit = Math.min(50, Math.max(1, Number(req.query?.limit) || 20));
            const fallbackSkip = (fallbackPage - 1) * fallbackLimit;

            const fallbackWhere = req.query?.q 
              ? and(eq(Aide.statut, 'publie'), ilike(Aide.titre, `%${String(req.query.q)}%`))
              : eq(Aide.statut, 'publie');

            const [fallbackItems, fallbackTotalRes] = await Promise.all([
                db.query.Aide.findMany({
                    where: fallbackWhere,
                    offset: fallbackSkip,
                    limit: fallbackLimit,
                    orderBy: desc(Aide.updatedAt),
                    columns: {
                        id: true,
                        slug: true,
                        titre: true,
                        updatedAt: true,
                        statut: true,
                    },
                }),
                db.select({ value: count() }).from(Aide).where(fallbackWhere),
            ]);
            const fallbackTotal = fallbackTotalRes[0]?.value || 0;

            logger.info('SEARCH_AIDES_FALLBACK_SUCCESS', { requestId, total: fallbackTotal });
            return res.status(200).json({
                items: fallbackItems,
                pagination: {
                    total: fallbackTotal,
                    page: fallbackPage,
                    limit: fallbackLimit,
                    pageSize: fallbackLimit,
                    totalPages: Math.ceil(fallbackTotal / fallbackLimit),
                    hasNext: fallbackPage * fallbackLimit < fallbackTotal,
                },
                _fallback: true,
            });
        } catch (fallbackError) {
            logger.error('SEARCH_AIDES_FALLBACK_ERROR', { requestId, error: fallbackError.message || fallbackError });
            Sentry.captureException(fallbackError, { extra: { requestId, phase: 'fallback' } });

            // Last resort: return empty but valid JSON
            return res.status(200).json({
                items: [],
                pagination: { total: 0, page: 1, limit: 20, pageSize: 20, totalPages: 0, hasNext: false },
                _error: 'database_unavailable',
            });
        }
    }
}

export default handler;
