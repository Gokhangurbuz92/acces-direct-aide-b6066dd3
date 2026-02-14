
import prisma from '../../_utils/prisma.js';
/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const [guidesCount, toolsCount, structuresCount, rdvCount] = await Promise.all([
            prisma.guide.count({ where: { statut: 'publie' } }),
            prisma.toolboxItem.count({ where: { statut: 'publie' } }),
            prisma.structure.count({ where: { status: 'actif' } }),
            prisma.appointment.count()
        ]);

        // Cache for 1 hour
        res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=59');

        return res.json({
            guides: guidesCount,
            tools: toolsCount,
            structures: structuresCount,
            appointments: rdvCount
        });
    } catch (e) {
        console.error("Error fetching stats", e);
        return res.status(500).json({ error: "Internal error" });
    }
}
