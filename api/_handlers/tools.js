
import prisma from '../_utils/prisma.js';
import jwt from 'jsonwebtoken';

const ALLOWED_ADMIN_ROLES = ['admin', 'superadmin'];

function isAdmin(req) {
    if (process.env.NODE_ENV !== 'production' && process.env.VITE_DEV_LOGIN_ENABLED === 'true') return true;
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded && ALLOWED_ADMIN_ROLES.includes(decoded.role);
    } catch (e) { return false; }
}

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
    const { categorie, type, public: publicFilter, id, statut } = query;

    try {
        if (method === 'GET') {
            // 1. FACETS
            if (isFacets) {
                const items = await prisma.toolboxItem.findMany({
                    where: { statut: 'publie' },
                    select: { categorie: true, publics: true, type: true }
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
                const item = await prisma.toolboxItem.findUnique({ where: { slug: slugToFind } });
                if (!item) return res.status(404).json({ error: "Not found" });
                if (item.statut !== 'publie' && !isAdmin(req)) return res.status(403).json({ error: "Access denied" });
                return res.json(item);
            }

            // 3. LIST
            const where = {};
            const viewingAsAdmin = req.query.admin === 'true' && isAdmin(req);

            if (!viewingAsAdmin) where.statut = 'publie';
            else if (statut) where.statut = statut;

            if (categorie) where.categorie = categorie;
            if (type) where.type = type;
            if (publicFilter) where.publics = { has: publicFilter };

            const items = await prisma.toolboxItem.findMany({
                where,
                orderBy: { published_at: 'desc' },
                take: 50
            });
            return res.json(items);
        }

        if (!isAdmin(req)) return res.status(401).json({ error: "Unauthorized" });

        if (method === 'POST') {
            const data = req.body;
            const finalSlug = data.slug || data.titre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            if (await prisma.toolboxItem.findUnique({ where: { slug: finalSlug } })) return res.status(409).json({ error: "Slug exists" });

            const item = await prisma.toolboxItem.create({
                data: {
                    ...data,
                    slug: finalSlug,
                    publics: data.publics || [],
                    published_at: data.statut === 'publie' ? new Date() : null
                }
            });
            return res.json(item);
        }

        if (method === 'PUT') {
            const { id, ...data } = req.body;
            if (!id) return res.status(400).json({ error: "ID required" });
            const item = await prisma.toolboxItem.update({
                where: { id },
                data: {
                    ...data,
                    published_at: data.statut === 'publie' ? (data.published_at || new Date()) : null
                }
            });
            return res.json(item);
        }

        if (method === 'DELETE') {
            const { id } = req.query;
            if (!id) return res.status(400).json({ error: "ID required" });
            await prisma.toolboxItem.delete({ where: { id } });
            return res.json({ success: true });
        }

        res.status(405).json({ error: "Method not allowed" });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
}
