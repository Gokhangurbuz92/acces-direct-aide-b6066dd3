import { PrismaClient, Prisma } from '@prisma/client';
import { getAuthenticatedUser } from './_utils/auth';
import { createSnapshot } from './_utils/snapshot';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    const { id, slug, q, limit, sort, statut, departement } = req.query;

    try {
        // --- READ (GET) ---
        if (req.method === 'GET') {
            const user = await getAuthenticatedUser(req);
            const isAuth = !!user;

            if (id || slug) {
                const where = {};
                if (id) where.id = String(id);
                if (slug) where.slug = String(slug);
                const item = await prisma.structure.findFirst({
                    where,
                    include: {
                        proServices: {
                            where: { is_active: true },
                            select: { slug: true, name: true, description_falc: true, duration_minutes: true, modes: true, audiences: true }
                        }
                    }
                });

                if (!isAuth && item && item.statut !== 'publie') {
                    return res.status(404).json({ error: "Not found" });
                }
                return res.status(200).json(item ? [item] : []);
            }

            if (q) {
                const statutFilter = isAuth ? (statut || null) : 'publie';
                const PAGE_SIZE = limit ? parseInt(limit) : 20;

                // Using nom, description_courte, summary_falc, ville
                const items = await prisma.$queryRaw`
                   SELECT * FROM "Structure"
                   WHERE to_tsvector('french', unaccent(coalesce(nom,'') || ' ' || coalesce(summary_falc,'') || ' ' || coalesce(description_courte,'') || ' ' || coalesce(ville,''))) 
                   @@ plainto_tsquery('french', unaccent(${q}))
                   ${statutFilter ? Prisma.sql`AND "statut" = ${statutFilter}` : Prisma.sql``}
                   ${departement ? Prisma.sql`AND "departement" = ${departement}` : Prisma.sql``}
                   LIMIT ${PAGE_SIZE}
               `;
                return res.status(200).json(items);
            }

            const where = {};
            if (isAuth) {
                if (statut) where.statut = statut;
            } else {
                where.statut = 'publie';
            }
            if (departement) where.departement = departement;

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

            const items = await prisma.structure.findMany(queryOptions);
            return res.status(200).json(items);
        }

        // --- WRITE (POST, PUT, DELETE) ---
        const user = await getAuthenticatedUser(req);
        if (!user) return res.status(401).json({ error: "Unauthorized" });

        if (req.method === 'POST') {
            const data = req.body;
            delete data.id;
            const newStr = await prisma.structure.create({ data });
            return res.status(201).json(newStr);
        }

        if (req.method === 'PUT') {
            if (!id) return res.status(400).json({ error: "Missing ID" });

            // Snapshot before update
            await createSnapshot('Structure', id, user.email);

            const data = req.body;
            const updated = await prisma.structure.update({
                where: { id: String(id) },
                data
            });
            return res.status(200).json(updated);
        }

        if (req.method === 'DELETE') {
            if (!id) return res.status(400).json({ error: "Missing ID" });
            await prisma.structure.delete({ where: { id: String(id) } });
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: "Method not allowed" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to fetch structures' });
    }
}
