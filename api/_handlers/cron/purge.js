import { db } from '../../../src/db/index.js';
import { Appointment, Beneficiary, Attachment, Message, AuditLog, ImportLog, UpdateLog } from '../../../src/db/schema.js';
import { lt, and, eq, gte } from 'drizzle-orm';
import { subDays } from 'date-fns';
import { storage } from '../../lib/storage.js';
import { logger } from '../../lib/logger.js';
import { getCronAuth } from '../../_utils/cronAuth.js';
/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */

export default async function handler(req, res) {
    // Cron security check
    const auth = getCronAuth(req);
    if (!auth.ok) {
        if (auth.reason === 'missing_secret') {
            return res.status(500).json({ error: 'CRON_SECRET is not configured' });
        }
        logger.warn('Unauthorized purge attempt');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const now = new Date();

        // 1. Expire Locks (Older than 10 mins)
        // Check status=locked AND expires < now
        const expiredLocks = await db.update(Appointment).set({ status: 'expired' }).where(
            and(
                eq(Appointment.status, 'locked'),
                lt(Appointment.lock_expires_at, now)
            )
        );

        // 2. Anonymize/Purge Old Data (> 90 Days)
        const retentionDate = subDays(now, 90);

        // Find old appointments
        const oldAppointments = await db.query.Appointment.findMany({
            where: lt(Appointment.end_at, retentionDate),
            columns: { id: true, beneficiaryId: true }
        });

        let purgedCount = 0;
        let anonBenCount = 0;

        for (const app of oldAppointments) {
            // Delete appointment
            await db.delete(Appointment).where(eq(Appointment.id, app.id));
            purgedCount++;

            // Check if beneficiary has other future/recent appointments
            const recentRows = await db.query.Appointment.findMany({
                where: and(
                    eq(Appointment.beneficiaryId, app.beneficiaryId),
                    gte(Appointment.end_at, retentionDate)
                ),
                columns: { id: true },
                limit: 1
            });
            const recent = recentRows.length;

            if (recent === 0) {
                // Anonymize Beneficiary
                await db.update(Beneficiary).set({
                    contact_encrypted: "ANONYMIZED",
                    contact_hash: "ANONYMIZED",
                    first_name_encrypted: null
                }).where(eq(Beneficiary.id, app.beneficiaryId));
                anonBenCount++;
            }
        }

        // 3. Purge Messages (> 60 days) and Attachments (> 30 days)
        // Attachments first (cleanup storage)
        const storageLimit = subDays(now, 30);
        const oldAttachments = await db.query.Attachment.findMany({
            where: lt(Attachment.createdAt, storageLimit)
        });

        let purgedFiles = 0;
        for (const att of oldAttachments) {
            try {
                // Delete from disk/S3
                await storage.delete(att.storage_key);
                // Delete DB record
                await db.delete(Attachment).where(eq(Attachment.id, att.id));
                purgedFiles++;
            } catch (e) {
                logger.error(`Failed to delete attachment ${att.id}`, e);
            }
        }

        // Messages (> 60 days)
        const msgLimit = subDays(now, 60);
        const expiredMessages = await db.delete(Message).where(lt(Message.createdAt, msgLimit));

        // 4. Purge Logs
        // AuditLog > 1 year (365 days)
        const auditLimit = subDays(now, 365);
        const expiredAudits = await db.delete(AuditLog).where(lt(AuditLog.timestamp, auditLimit));

        // ImportLog & UpdateLog > 90 days
        const expiredImports = await db.delete(ImportLog).where(lt(ImportLog.createdAt, retentionDate));
        const expiredUpdates = await db.delete(UpdateLog).where(lt(UpdateLog.ran_at, retentionDate));

        const stats = {
            expiredLocks: expiredLocks.length,
            purgedAppointments: purgedCount,
            purgedFiles,
            purgedMessages: expiredMessages.length,
            anonymizedBeneficiaries: anonBenCount,
            purgedAuditLogs: expiredAudits.length,
            purgedImportLogs: expiredImports.length,
            purgedUpdateLogs: expiredUpdates.length
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
