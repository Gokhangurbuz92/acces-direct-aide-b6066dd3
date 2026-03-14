import { db } from '../../src/db/index.js';
import * as schema from '../../src/db/schema.js';
import { eq, or, and, sql, desc, asc, ilike } from 'drizzle-orm';
import { verifyAdmin } from '../_utils/auth.js';
import { handleAdminCreate, handleAdminUpdate, handleAdminDelete } from '../_utils/crud.js';
import { logger } from '../lib/logger.js'; // Ensure logger is imported
import { searchActualitesSchema } from '../_utils/validators.js';
import crypto from 'crypto';
import { buildProvenance } from '../_utils/provenance.js';
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
        return [desc(schema.Actualite.date_publication), desc(schema.Actualite.id)];
    }
    if (s === 'date_publication') {
        return [asc(schema.Actualite.date_publication), asc(schema.Actualite.id)];
    }
    if (s === 'updated_date') {
        return [asc(schema.Actualite.updatedAt), asc(schema.Actualite.id)];
    }
    if (s === '-updated_date') {
        return [desc(schema.Actualite.updatedAt), desc(schema.Actualite.id)];
    }
    if (s === 'quality') {
        return [desc(schema.Actualite.quality_score), desc(schema.Actualite.date_publication), desc(schema.Actualite.id)];
    }
    if (s === '-quality') {
        return [asc(schema.Actualite.quality_score), asc(schema.Actualite.id)];
    }
    if (s === 'titre') {
        return [asc(schema.Actualite.titre), asc(schema.Actualite.id)];
    }
    if (s === '-titre') {
        return [desc(schema.Actualite.titre), desc(schema.Actualite.id)];
    }
    // "relevance" fallback: stable recent-first ordering.
    return [desc(schema.Actualite.date_publication), desc(schema.Actualite.id)];
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
        // CRUD operations (Admin only enforced in crud utils)
        const id = queryWithPath.id ? String(queryWithPath.id) : '';
        // Note: CRUD utils will need full migration to drizzle too if not done.
        if (req.method === 'POST') return handleAdminCreate(req, res, db.query.Actualite);
        if (req.method === 'PUT') return handleAdminUpdate(req, res, db.query.Actualite, id);
        if (req.method === 'DELETE') return handleAdminDelete(req, res, db.query.Actualite, id);

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
            const item = await db.query.Actualite.findFirst({
                where: effectiveParams.id ? eq(schema.Actualite.id, effectiveParams.id) : eq(schema.Actualite.slug, effectiveParams.slug),
                with: {
                  sourceDocument: {
                    columns: {
                      fetched_at: true,
                      source_url: true,
                    },
                  },
                },
            });

            if (!item) return res.status(404).json({ error: 'Not found' });
            if (!isAdmin && item.statut !== 'publie') return res.status(404).json({ error: 'Not found' });

            const { sourceDocument, ...safeItem } = item;
            return res.status(200).json({
              ...safeItem,
              provenance: buildProvenance({
                verifiedAt: null,
                fetchedAt: sourceDocument?.fetched_at || safeItem.fetched_at,
                sourceUrl:
                  sourceDocument?.source_url ||
                  safeItem.source_url ||
                  safeItem.canonical_url ||
                  safeItem.lien_url ||
                  safeItem.url,
              }),
            });
        }

        // 2) Listing / search
        const andConditions = [];

        if (effectiveParams.statut) {
            andConditions.push(eq(schema.Actualite.statut, effectiveParams.statut));
        }
        if (effectiveParams.categorie) {
            andConditions.push(eq(schema.Actualite.categorie, effectiveParams.categorie));
        }
        if (effectiveParams.territoire) {
            andConditions.push(eq(schema.Actualite.territoire, effectiveParams.territoire));
        }
        if (effectiveParams.source) {
            const source = `%${effectiveParams.source}%`;
            andConditions.push(or(
                ilike(schema.Actualite.source_name, source),
                ilike(schema.Actualite.source_nom, source),
                ilike(schema.Actualite.source, source)
            ));
        }
        if (effectiveParams.q) {
            const q = `%${effectiveParams.q}%`;
            andConditions.push(or(
                ilike(schema.Actualite.titre, q),
                ilike(schema.Actualite.resume, q),
                ilike(schema.Actualite.contenu, q)
            ));
        }

        const whereCondition = andConditions.length > 0 ? and(...andConditions) : undefined;
        const orderByArr = buildOrderBy(effectiveParams.sort);
        const page = effectiveParams.page || 1;
        const pageSize = effectiveParams.pageSize || 10;
        const skip = (page - 1) * pageSize;

        try {
            const [totalCountResult, items] = await Promise.all([
                db.select({ count: sql`count(*)` }).from(schema.Actualite).where(whereCondition),
                db.query.Actualite.findMany({
                    where: whereCondition,
                    orderBy: orderByArr,
                    offset: skip,
                    limit: pageSize,
                    columns: {
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
                        fetched_at: true,
                    },
                    with: {
                        sourceDocument: {
                          columns: {
                            fetched_at: true,
                            source_url: true,
                          },
                        },
                    },
                }),
            ]);
            const total = Number(totalCountResult[0].count);

            const itemsWithProvenance = items.map((item) => {
              const { sourceDocument, ...safeItem } = item;
              return {
                ...safeItem,
                provenance: buildProvenance({
                  verifiedAt: null,
                  fetchedAt: sourceDocument?.fetched_at || safeItem.fetched_at,
                  sourceUrl:
                    sourceDocument?.source_url ||
                    safeItem.source_url ||
                    safeItem.canonical_url ||
                    safeItem.lien_url ||
                    safeItem.url,
                }),
              };
            });

            return res.status(200).json({
                items: itemsWithProvenance,
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
