import logger from '../_utils/logger.js';
import { db } from '../../src/db/index.js';
import { ToolboxItem } from '../../src/db/schema.js';
import { eq, desc } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { env } from '../_utils/env.js';

const ALLOWED_ADMIN_ROLES = ['admin', 'superadmin'];

function isAdmin(req) {
    if (env.runtime.nodeEnv !== 'production' && env.flags.devLoginEnabled) return true;
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
    const jwtSecret = env.secrets.jwtSecret;
    if (!jwtSecret) return false;
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, jwtSecret);
        return decoded && ALLOWED_ADMIN_ROLES.includes(decoded.role);
    } catch { return false; }
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
    } else if (lastPart !== 'tools' && lastPart !== 'api') {
        possibleSlug = lastPart;
    }

    const query = req.query || Object.fromEntries(new URL(req.url, `http://${req.headers.host || 'localhost'}`).searchParams);
    const { categorie, type, public: publicFilter, statut } = query;

    try {
        if (method === 'GET') {
            // 1. FACETS
            if (isFacets) {
                const items = await db.query.ToolboxItem.findMany({
                    where: (t, { eq }) => eq(t.statut, 'publie'),
                    columns: { categorie: true, publics: true, type: true },
                });
                const categories = [...new Set(items.map(i => i.categorie).filter(Boolean))].sort();
                const publics = [...new Set(items.flatMap(i => i.publics || []))].sort();
                const types = [...new Set(items.map(i => i.type).filter(Boolean))].sort();
                res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=300');
                return res.json({ categories, publics, types });
            }

            // 2. DETAIL (SLUG)
            const slugToFind = possibleSlug || req.query.slug;
            if (slugToFind) {
                const item = await db.query.ToolboxItem.findFirst({
                    where: (t, { eq }) => eq(t.slug, slugToFind),
                });
                if (!item) return res.status(404).json({ error: "Not found" });
                if (item.statut !== 'publie' && !isAdmin(req)) return res.status(403).json({ error: "Access denied" });
                return res.json(item);
            }

            // 3. LIST
            const viewingAsAdmin = req.query.admin === 'true' && isAdmin(req);

            /** @type {((t: any, ops: any) => any) | undefined} */
            let whereClause;
            if (!viewingAsAdmin) {
                whereClause = (t, { eq: eqOp, and: andOp }) => {
                    const conditions = [eqOp(t.statut, 'publie')];
                    if (categorie) conditions.push(eqOp(t.categorie, categorie));
                    if (type) conditions.push(eqOp(t.type, type));
                    return conditions.length === 1 ? conditions[0] : andOp(...conditions);
                };
            } else {
                whereClause = (t, { eq: eqOp, and: andOp }) => {
                    const conditions = [];
                    if (statut) conditions.push(eqOp(t.statut, statut));
                    if (categorie) conditions.push(eqOp(t.categorie, categorie));
                    if (type) conditions.push(eqOp(t.type, type));
                    if (conditions.length === 0) return undefined;
                    return conditions.length === 1 ? conditions[0] : andOp(...conditions);
                };
            }

            // Note: Prisma `has` filter for array fields is not directly
            // available in Drizzle relational API. The publicFilter is
            // handled post-query for now.
            const items = await db.query.ToolboxItem.findMany({
                where: whereClause,
                orderBy: (t, { desc }) => [desc(t.published_at)],
                limit: 50,
            });

            const filtered = publicFilter
                ? items.filter(i => Array.isArray(i.publics) && i.publics.includes(publicFilter))
                : items;

            return res.json(filtered);
        }

        if (!isAdmin(req)) return res.status(401).json({ error: "Unauthorized" });

        if (method === 'POST') {
            const data = req.body;
            const finalSlug = data.slug || data.titre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const existing = await db.query.ToolboxItem.findFirst({
                where: (t, { eq }) => eq(t.slug, finalSlug),
                columns: { id: true },
            });
            if (existing) return res.status(409).json({ error: "Slug exists" });

            const [item] = await db.insert(ToolboxItem).values({
                ...data,
                slug: finalSlug,
                publics: data.publics || [],
                published_at: data.statut === 'publie' ? new Date() : null,
            }).returning();
            return res.json(item);
        }

        if (method === 'PUT') {
            const { id, ...data } = req.body;
            if (!id) return res.status(400).json({ error: "ID required" });
            const [item] = await db.update(ToolboxItem).set({
                ...data,
                published_at: data.statut === 'publie' ? (data.published_at || new Date()) : null,
            }).where(eq(ToolboxItem.id, id)).returning();
            return res.json(item);
        }

        if (method === 'DELETE') {
            const { id } = req.query;
            if (!id) return res.status(400).json({ error: "ID required" });
            await db.delete(ToolboxItem).where(eq(ToolboxItem.id, id));
            return res.json({ success: true });
        }

        res.status(405).json({ error: "Method not allowed" });
    } catch (e) {
        logger.error(e);
        res.status(500).json({ error: e.message });
    }
}
