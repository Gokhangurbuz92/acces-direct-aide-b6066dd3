import prisma from '../_utils/prisma.js';
import { searchDemarchesSchema } from '../_utils/validators.js';
import { searchDemarches } from '../lib/search-query.js';
import { verifyAdmin } from '../_utils/auth.js';
import { logger } from '../lib/logger.js';
import * as Sentry from '@sentry/node';
import crypto from 'crypto';
import { buildProvenance } from '../_utils/provenance.js';

const DEMARCHE_TEST_TITLE_PATTERN = /^(?:d[ée]marche\s+)?test\b/i;

/**
 * @param {string | null | undefined} titre
 * @returns {boolean}
 */
function isTestDemarcheTitle(titre) {
    if (!titre) return false;
    return DEMARCHE_TEST_TITLE_PATTERN.test(String(titre).trim());
}
/**
 * @param {string | null | undefined} url
 * @param {string | null | undefined} host
 * @returns {string | null}
 */
function extractSlugFromPath(url, host = 'localhost') {
    if (!url) return null;
    try {
        const urlObj = new URL(url, `https://${host}`);
        const pathname = urlObj.pathname || '';
        // Support both `/api/demarches/:slug` and `/demarches/:slug` (depending on runtime rewrites).
        const match = pathname.match(/^\/(?:api\/)?demarches\/([^/?#]+)/);
        if (!match) return null;
        const slug = decodeURIComponent(match[1] || '').trim();
        return slug || null;
    } catch {
        return null;
    }
}

/**
 * @param {unknown} value
 * @returns {string | undefined | null}
 */
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
export default async function handler(req, res) {
    const requestId = crypto.randomUUID();
    const start = Date.now();
    const isAdmin = verifyAdmin(req);

    try {
        // CRUD Operations (Admin Only) - Not implemented yet
        if (req.method === 'POST') return res.status(501).json({ error: 'Not implemented' });
        if (req.method === 'PUT') return res.status(501).json({ error: 'Not implemented' });
        if (req.method === 'DELETE') return res.status(501).json({ error: 'Not implemented' });

        if (req.method !== 'GET' && req.method !== 'HEAD') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        // Validate Input
        const rawQuery = req.query || {};
        const slugFromPath = extractSlugFromPath(req.url, req.headers?.host);
        const queryWithPath = { ...rawQuery };
        if (slugFromPath && !queryWithPath.slug && !queryWithPath.id) {
            queryWithPath.slug = slugFromPath;
        }

        const validation = searchDemarchesSchema.safeParse(queryWithPath);
        if (!validation.success) {
            return res.status(400).json({ error: 'Invalid parameters', details: validation.error.format() });
        }
        const params = validation.data;
        const effectiveParams = { ...params };

        // Query param aliases
        if (effectiveParams.limit != null) {
            effectiveParams.pageSize = effectiveParams.limit;
        }
        if (!effectiveParams.category && effectiveParams.theme) {
            effectiveParams.category = effectiveParams.theme;
        }
        if (!effectiveParams.geo && effectiveParams.territoire) {
            effectiveParams.geo = effectiveParams.territoire;
        }
        if (!effectiveParams.geo && effectiveParams.territory) {
            effectiveParams.geo = effectiveParams.territory;
        }
        if (effectiveParams.category) {
            effectiveParams.category = normalizeCategoryLikeParam(effectiveParams.category);
        }

        // Default sort:
        // - With q: relevance
        // - Without q: quality first (then recent)
        if (!effectiveParams.sort) {
            effectiveParams.sort = effectiveParams.q ? 'relevance' : 'quality';
        }

        // Public endpoint: accept published and active items unless admin.
        if (!isAdmin) {
            effectiveParams.statut_in = ['publie', 'actif'];
        }

        // 1. Single Item
        if (effectiveParams.id || effectiveParams.slug) {
            const demarche = await prisma.demarche.findFirst({
                where: effectiveParams.id ? { id: effectiveParams.id } : { slug: effectiveParams.slug },
                include: {
                    category: true,
                    situations: true,
                    sourceDocument: {
                        select: {
                            fetched_at: true,
                            source_url: true,
                        },
                    },
                }
            });

            if (!demarche) return res.status(404).json({ error: "Démarche non trouvée" });
            if (!isAdmin && demarche.statut !== 'publie') {
                return res.status(404).json({ error: "Démarche non trouvée" });
            }
            if (!isAdmin && isTestDemarcheTitle(demarche.titre)) {
                return res.status(404).json({ error: "Démarche non trouvée" });
            }
            const { sourceDocument, ...safeDemarche } = demarche;
            return res.status(200).json({
                ...safeDemarche,
                provenance: buildProvenance({
                    verifiedAt: safeDemarche.date_verification,
                    fetchedAt: sourceDocument?.fetched_at,
                    sourceUrl: sourceDocument?.source_url || safeDemarche.source_url || safeDemarche.source_url_exact,
                }),
            });
        }

        // 2. Search / List
        logger.info('SEARCH_DEMARCHES_START', { requestId, path: req.url, query: rawQuery });
        const { items, total } = await searchDemarches({
            ...effectiveParams,
            hideTestContent: !isAdmin,
        });

        return res.status(200).json({
            items,
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
        logger.error('SEARCH_DEMARCHES_ERROR', { requestId, duration_ms: Date.now() - start, error });
        Sentry.captureException(error, { extra: { requestId, query: req.query } });
        return res.status(500).json({ error: 'Internal server error' });
    }
}
