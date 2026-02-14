
import prisma from '../../_utils/prisma.js';
import { subDays } from 'date-fns';
import { storage } from '../../lib/storage.js';
import { logger } from '../../lib/logger.js';
import { isCronAuthorized } from '../../_utils/cronAuth.js';

export default async function handler(req, res) {
    // Cron security check
    if (!isCronAuthorized(req)) {
        logger.warn('Unauthorized purge attempt');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const now = new Date();

        // 1. Expire Locks (Older than 10 mins)
        // Check status=locked AND expires < now
        const expiredLocks = await prisma.appointment.updateMany({
            where: {
                status: 'locked',
                lock_expires_at: { lt: now }
            },
            data: { status: 'expired' }
        });

        // 2. Anonymize/Purge Old Data (> 90 Days)
        const retentionDate = subDays(now, 90);

        // Find old appointments
        const oldAppointments = await prisma.appointment.findMany({
            where: {
                end_at: { lt: retentionDate },
                // status: confirmed, or any finished state
            },
            select: { id: true, beneficiaryId: true }
        });

        let purgedCount = 0;
        let anonBenCount = 0;

        for (const app of oldAppointments) {
            // Delete appointment
            await prisma.appointment.delete({ where: { id: app.id } });
            purgedCount++;

            // Check if beneficiary has other future/recent appointments
            const recent = await prisma.appointment.count({
                where: {
                    beneficiaryId: app.beneficiaryId,
                    end_at: { gte: retentionDate }
                }
            });

            if (recent === 0) {
                // Anonymize Beneficiary
                await prisma.beneficiary.update({
                    where: { id: app.beneficiaryId },
                    data: {
                        contact_encrypted: "ANONYMIZED",
                        contact_hash: "ANONYMIZED",
                        first_name_encrypted: null
                    }
                });
                anonBenCount++;
            }
        }

        // 3. Purge Messages (> 60 days) and Attachments (> 30 days)
        // Attachments first (cleanup storage)
        const storageLimit = subDays(now, 30);
        const oldAttachments = await prisma.attachment.findMany({
            where: { createdAt: { lt: storageLimit } }
        });

        let purgedFiles = 0;
        for (const att of oldAttachments) {
            try {
                // Delete from disk/S3
                await storage.delete(att.storage_key);
                // Delete DB record
                await prisma.attachment.delete({ where: { id: att.id } });
                purgedFiles++;
            } catch (e) {
                logger.error(`Failed to delete attachment ${att.id}`, e);
            }
        }

        // Messages (> 60 days)
        const msgLimit = subDays(now, 60);
        const expiredMessages = await prisma.message.deleteMany({
            where: { createdAt: { lt: msgLimit } }
        });

        // 4. Purge Logs
        // AuditLog > 1 year (365 days)
        const auditLimit = subDays(now, 365);
        const expiredAudits = await prisma.auditLog.deleteMany({
            where: { timestamp: { lt: auditLimit } }
        });

        // ImportLog & UpdateLog > 90 days
        const expiredImports = await prisma.importLog.deleteMany({
            where: { createdAt: { lt: retentionDate } } // retentionDate is 90 days
        });
        const expiredUpdates = await prisma.updateLog.deleteMany({
            where: { ran_at: { lt: retentionDate } }
        });

        const stats = {
            expiredLocks: expiredLocks.count,
            purgedAppointments: purgedCount,
            purgedFiles,
            purgedMessages: expiredMessages.count,
            anonymizedBeneficiaries: anonBenCount,
            purgedAuditLogs: expiredAudits.count,
            purgedImportLogs: expiredImports.count,
            purgedUpdateLogs: expiredUpdates.count
        };

        if (Object.values(stats).some(v => v > 0)) {
            logger.info('🧹 PURGE COMPLETE', stats);
        }

        return res.status(200).json({
            success: true,
            ...stats
        });

    } catch (e) {
        logger.error("Cron Purge Error", e);
        return res.status(500).json({ error: "Purge failed" });
    }
}
