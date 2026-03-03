import logger from '../../_utils/logger.js';
import prisma from '../../_utils/prisma.js';
import { verifyAdmin } from '../../_utils/auth.js';
/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!verifyAdmin(req)) {
        return res.status(401).json({ error: 'Unauthorized: Admin Token Required' });
    }

    const { action, ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Invalid IDs' });
    }

    try {
        let updateData = {};

        switch (action) {
            case 'PUBLISH':
                updateData = {
                    statut: 'actif',
                    published_at: new Date()
                };
                break;
            case 'REJECT':
                updateData = {
                    statut: 'rejected'
                };
                break;
            case 'RETRY_FALC':
                updateData = {
                    falc_status: 'pending' // Pipeline will pick it up
                };
                break;
            default:
                return res.status(400).json({ error: 'Invalid Action' });
        }

        const result = await prisma.actualite.updateMany({
            where: { id: { in: ids } },
            data: updateData
        });

        // Audit Log
        await prisma.auditLog.create({
            data: {
                action: `ADMIN_BULK_${action}`,
                details: { count: result.count, ids },
                timestamp: new Date()
            }
        });

        return res.status(200).json({ success: true, count: result.count });

    } catch (error) {
        logger.error('Admin Action Error:', error);
        return res.status(500).json({ error: 'Database Error' });
    }
}
