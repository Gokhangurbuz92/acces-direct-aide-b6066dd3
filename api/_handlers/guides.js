
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const ALLOWED_ADMIN_ROLES = ['admin', 'superadmin'];

// Helper for Admin Auth
function isAdmin(req) {
    // 1. Dev Exception
    if (process.env.VITE_DEV_LOGIN_ENABLED === 'true') return true;

    // 2. JWT Check
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false;

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded && ALLOWED_ADMIN_ROLES.includes(decoded.role);
    } catch (e) {
        return false;
    }
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
    } else if (lastPart !== 'guides' && lastPart !== 'api') {
        possibleSlug = lastPart;
    }

    // Polyfill req.query for local dev-server (raw node http)
    const query = req.query || Object.fromEntries(urlObj.searchParams);
    const { categorie, public: publicFilter, id, statut } = query;

    try {
        // --- PUBLIC GET ---
        if (method === 'GET') {
            // 1. FACETS
            if (isFacets) {
                const guides = await prisma.guide.findMany({
                    where: { statut: 'publie' },
                    select: { categorie: true, publics: true, contexte: true }
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
                const guide = await prisma.guide.findUnique({
                    where: { slug: slugToFind },
                });

                if (!guide) return res.status(404).json({ error: "Not found" });
                if (guide.statut !== 'publie' && !isAdmin(req)) {
                    return res.status(403).json({ error: "Access denied" });
                }
                return res.json(guide);
            }

            // 3. LIST
            const where = {};
            const viewingAsAdmin = query.admin === 'true' && isAdmin(req);

            if (!viewingAsAdmin) {
                where.statut = 'publie';
            } else if (statut) {
                where.statut = statut;
            }

            if (categorie) where.categorie = categorie;
            if (publicFilter) where.publics = { has: publicFilter };
            if (query.contexte) where.contexte = { has: query.contexte };

            const guides = await prisma.guide.findMany({
                where,
                orderBy: { published_at: 'desc' },
                take: 50
            });
            return res.json(guides);
        }

        // --- ADMIN WRITE ---
        if (!isAdmin(req)) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (method === 'POST') {
            const data = req.body;
            // Generate Slug if missing
            const finalSlug = data.slug || data.titre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

            if (await prisma.guide.findUnique({ where: { slug: finalSlug } })) {
                return res.status(409).json({ error: "Slug already exists" });
            }

            const guide = await prisma.guide.create({
                data: {
                    ...data,
                    slug: finalSlug,
                    publics: data.publics || [],
                    contexte: data.contexte || [],
                    mots_cles: data.mots_cles || [],
                    sources_urls: data.sources_urls || [],
                    published_at: data.statut === 'publie' ? new Date() : null
                }
            });
            return res.json(guide);
        }

        if (method === 'PUT') {
            const { id, ...data } = req.body;
            if (!id) return res.status(400).json({ error: "ID required" });

            const guide = await prisma.guide.update({
                where: { id },
                data: {
                    ...data,
                    published_at: data.statut === 'publie' ? (data.published_at || new Date()) : null
                }
            });
            return res.json(guide);
        }

        if (method === 'DELETE') {
            const { id } = query;
            if (!id) return res.status(400).json({ error: "ID required" });
            await prisma.guide.delete({ where: { id } });
            return res.json({ success: true });
        }

        res.status(405).json({ error: "Method not allowed" });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
}
