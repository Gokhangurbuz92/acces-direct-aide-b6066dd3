import prisma from '../../_utils/prisma.js';
import { verifyAdmin } from '../../_utils/auth.js';

/**
 * Admin endpoint to view link check results
 * GET /api/admin/link-checks?is_broken=true
 */
export default async function handler(req, res) {
    if (!verifyAdmin(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const isBroken = req.query.is_broken === 'true';
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : 100;

        const where = {};
        
        if (isBroken) {
            where.OR = [
                { http_status: { gte: 400 } },
                { http_status: 0 } // Network errors
            ];
        }

        const results = await prisma.sourceSnapshot.findMany({
            where,
            orderBy: { fetched_at: 'desc' },
            take: limit
        });

        // Group by entity for better readability
        const grouped = results.reduce((acc, item) => {
            const key = `${item.entity_type}:${item.entity_id}`;
            if (!acc[key]) {
                acc[key] = {
                    entity_type: item.entity_type,
                    entity_id: item.entity_id,
                    checks: []
                };
            }
            acc[key].checks.push({
                fetched_at: item.fetched_at,
                http_status: item.http_status,
                final_url: item.final_url
            });
            return acc;
        }, {});

        return res.status(200).json({
            total: results.length,
            items: Object.values(grouped)
        });

    } catch (error) {
        console.error('Link checks admin error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
