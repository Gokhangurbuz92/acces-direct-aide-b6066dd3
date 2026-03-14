import logger from '../../../_utils/logger.js';
// @ts-nocheck
import { db } from '../../../../src/db/index.js';
<<<<<<< HEAD
<<<<<<< HEAD
import { ProNotification, RdvConversationMessage } from '../../../../src/db/schema.js';
=======
import { ProNotification } from '../../../../src/db/schema.js';
>>>>>>> 241663f (refactor(schema): drop 6 legacy tables + clean 35 handler files)
=======
import { ProNotification, RdvConversationMessage } from '../../../../src/db/schema.js';
>>>>>>> fd2f117 (refactor: remove dead System C messaging code and ProMessage table)
import { eq, and, isNull, ne, count } from 'drizzle-orm';
import { requireProAuth, requireProStructureContext } from '../../../_utils/auth.js';

/**
 * Pro Notifications — Unread Message Count (G6)
 *
 * GET /api/pro/notifications/unread-count
 *
 * Returns the number of unread RdvConversationMessages for the current user.
 * Lightweight endpoint designed for badge polling (30s heartbeat).
 */
async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const proCtx = requireProStructureContext(req, res);
    if (!proCtx) return;

    const { userId } = proCtx;

    try {
        // Count RdvConversationMessages not sent by this pro user AND not yet read
        const messageCountRes = await db.select({ count: count() }).from(RdvConversationMessage).where(
            and(
                isNull(RdvConversationMessage.readAt),
                ne(RdvConversationMessage.senderProUserId, userId)
            )
        );
        const messageCount = messageCountRes[0].count;

        // Also get ProNotification unread count for a unified badge
        const notifCountRes = await db.select({ count: count() }).from(ProNotification).where(
            and(
                eq(ProNotification.userId, userId),
                isNull(ProNotification.readAt)
            )
        );
        const notifCount = notifCountRes[0].count;

        return res.status(200).json({
            ok: true,
            messages: messageCount,
            notifications: notifCount,
            total: messageCount + notifCount,
        });
    } catch (error) {
        logger.error({ err: error }, '[UnreadCount] Erreur');
        // Return 0 on error to avoid badge flickering
        return res.status(200).json({
            ok: true,
            messages: 0,
            notifications: 0,
            total: 0,
        });
    }
}

export default requireProAuth(handler);
