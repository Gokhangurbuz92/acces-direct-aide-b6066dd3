import prisma from '../_utils/prisma.js';
import { checkRateLimit, getClientIp } from '../_utils/rateLimit.js';
import { searchStructuresSchema } from '../_utils/validators.js';
import { searchStructures } from '../lib/search-query.js';
import { buildProvenance } from '../_utils/provenance.js';

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
        // Support both `/api/structures/:slug` and `/structures/:slug` (depending on runtime rewrites).
        const match = pathname.match(/^\/(?:api\/)?structures\/([^/?#]+)/);
        if (!match) return null;
        const slug = decodeURIComponent(match[1] || '').trim();
        return slug || null;
    } catch {
        return null;
    }
}
/**
 * @param {import('../_utils/http-types').ApiRequest} req
 * @param {import('../_utils/http-types').ApiResponse} res
 */

async function handler(req, res) {
    try {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const ip = getClientIp(req);
        const rateLimit = await checkRateLimit('SEARCH_STRUCTURES', ip);
        if (!rateLimit.allowed) {
            return res.status(429).json(rateLimit.error);
        }

        // Validate Input
        const rawQuery = req.query || {};
        const slugFromPath = extractSlugFromPath(req.url, req.headers?.host);
        const queryWithPath = { ...rawQuery };
        if (slugFromPath && !queryWithPath.slug && !queryWithPath.id) {
            queryWithPath.slug = slugFromPath;
        }

        const validation = searchStructuresSchema.safeParse(queryWithPath);
        if (!validation.success) {
            return res.status(400).json({ error: 'Invalid parameters', details: validation.error.format() });
        }
        const params = validation.data;
        const effectiveParams = { ...params };

        // Query param aliases
        if (effectiveParams.limit != null) {
            effectiveParams.pageSize = effectiveParams.limit;
        }
        if (!effectiveParams.departement && effectiveParams.territory) {
            effectiveParams.departement = effectiveParams.territory;
        }
        if (!effectiveParams.departement && effectiveParams.geo) {
            effectiveParams.departement = effectiveParams.geo;
        }

        // Default sort:
        // - With q: relevance
        // - Without q: quality first (then recent)
        if (!effectiveParams.sort) {
            effectiveParams.sort = effectiveParams.q ? 'relevance' : 'quality';
        }

        // 1. Single Item (ID or Slug)
        if (effectiveParams.id || effectiveParams.slug) {
            const structure = await prisma.structure.findFirst({
                where: effectiveParams.id ? { id: effectiveParams.id } : { slug: effectiveParams.slug },
                include: {
                  proServices: true,
                  sourceDocument: {
                    select: {
                      fetched_at: true,
                      source_url: true,
                    },
                  },
                }
            });

            if (!structure || structure.statut !== 'actif') {
                return res.status(404).json({ error: "Structure non trouvée" });
            }
            const { sourceDocument, ...safeStructure } = structure;
            return res.status(200).json({
              ...safeStructure,
              provenance: buildProvenance({
                verifiedAt: safeStructure.date_verification,
                fetchedAt: sourceDocument?.fetched_at,
                sourceUrl: sourceDocument?.source_url || safeStructure.source_url || safeStructure.source_url_exact,
              }),
            });
        }

        // 2. Search / List
        const { items, total } = await searchStructures(prisma, effectiveParams);

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
        console.error('Structures handler error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export default handler;
