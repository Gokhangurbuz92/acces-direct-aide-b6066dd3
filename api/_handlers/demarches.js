import { PrismaClient } from '@prisma/client';
import { searchDemarchesSchema } from '../_utils/validators.js';
import { searchDemarches } from '../lib/search-query.js';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    try {
        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        // Validate Input
        const validation = searchDemarchesSchema.safeParse(req.query);
        if (!validation.success) {
            return res.status(400).json({ error: 'Invalid parameters', details: validation.error.format() });
        }
        const params = validation.data;

        // 1. Single Item (slugOrId)
        const slugOrId = params.slug || params.id;

        if (slugOrId) {
            const demarche = await prisma.demarche.findFirst({
                where: {
                    OR: [
                        { slug: slugOrId },
                        { id: slugOrId }
                    ]
                },
                include: { category: true, situations: true }
            });

            if (!demarche || demarche.statut !== 'publie') {
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
