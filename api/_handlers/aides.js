import { PrismaClient, Prisma } from '@prisma/client';
import { getAuthenticatedUser } from './_utils/auth';
import { createSnapshot } from './_utils/snapshot';

const prisma = new PrismaClient();

export const config = {
    api: {
        bodyParser: true,
    },
};

const originalHandler = async (req, res) => {
    const { id, slug, q, categorie, limit, sort, statut, page = 1 } = req.query;
    const PAGE_SIZE = limit ? parseInt(limit) : 20;
    const OFFSET = (parseInt(page) - 1) * PAGE_SIZE;

    try {
        // --- READ (GET) ---
        if (req.method === 'GET') {
            const user = await getAuthenticatedUser(req);
            const isAuth = !!user;

            // 1. Fetch by ID or Slug
            if (id || slug) {
                const where = {};
                if (id) where.id = String(id);
                if (slug) where.slug = String(slug); // Prisma unique check

                const aide = await prisma.aide.findFirst({ where });

                if (!isAuth && aide && aide.statut !== 'publie') {
                    return res.status(404).json({ error: "Not found" });
                }
                return res.status(200).json(aide ? [aide] : []);
            }

            // 2. Full Text Search & List
            // If 'q' is present, use raw query for FTS. Postgres optimization.
            if (q) {
                // Determine statut filter
                const statutFilter = isAuth ? (statut || null) : 'publie';

                // Construct SQL
                // Prevent SQL injection by using Prisma parameters (tagged template)
                // But dynamic WHERE clauses are tricky with raw.
                // We will use a safe approach: simple string matching if FTS is complex setup, 
                // OR prisma raw with logic.
                // Let's use `search` in findMany first if we haven't set up full indices yet? 
                // Use PG `search` preview feature? Or just raw.
                // Plan specified GIN indices. Backfill likely hasn't created indices yet (no raw sql migration run yet except schema push).
                // The "lot3_search_seo" migration just added columns. It didn't add indices?
                // Ah, Prisma schema doesn't support generic GIN yet fully without raw SQL or preview features.
                // For now, let's stick to `contains` for simple search or use `search` if Preview is on.
                // The user prompt asked for FTS.
                // Let's implement FTS using $queryRaw.

                const searchQuery = q.split(" ").join(" & "); // Simple parser for now

                // Status clause
                let statusClause = '';
                if (statutFilter) {
                    statusClause = `AND "statut" = '${statutFilter}'`;
                }

                // Categorie clause
                let catClause = '';
                if (categorie) {
                    catClause = `AND "categorie" = '${categorie}'`; // Potential SQLI if not sanitized? 
                    // Use param for queryRaw
                }

                // Raw Query (Safe params later)
                // Using plainto_tsquery for simple input handling.
                // Coalesce title, summary_falc, description for vector.
                const aides = await prisma.$queryRaw`
                   SELECT * FROM "Aide"
                   WHERE to_tsvector('french', unaccent(coalesce(titre,'') || ' ' || coalesce(summary_falc,'') || ' ' || coalesce(cest_quoi,''))) 
                   @@ plainto_tsquery('french', unaccent(${q}))
                   ${statutFilter ? Prisma.sql`AND "statut" = ${statutFilter}` : Prisma.sql``}
                   ${categorie ? Prisma.sql`AND "categorie" = ${categorie}` : Prisma.sql``}
                   LIMIT ${PAGE_SIZE} OFFSET ${OFFSET}
               `;
                // Note: `unaccent` extension needs to be enabled. 
                // If not, standard vector.

                return res.status(200).json(aides);
            }

            // 3. Standard List (No search)
            const where = {};
            if (categorie) where.categorie = categorie;

            if (isAuth) {
                if (statut) where.statut = statut;
            } else {
                where.statut = 'publie';
            }

            const queryOptions = {
                where,
                take: PAGE_SIZE,
                skip: OFFSET,
            };

            if (sort) {
                const desc = sort.startsWith('-');
                const field = desc ? sort.substring(1) : sort;
                queryOptions.orderBy = {
                    [field]: desc ? 'desc' : 'asc'
                };
            }

            const aides = await prisma.aide.findMany(queryOptions);
            return res.status(200).json(aides);
        }

        // --- WRITE (Protected) ---
        const user = await getAuthenticatedUser(req);
        if (!user) return res.status(401).json({ error: "Unauthorized" });

        if (req.method === 'POST') {
            const data = req.body;
            delete data.id;
            if (data.statut === 'publie' && !data.published_at) {
                data.published_at = new Date();
            }
            const newAide = await prisma.aide.create({ data });
            return res.status(201).json(newAide);
        }

        if (req.method === 'PUT') {
            if (!id) return res.status(400).json({ error: "Missing ID" });

            // Create snapshot before update
            await createSnapshot('Aide', id, user.email);

            const data = req.body;
            if (data.statut === 'publie') {
                if (!data.published_at) data.published_at = new Date();
            }
            const updated = await prisma.aide.update({
                where: { id: String(id) },
                data
            });
            return res.status(200).json(updated);
        }

        if (req.method === 'DELETE') {
            if (!id) return res.status(400).json({ error: "Missing ID" });
            await prisma.aide.delete({ where: { id: String(id) } });
            return res.status(200).json({ success: true });
        }
    } catch (e) {
        console.error("API Error", e);
        // Fallback for missing raw query extensions?
        return res.status(500).json({ error: 'Server Error', details: e.message });
    }

    return res.status(405).json({ error: "Method not allowed" });
};

export default originalHandler;
