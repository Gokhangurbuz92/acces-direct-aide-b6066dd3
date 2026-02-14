import prisma from '../_utils/prisma.js';
import { searchDemarchesSchema } from '../_utils/validators.js';
import { searchDemarches } from '../lib/search-query.js';
import { verifyAdmin } from '../_utils/auth.js';
/**
 * @param {import('../_utils/http-types').ApiRequest} req
 * @param {import('../_utils/http-types').ApiResponse} res
 */

export default async function handler(req, res) {
    const isAdmin = verifyAdmin(req);

    try {
        // CRUD Operations (Admin Only) - Not implemented yet
        if (req.method === 'POST') return res.status(501).json({ error: 'Not implemented' });
        if (req.method === 'PUT') return res.status(501).json({ error: 'Not implemented' });
        if (req.method === 'DELETE') return res.status(501).json({ error: 'Not implemented' });

        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        // Validate Input
        const validation = searchDemarchesSchema.safeParse(req.query);
        if (!validation.success) {
            return res.status(400).json({ error: 'Invalid parameters', details: validation.error.format() });
        }
        const params = validation.data;

        // 1. Single Item
        if (params.id || params.slug) {
            const demarche = await prisma.demarche.findFirst({
                where: params.id ? { id: params.id } : { slug: params.slug },
                include: { category: true, situations: true }
            });

            if (!demarche) return res.status(404).json({ error: "Démarche non trouvée" });
            if (!isAdmin && demarche.statut !== 'publie') {
                return res.status(404).json({ error: "Démarche non trouvée" });
            }
            return res.status(200).json(demarche);
        }

        // 2. Search / List
        const { items, total } = await searchDemarches(prisma, params);

        return res.status(200).json({
            items,
            pagination: {
                total,
                page: params.page,
                pageSize: params.pageSize,
                totalPages: Math.ceil(total / params.pageSize)
            }
        });

    } catch (error) {
        console.error('Demarches API Error:', error);
        return res.status(500).json({ error: 'Server Error', details: error.message });
    }
}
