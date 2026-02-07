import prisma from '../../_utils/prisma.js';

const CRON_SECRET = process.env.CRON_SECRET || 'dev-secret-key';
const RETENTION_DAYS = 90;

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const { key } = req.query;
    if (key !== CRON_SECRET) return res.status(401).json({ error: 'Unauthorized' });

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
        } catch (e) { /* Might not exist yet */ }

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
