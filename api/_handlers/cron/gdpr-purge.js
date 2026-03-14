import logger from '../../_utils/logger.js';
import { db } from '../../../src/db/index.js';
import { EntityVersion, UpdateLog, AuditLog } from '../../../src/db/schema.js';
import { lt } from 'drizzle-orm';
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
        logger.info(`🧹 Starting GDPR Purge (older than ${RETENTION_DAYS} days: ${cutoff.toISOString()})...`);

        // 1. Purge Old Entity Versions
        const deletedVersions = await db.delete(EntityVersion).where(lt(EntityVersion.createdAt, cutoff));
        const deletedVersionsCount = deletedVersions.length;

        // 2. Purge Old Update Logs
        const deletedLogs = await db.delete(UpdateLog).where(lt(UpdateLog.createdAt, cutoff));
        const deletedLogsCount = deletedLogs.length;

        // 3. Purge sensitive logs if they exist (AuditLog)
        let deletedAuditCount = 0;
        try {
            const auditRes = await db.delete(AuditLog).where(lt(AuditLog.timestamp, cutoff));
            deletedAuditCount = auditRes.length;
        } catch { /* Might not exist yet */ }

        const summary = {
            versions_deleted: deletedVersionsCount,
            update_logs_deleted: deletedLogsCount,
            audit_logs_deleted: deletedAuditCount,
            status: 'success'
        };

        logger.info('✅ Purge complete:', summary);
        return res.status(200).json(summary);
    } catch (e) {
        logger.error('Purge Failed:', e);
        return res.status(500).json({ error: e.message });
    }
}
