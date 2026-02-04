import prisma from '../../_utils/prisma.js';
import { getAuthenticatedUser } from '../_utils/auth.js';
import { restoreVersion } from '../_utils/snapshot.js';

export default async function handler(req, res) {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

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

            const restored = await restoreVersion(versionId, user.email);
            return res.status(200).json({ success: true, restored });
        }

        return res.status(405).json({ error: "Method not allowed" });
    } catch (e) {
        console.error('Versions API Error:', e);
        return res.status(500).json({ error: e.message });
    }
}
