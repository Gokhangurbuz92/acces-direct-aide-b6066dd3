import logger from '../../../_utils/logger.js';
// @ts-nocheck
import prisma from '../../../_utils/prisma.js';
import { requireProAuth, requireProStructureContext } from '../../../_utils/auth.js';

/**
 * Pro Notifications — Unread Message Count (G6)
 *
 * GET /api/pro/notifications/unread-count
 *
 * Returns the number of unread ProMessages for the current user.
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
        // Count ProMessages not sent by this user AND not yet read
        const messageCount = await prisma.proMessage.count({
            where: {
                readAt: null,
                senderId: { not: userId },
            },
        });

        // Also get ProNotification unread count for a unified badge
        const notifCount = await prisma.proNotification.count({
            where: {
                userId,
                readAt: null,
            },
        });

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
