import logger from "../../_utils/logger.js";
import prisma from '../../_utils/prisma.js';
import { verifyAdmin, resolveAuthContext } from '../../_utils/auth.js';
import { restoreVersion } from '../../_utils/snapshot.js';
/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */

export default async function handler(req, res) {
    if (!verifyAdmin(req)) return res.status(401).json({ error: "Unauthorized" });

    const { entity_type, entity_id } = req.query;

    try {
        if (req.method === 'GET') {
            if (!entity_type || !entity_id) {
                return res.status(400).json({ error: "Missing entity_type or entity_id" });
            }

            const versions = await prisma.entityVersion.findMany({
                where: {
                    entity_type,
                    entity_id: String(entity_id)
                },
                orderBy: { createdAt: 'desc' },
                take: 20
            });

            return res.status(200).json(versions);
        }

        if (req.method === 'POST') {
            const { versionId } = req.body;
            if (!versionId) return res.status(400).json({ error: "Missing versionId" });

            const auth = resolveAuthContext(req);
            const restored = await restoreVersion(versionId, auth?.email || 'admin');
            return res.status(200).json({ success: true, restored });
        }

        return res.status(405).json({ error: "Method not allowed" });
    } catch (e) {
        logger.error('Versions API Error:', e);
        return res.status(500).json({ error: e.message });
    }
}
