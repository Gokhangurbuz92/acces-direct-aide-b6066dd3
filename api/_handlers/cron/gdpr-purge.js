import logger from '../../_utils/logger.js';
import { db } from '../../../src/db/index.js';
import { EntityVersion, UpdateLog, AuditLog, ConversationLog, SharedDiagnostic, AuthToken, AiMetric } from '../../../src/db/schema.js';
import { lt } from 'drizzle-orm';
import { getCronAuth } from '../../_utils/cronAuth.js';
import * as Sentry from '@sentry/node';

const RETENTION_DAYS = 90;
/**
 * GDPR Purge Cron
 *
 * Automatically purges expired/old data to comply with RGPD:
 *   - EntityVersion     > 90 days
 *   - UpdateLog         > 90 days
 *   - AuditLog          > 90 days
 *   - ConversationLog   > 90 days
 *   - SharedDiagnostic  > 90 days
 *   - AuthToken         where expiresAt < NOW()
 *
 * Schedule: every Sunday at 03:00 (vercel.json)
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

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

        // 3. Purge sensitive AuditLog
        let deletedAuditCount = 0;
        try {
            const auditRes = await db.delete(AuditLog).where(lt(AuditLog.timestamp, cutoff));
            deletedAuditCount = auditRes.length;
        } catch { /* Might not exist yet */ }

        // 4. Purge Old Conversation Logs (RGPD — citizen data)
        let deletedConversationsCount = 0;
        try {
            const convRes = await db.delete(ConversationLog).where(lt(ConversationLog.createdAt, cutoff));
            deletedConversationsCount = convRes.length;
        } catch { /* Table might not have data yet */ }

        // 5. Purge Old Shared Diagnostics (RGPD — citizen data)
        let deletedDiagnosticsCount = 0;
        try {
            const diagRes = await db.delete(SharedDiagnostic).where(lt(SharedDiagnostic.createdAt, cutoff));
            deletedDiagnosticsCount = diagRes.length;
        } catch { /* Table might not have data yet */ }

        // 6. Purge Expired Auth Tokens
        let deletedTokensCount = 0;
        try {
            const tokenRes = await db.delete(AuthToken).where(lt(AuthToken.expiresAt, new Date()));
            deletedTokensCount = tokenRes.length;
        } catch { /* Table might not have data yet */ }

        // 7. Purge Old AI Metrics (non-personal but storage hygiene)
        let deletedAiMetricsCount = 0;
        try {
            const aiRes = await db.delete(AiMetric).where(lt(AiMetric.createdAt, cutoff));
            deletedAiMetricsCount = aiRes.length;
        } catch { /* Table might not exist yet */ }

        const summary = {
            versions_deleted: deletedVersionsCount,
            update_logs_deleted: deletedLogsCount,
            audit_logs_deleted: deletedAuditCount,
            conversation_logs_deleted: deletedConversationsCount,
            diagnostics_deleted: deletedDiagnosticsCount,
            tokens_deleted: deletedTokensCount,
            ai_metrics_deleted: deletedAiMetricsCount,
            status: 'success',
        };

        logger.info('✅ GDPR Purge complete:', summary);
        return res.status(200).json(summary);
    } catch (e) {
        logger.error('GDPR Purge Failed:', e);
        Sentry.captureException(e);
        return res.status(500).json({ error: e.message });
    }
}

