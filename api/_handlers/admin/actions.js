import { checkRateLimit, getClientIp, getRateLimitStatus } from '../../_utils/rateLimit.js';
import logger from '../../_utils/logger.js';
import { db } from '../../../src/db/index.js';
import { Actualite, AuditLog } from '../../../src/db/schema.js';
import { inArray } from 'drizzle-orm';
import { verifyAdmin } from '../../_utils/auth.js';
import { adminBulkActionSchema } from '../../../src/db/drizzle-schemas.js';
/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */

export default async function handler(req, res) {
    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit('ADMIN_API', ip);
    if (!rateLimit.allowed) {
        return res.status(getRateLimitStatus(rateLimit)).json(rateLimit.error);
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!verifyAdmin(req)) {
        return res.status(401).json({ error: 'Unauthorized: Admin Token Required' });
    }

    const parseResult = adminBulkActionSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res.status(400).json({ error: 'Invalid payload', details: parseResult.error.flatten() });
    }

    const { action, ids } = parseResult.data;

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

        const updated = await db.update(Actualite).set(updateData).where(inArray(Actualite.id, ids)).returning({ id: Actualite.id });
        const count = updated.length;

        // Audit Log
        await db.insert(AuditLog).values({
            action: `ADMIN_BULK_${action}`,
            details: { count, ids },
            timestamp: new Date()
        });

        return res.status(200).json({ success: true, count });

    } catch (error) {
        logger.error('Admin Action Error:', error);
        return res.status(500).json({ error: 'Database Error' });
    }
}
