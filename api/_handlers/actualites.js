import prisma from '../_utils/prisma.js';
import { verifyAdmin } from '../_utils/auth.js';
import { handleAdminCreate, handleAdminUpdate, handleAdminDelete } from '../_utils/crud.js';
import { logger } from '../lib/logger.js'; // Ensure logger is imported
import { searchActualitesSchema } from '../_utils/validators.js';
import crypto from 'crypto';
/**
 * @param {import('../_utils/http-types').ApiRequest} req
 * @param {import('../_utils/http-types').ApiResponse} res
 */

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
        // Support both `/api/actualites/:slug` and `/actualites/:slug` (depending on runtime rewrites).
        const match = pathname.match(/^\/(?:api\/)?actualites\/([^/?#]+)/);
        if (!match) return null;
        const slug = decodeURIComponent(match[1] || '').trim();
        return slug || null;
    } catch {
        return null;
    }
}

/**
 * @param {string | undefined} sort
 * @returns {Array<Record<string, 'asc' | 'desc'>>}
 */
function buildOrderBy(sort) {
    const s = String(sort || '').trim();
    if (!s || s === 'recent' || s === '-recent' || s === '-date_publication') {
        return [{ date_publication: 'desc' }, { id: 'desc' }];
    }
    if (s === 'date_publication') {
        return [{ date_publication: 'asc' }, { id: 'asc' }];
    }
    if (s === 'updated_date') {
        return [{ updatedAt: 'asc' }, { id: 'asc' }];
    }
    if (s === '-updated_date') {
        return [{ updatedAt: 'desc' }, { id: 'desc' }];
    }
    if (s === 'quality') {
        return [{ quality_score: 'desc' }, { date_publication: 'desc' }, { id: 'desc' }];
    }
    if (s === '-quality') {
        return [{ quality_score: 'asc' }, { id: 'asc' }];
    }
    if (s === 'titre') {
        return [{ titre: 'asc' }, { id: 'asc' }];
    }
    if (s === '-titre') {
        return [{ titre: 'desc' }, { id: 'desc' }];
    }
    // "relevance" fallback: stable recent-first ordering.
    return [{ date_publication: 'desc' }, { id: 'desc' }];
}

/**
 * @param {import('../_utils/http-types').ApiRequest} req
 * @param {import('../_utils/http-types').ApiResponse} res
 */
export default async function handler(req, res) {
    const requestId = crypto.randomUUID();
    const isAdmin = verifyAdmin(req);

    try {
        const rawQuery = req.query || {};
        const slugFromPath = extractSlugFromPath(req.url, req.headers?.host);
        const queryWithPath = { ...rawQuery };
        if (slugFromPath && !queryWithPath.slug && !queryWithPath.id) {
            queryWithPath.slug = slugFromPath;
        }

        // CRUD operations (Admin only enforced in crud utils)
        const id = queryWithPath.id ? String(queryWithPath.id) : '';
        if (req.method === 'POST') return handleAdminCreate(req, res, prisma.actualite);
        if (req.method === 'PUT') return handleAdminUpdate(req, res, prisma.actualite, id);
        if (req.method === 'DELETE') return handleAdminDelete(req, res, prisma.actualite, id);

        if (req.method !== 'GET' && req.method !== 'HEAD') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const validation = searchActualitesSchema.safeParse(queryWithPath);
        if (!validation.success) {
            return res.status(400).json({ error: 'Invalid parameters', details: validation.error.format() });
        }

        const params = validation.data;
        const effectiveParams = { ...params };

        // Query param alias
        if (effectiveParams.limit != null) {
            effectiveParams.pageSize = effectiveParams.limit;
        }
        if (!effectiveParams.territoire && effectiveParams.territory) {
            effectiveParams.territoire = effectiveParams.territory;
        }

        // Default sort:
        // - With q: relevance
        // - Without q: recent
        if (!effectiveParams.sort) {
            effectiveParams.sort = effectiveParams.q ? 'relevance' : 'recent';
        }

        // Public endpoint: only published items unless admin.
        if (!isAdmin) {
            effectiveParams.statut = 'publie';
        }

        // 1) Single item (ID or slug)
        if (effectiveParams.id || effectiveParams.slug) {
            const item = await prisma.actualite.findFirst({
                where: effectiveParams.id ? { id: effectiveParams.id } : { slug: effectiveParams.slug },
            });

            if (!item) return res.status(404).json({ error: 'Not found' });
            if (!isAdmin && item.statut !== 'publie') return res.status(404).json({ error: 'Not found' });

            return res.status(200).json(item);
        }

        // 2) Listing / search
        const and = [];

        if (effectiveParams.statut) {
            and.push({ statut: effectiveParams.statut });
        }
        if (effectiveParams.categorie) {
            and.push({ categorie: effectiveParams.categorie });
        }
        if (effectiveParams.territoire) {
            and.push({ territoire: effectiveParams.territoire });
        }
        if (effectiveParams.source) {
            const source = effectiveParams.source;
            and.push({
                OR: [
                    { source_name: { contains: source, mode: 'insensitive' } },
                    { source_nom: { contains: source, mode: 'insensitive' } },
                    { source: { contains: source, mode: 'insensitive' } },
                ],
            });
        }
        if (effectiveParams.q) {
            const q = effectiveParams.q;
            and.push({
                OR: [
                    { titre: { contains: q, mode: 'insensitive' } },
                    { resume: { contains: q, mode: 'insensitive' } },
                    { contenu: { contains: q, mode: 'insensitive' } },
                ],
            });
        }

        const where = and.length ? { AND: and } : {};
        const orderBy = buildOrderBy(effectiveParams.sort);
        const page = effectiveParams.page || 1;
        const pageSize = effectiveParams.pageSize || 10;
        const skip = (page - 1) * pageSize;

        try {
            const [total, items] = await Promise.all([
                prisma.actualite.count({ where }),
                prisma.actualite.findMany({
                    where,
                    orderBy,
                    skip,
                    take: pageSize,
                    select: {
                        id: true,
                        slug: true,
                        titre: true,
                        resume: true,
                        summary_falc: true,
                        date_publication: true,
                        updatedAt: true,
                        type_actu: true,
                        categorie: true,
                        est_important: true,
                        image_url: true,
                        canonical_url: true,
                        lien_url: true,
                        url: true,
                        source_name: true,
                        source_nom: true,
                        source_url: true,
                        quality_score: true,
                    },
                }),
            ]);

            return res.status(200).json({
                items,
                pagination: {
                    total,
                    page,
                    limit: pageSize,
                    pageSize,
                    totalPages: Math.ceil(total / pageSize),
                    hasNext: page * pageSize < total,
                },
            });
        } catch (dbError) {
            logger.error('Actualites DB Error (Recovered):', { requestId, error: dbError });
            return res.status(200).json({
                items: [],
                pagination: {
                    total: 0,
                    page,
                    limit: pageSize,
                    pageSize,
                    totalPages: 0,
                    hasNext: false,
                },
            });
        }

    } catch (error) {
        logger.error('Actualites handler error:', { requestId, error });
        return res.status(500).json({ error: 'Internal server error' });
    }
}
