import logger from '../_utils/logger.js';
import { db } from '../../src/db/index.js';
import { Guide } from '../../src/db/schema.js';
import { eq, desc } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { env } from '../_utils/env.js';

const ALLOWED_ADMIN_ROLES = ['admin', 'superadmin'];

// Helper for Admin Auth
function isAdmin(req) {
    // 1. Dev Exception
    if (env.flags.devLoginEnabled) return true;

    // 2. JWT Check
    const jwtSecret = env.secrets.jwtSecret;
    if (!jwtSecret) return false;

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false;

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, jwtSecret);
        return decoded && ALLOWED_ADMIN_ROLES.includes(decoded.role);
    } catch {
        return false;
    }
}
/**
 * @param {import('../_utils/http-types').ApiRequest} req
 * @param {import('../_utils/http-types').ApiResponse} res
 */

export default async function handler(req, res) {
    const { method } = req;

    // Parse URL for path params (facets or slug)
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = urlObj.pathname;
    const parts = pathname.split('/').filter(p => p);
    const lastPart = parts[parts.length - 1];

    let possibleSlug = null;
    let isFacets = false;

    if (lastPart === 'facets') {
        isFacets = true;
    } else if (lastPart !== 'guides' && lastPart !== 'api') {
        possibleSlug = lastPart;
    }

    // Polyfill req.query for local dev-server (raw node http)
    const query = req.query || Object.fromEntries(urlObj.searchParams);
    const { categorie, public: publicFilter, statut } = query;

    try {
        // --- PUBLIC GET ---
        if (method === 'GET') {
            // 1. FACETS
            if (isFacets) {
                const guides = await db.query.Guide.findMany({
                    where: (t, { eq }) => eq(t.statut, 'publie'),
                    columns: { categorie: true, publics: true, contexte: true },
                });

                const categories = [...new Set(guides.map(g => g.categorie).filter(Boolean))].sort();
                const publics = [...new Set(guides.flatMap(g => g.publics || []))].sort();
                const contexts = [...new Set(guides.flatMap(g => g.contexte || []))].sort();

                res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=300');
                return res.json({ categories, publics, contextes: contexts });
            }

            // 2. DETAIL (SLUG)
            const slugToFind = possibleSlug || query.slug;
            if (slugToFind) {
                const guide = await db.query.Guide.findFirst({
                    where: (t, { eq }) => eq(t.slug, slugToFind),
                });

                if (!guide) return res.status(404).json({ error: "Not found" });
                if (guide.statut !== 'publie' && !isAdmin(req)) {
                    return res.status(403).json({ error: "Access denied" });
                }
                return res.json(guide);
            }

            // 3. LIST
            const viewingAsAdmin = query.admin === 'true' && isAdmin(req);

            /** @type {((t: any, ops: any) => any) | undefined} */
            let whereClause;
            if (!viewingAsAdmin) {
                whereClause = (t, { eq: eqOp, and: andOp }) => {
                    const conditions = [eqOp(t.statut, 'publie')];
                    if (categorie) conditions.push(eqOp(t.categorie, categorie));
                    return conditions.length === 1 ? conditions[0] : andOp(...conditions);
                };
            } else {
                whereClause = (t, { eq: eqOp, and: andOp }) => {
                    const conditions = [];
                    if (statut) conditions.push(eqOp(t.statut, statut));
                    if (categorie) conditions.push(eqOp(t.categorie, categorie));
                    if (conditions.length === 0) return undefined;
                    return conditions.length === 1 ? conditions[0] : andOp(...conditions);
                };
            }

            const guides = await db.query.Guide.findMany({
                where: whereClause,
                orderBy: (t, { desc }) => [desc(t.published_at)],
                limit: 50,
            });

            // Post-filter for array `has` (Drizzle relational API doesn't support it)
            let filtered = guides;
            if (publicFilter) filtered = filtered.filter(g => Array.isArray(g.publics) && g.publics.includes(publicFilter));
            if (query.contexte) filtered = filtered.filter(g => Array.isArray(g.contexte) && g.contexte.includes(query.contexte));

            return res.json(filtered);
        }

        // --- ADMIN WRITE ---
        if (!isAdmin(req)) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (method === 'POST') {
            const data = req.body;
            const finalSlug = data.slug || data.titre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

            const existing = await db.query.Guide.findFirst({
                where: (t, { eq }) => eq(t.slug, finalSlug),
                columns: { id: true },
            });
            if (existing) {
                return res.status(409).json({ error: "Slug already exists" });
            }

            const [guide] = await db.insert(Guide).values({
                ...data,
                slug: finalSlug,
                publics: data.publics || [],
                contexte: data.contexte || [],
                mots_cles: data.mots_cles || [],
                sources_urls: data.sources_urls || [],
                published_at: data.statut === 'publie' ? new Date() : null,
            }).returning();
            return res.json(guide);
        }

        if (method === 'PUT') {
            const { id, ...data } = req.body;
            if (!id) return res.status(400).json({ error: "ID required" });

            const [guide] = await db.update(Guide).set({
                ...data,
                published_at: data.statut === 'publie' ? (data.published_at || new Date()) : null,
            }).where(eq(Guide.id, id)).returning();
            return res.json(guide);
        }

        if (method === 'DELETE') {
            const { id } = query;
            if (!id) return res.status(400).json({ error: "ID required" });
            await db.delete(Guide).where(eq(Guide.id, id));
            return res.json({ success: true });
        }

        res.status(405).json({ error: "Method not allowed" });

    } catch (e) {
        logger.error(e);
        res.status(500).json({ error: e.message });
    }
}
