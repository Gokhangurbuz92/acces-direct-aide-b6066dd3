import prisma from '../../_utils/prisma.js';
import { getCronAuth } from '../../_utils/cronAuth.js';

const RETENTION_DAYS = 90;
/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    // Backward compatibility: this endpoint historically used `?key=...`.
    // We now standardize on cronAuth (`x-cron-secret: <CRON_SECRET>`, `Authorization: Bearer <CRON_SECRET>`, or `?secret=...`).
    const secret = req.query?.secret ?? req.query?.key;
    const authReq = { headers: req.headers, query: { secret }, url: req.url };
    const auth = getCronAuth(authReq);
    if (!auth.ok) {
        if (auth.reason === 'missing_secret') {
            return res.status(500).json({ error: 'CRON_SECRET is not configured' });
        }
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

    try {
        console.log(`🧹 Starting GDPR Purge (older than ${RETENTION_DAYS} days: ${cutoff.toISOString()})...`);

        // 1. Purge Old Entity Versions
        const deletedVersions = await prisma.entityVersion.deleteMany({
            where: { createdAt: { lt: cutoff } }
        });

        // 2. Purge Old Update Logs
        const deletedLogs = await prisma.updateLog.deleteMany({
            where: { createdAt: { lt: cutoff } }
        });

        // 3. Purge sensitive logs if they exist (AuditLog)
        // Check if AuditLog exists in schema first... 
        // Based on previous listings, we have AuditLog.
        let deletedAudit = 0;
        try {
            const auditRes = await prisma.auditLog.deleteMany({
                where: { createdAt: { lt: cutoff } }
            });
            deletedAudit = auditRes.count;
        } catch { /* Might not exist yet */ }

        const summary = {
            versions_deleted: deletedVersions.count,
            update_logs_deleted: deletedLogs.count,
            audit_logs_deleted: deletedAudit,
            status: 'success'
        };

        console.log('✅ Purge complete:', summary);
        return res.status(200).json(summary);
    } catch (e) {
        console.error('Purge Failed:', e);
        return res.status(500).json({ error: e.message });
    }
}
