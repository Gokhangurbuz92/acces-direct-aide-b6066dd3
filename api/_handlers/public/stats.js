import logger from '../../_utils/logger.js';
import { db } from '../../../src/db/index.js';
import { Guide, ToolboxItem, Structure, Appointment } from '../../../src/db/schema.js';
import { count, eq } from 'drizzle-orm';
/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const [guidesRes, toolsRes, structuresRes, rdvRes] = await Promise.all([
            db.select({ value: count() }).from(Guide).where(eq(Guide.statut, 'publie')),
            db.select({ value: count() }).from(ToolboxItem).where(eq(ToolboxItem.statut, 'publie')),
            db.select({ value: count() }).from(Structure).where(eq(Structure.status, 'actif')),
            db.select({ value: count() }).from(Appointment)
        ]);

        const guidesCount = guidesRes[0].value;
        const toolsCount = toolsRes[0].value;
        const structuresCount = structuresRes[0].value;
        const rdvCount = rdvRes[0].value;

        // Cache for 1 hour
        res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=59');

        return res.json({
            guides: guidesCount,
            tools: toolsCount,
            structures: structuresCount,
            appointments: rdvCount
        });
    } catch (e) {
        logger.error("Error fetching stats", e);
        return res.status(500).json({ error: "Internal error" });
    }
}
