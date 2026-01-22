import { PrismaClient, Prisma } from '@prisma/client';
import { getAuthenticatedUser } from './_utils/auth';
import { createSnapshot } from './_utils/snapshot';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    const { id, slug, q, limit, sort, statut, categorie } = req.query; // Add slug, q

    try {
        if (req.method === 'GET') {
            const user = await getAuthenticatedUser(req);
            const isAuth = !!user;

            // 1. ID or Slug
            if (id || slug) {
                const where = {};
                if (id) where.id = String(id);
                if (slug) where.slug = String(slug);
                const item = await prisma.demarche.findFirst({ where }); // findUnique requires unique, slug is unique. findFirst is safer if mix.

                // Visibility check
                if (!isAuth && item && item.statut !== 'publie') {
                    return res.status(404).json({ error: "Not found" });
                }
                return res.status(200).json(item ? [item] : []);
            }

            // 2. Search
            if (q) {
                const statutFilter = isAuth ? (statut || null) : 'publie';
                const PAGE_SIZE = limit ? parseInt(limit) : 20;

                const items = await prisma.$queryRaw`
                   SELECT * FROM "Demarche"
                   WHERE to_tsvector('french', unaccent(coalesce(titre,'') || ' ' || coalesce(summary_falc,'') || ' ' || coalesce(description_courte,''))) 
                   @@ plainto_tsquery('french', unaccent(${q}))
                   ${statutFilter ? Prisma.sql`AND "statut" = ${statutFilter}` : Prisma.sql``}
                   ${categorie ? Prisma.sql`AND "categorie" = ${categorie}` : Prisma.sql``}
                   LIMIT ${PAGE_SIZE}
               `;
                return res.status(200).json(items);
            }

            // 3. List
            const where = {};
            if (isAuth) {
                if (statut) where.statut = statut;
            } else {
                where.statut = 'publie';
            }
            if (categorie) where.categorie = categorie;

            const queryOptions = {
                where,
                take: limit ? parseInt(limit) : undefined,
            };

            if (sort) {
                const desc = sort.startsWith('-');
                const field = desc ? sort.substring(1) : sort;
                queryOptions.orderBy = {
                    [field]: desc ? 'desc' : 'asc'
                };
            }

            const items = await prisma.demarche.findMany(queryOptions);
            return res.status(200).json(items);
        }

        // --- WRITE ---
        const user = await getAuthenticatedUser(req);
        if (!user) return res.status(401).json({ error: "Unauthorized" });

        if (req.method === 'POST') {
            const data = req.body;
            delete data.id;
            const newItem = await prisma.demarche.create({ data });
            return res.status(201).json(newItem);
        }

        if (req.method === 'PUT') {
            if (!id) return res.status(400).json({ error: "Missing ID" });

            // Snapshot before update
            await createSnapshot('Demarche', id, user.email);

            const data = req.body;
            const updated = await prisma.demarche.update({
                where: { id: String(id) },
                data
            });
            return res.status(200).json(updated);
        }

        if (req.method === 'DELETE') {
            if (!id) return res.status(400).json({ error: "Missing ID" });
            await prisma.demarche.delete({ where: { id: String(id) } });
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: "Method not allowed" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed' });
    }
}
