import { getCronAuth } from '../../_utils/cronAuth.js';
import prisma from '../../_utils/prisma.js';
import { storage } from '../../lib/storage.js';
import { logger } from '../../lib/logger.js';
import * as Sentry from '@sentry/node';

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
        const filename = `backups/ada-backup-${timestamp}.json`;
        
        logger.info(`[BACKUP] 🚀 Démarrage de la sauvegarde Cloud...`);

        // 1. Catalogue d'aides
        const aides = await prisma.aide.findMany();

        // 2. Logs de conversation
        const logs = await prisma.conversationLog.findMany({
            orderBy: { createdAt: 'desc' },
        });

        // 3. Build backup package
        const backupData = {
            metadata: {
                version: '1.0',
                timestamp: new Date().toISOString(),
                counts: {
                    aides: aides.length,
                    conversationLogs: logs.length,
                },
            },
            data: {
                aides,
                conversationLogs: logs,
            },
        };

        const buffer = Buffer.from(JSON.stringify(backupData, null, 2), 'utf-8');

        // 4. Upload to S3/R2 directly
        const storageKey = await storage.upload(buffer, 'application/json');

        const sizeMB = (buffer.length / (1024 * 1024)).toFixed(2);
        logger.info(`[BACKUP] ✅ Sauvegarde réussie sur le Cloud: ${storageKey} (${sizeMB} MB)`);
        
        return res.status(200).json({ 
            success: true, 
            filename: storageKey,
            sizeMB,
            aides: aides.length,
            logs: logs.length
        });

    } catch (error) {
        logger.error(`[BACKUP] ❌ Erreur Critique lors de la Sauvegarde :`, error);
        Sentry.captureException(error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
