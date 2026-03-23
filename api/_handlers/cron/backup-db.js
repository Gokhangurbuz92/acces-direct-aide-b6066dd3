import { getCronAuth } from '../../_utils/cronAuth.js';
import { db } from '../../../src/db/index.js';
import { Aide, Structure, Demarche, Actualite, ConversationLog, AuditLog, CronRun, ReviewQueueItem, IngestJob } from '../../../src/db/schema.js';
import { storage } from '../../lib/storage.js';
import { logger } from '../../lib/logger.js';
import * as Sentry from '@sentry/node';
import { sql } from 'drizzle-orm';

export default async function handler(req, res) {
    const auth = getCronAuth(req);
    if (!auth.ok) {
        if (auth.reason === 'missing_secret') {
            return res.status(500).json({ error: 'CRON_SECRET is not configured' });
        }
        logger.warn("Unauthorized Backup Attempt");
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        
        logger.info(`[BACKUP] 🚀 Démarrage de la sauvegarde complète...`);

        // Fetch all critical tables in parallel
        const [aides, structures, demarches, actualites, conversationLogs, auditLogs, cronRuns, reviewItems, ingestJobs] = await Promise.all([
            db.query.Aide.findMany(),
            db.query.Structure.findMany(),
            db.query.Demarche.findMany(),
            db.query.Actualite.findMany(),
            db.query.ConversationLog.findMany({ orderBy: (cl, { desc }) => [desc(cl.createdAt)] }),
            db.query.AuditLog.findMany({ orderBy: (al, { desc }) => [desc(al.createdAt)], limit: 5000 }),
            db.query.CronRun.findMany({ orderBy: (cr, { desc }) => [desc(cr.startedAt)], limit: 1000 }),
            db.query.ReviewQueueItem.findMany(),
            db.query.IngestJob.findMany({ orderBy: (ij, { desc }) => [desc(ij.createdAt)], limit: 500 }),
        ]);

        // User counts only (no PII in backup)
        const userCounts = await db.execute(sql`
            SELECT
                (SELECT COUNT(*) FROM "CitizenUser") AS citizen_count,
                (SELECT COUNT(*) FROM "ProUser") AS pro_count,
                (SELECT COUNT(*) FROM "AdminUser") AS admin_count
        `);
        const counts = userCounts.rows?.[0] || {};

        // Build backup package
        const backupData = {
            metadata: {
                version: '2.0',
                timestamp: new Date().toISOString(),
                counts: {
                    aides: aides.length,
                    structures: structures.length,
                    demarches: demarches.length,
                    actualites: actualites.length,
                    conversationLogs: conversationLogs.length,
                    auditLogs: auditLogs.length,
                    cronRuns: cronRuns.length,
                    reviewItems: reviewItems.length,
                    ingestJobs: ingestJobs.length,
                    citizenUsers: Number(counts.citizen_count || 0),
                    proUsers: Number(counts.pro_count || 0),
                    adminUsers: Number(counts.admin_count || 0),
                },
            },
            data: {
                aides,
                structures,
                demarches,
                actualites,
                conversationLogs,
                auditLogs,
                cronRuns,
                reviewItems,
                ingestJobs,
                // Note: User tables NOT included in backup (PII protection).
                // Use Neon point-in-time recovery for user data restoration.
            },
        };

        const buffer = Buffer.from(JSON.stringify(backupData, null, 2), 'utf-8');

        // Upload to S3/R2
        const storageKey = await storage.upload(buffer, 'application/json');

        const sizeMB = (buffer.length / (1024 * 1024)).toFixed(2);
        logger.info(`[BACKUP] ✅ Sauvegarde complète réussie: ${storageKey} (${sizeMB} MB, ${Object.keys(backupData.data).length} tables)`);
        
        return res.status(200).json({ 
            success: true, 
            filename: storageKey,
            sizeMB,
            tables: Object.keys(backupData.data).length,
            counts: backupData.metadata.counts,
        });

    } catch (error) {
        logger.error(`[BACKUP] ❌ Erreur Critique lors de la Sauvegarde :`, error);
        Sentry.captureException(error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
