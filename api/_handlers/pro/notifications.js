import logger from '../../_utils/logger.js';
// @ts-nocheck
import prisma from '../../_utils/prisma.js';
import { requireProAuth, requireProStructureContext } from '../../_utils/auth.js';
/**
 * Pro Notifications API
 *
 * GET /api/pro/notifications
 *   ?page=1&limit=20  — pagination
 *   ?unread=true       — filter unread only
 *   Returns notifications + unreadCount
 *
 * PATCH /api/pro/notifications
 *   Body: { ids: string[], action: 'read' | 'unread' }
 *   Mark notifications as read/unread
 */
async function handler(req, res) {
    const proCtx = requireProStructureContext(req, res);
    if (!proCtx) return;

    const { userId, structureId } = proCtx;

    // ── GET: List notifications ──
    if (req.method === 'GET') {
        try {
            const url = new URL(req.url || '/', `https://${req.headers?.host || 'localhost'}`);
            const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
            const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));
            const unreadOnly = url.searchParams.get('unread') === 'true';
            const skip = (page - 1) * limit;

            const whereClause = {
                userId,
                ...(unreadOnly ? { readAt: null } : {}),
            };

            const [notifications, total, unreadCount] = await Promise.all([
                prisma.proNotification.findMany({
                    where: whereClause,
                    orderBy: { createdAt: 'desc' },
                    take: limit,
                    skip,
                }),
                prisma.proNotification.count({ where: whereClause }),
                prisma.proNotification.count({ where: { userId, readAt: null } }),
            ]);

            return res.status(200).json({
                ok: true,
                notifications,
                unreadCount,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            logger.error({ err: error }, '[Notifications] GET error');
            return res.status(500).json({ error: 'Erreur chargement notifications.' });
        }
    }

    // ── PATCH: Mark read/unread ──
    if (req.method === 'PATCH') {
        try {
            const { ids, action } = req.body || {};

            if (!Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({ error: 'ids requis (tableau non vide).' });
            }

            if (action !== 'read' && action !== 'unread') {
                return res.status(400).json({ error: 'action doit être "read" ou "unread".' });
            }

            // Limit batch size to prevent abuse
            const safeIds = ids.slice(0, 100);

            const updated = await prisma.proNotification.updateMany({
                where: {
                    id: { in: safeIds },
                    userId, // enforce ownership
                },
                data: {
                    readAt: action === 'read' ? new Date() : null,
                },
            });

            // Get new unread count
            const unreadCount = await prisma.proNotification.count({
                where: { userId, readAt: null },
            });

            return res.status(200).json({
                ok: true,
                updated: updated.count,
                unreadCount,
            });
        } catch (error) {
            logger.error({ err: error }, '[Notifications] PATCH error');
            return res.status(500).json({ error: 'Erreur mise à jour notifications.' });
        }
    }

    return res.status(405).json({ error: 'Méthode non autorisée' });
}

export default requireProAuth(handler);

/**
 * Helper to create a notification (used by other handlers/crons).
 *
 * @param {{
 *   userId: string,
 *   structureId: string,
 *   type: string,
 *   title: string,
 *   message: string,
 *   metadata?: Record<string, any>,
 * }} data
 */
export async function createNotification(data) {
    try {
        return await prisma.proNotification.create({
            data: {
                userId: data.userId,
                structureId: data.structureId,
                type: data.type,
                title: data.title,
                message: data.message,
                metadata: data.metadata || null,
            },
        });
    } catch (error) {
        logger.warn({ err: error, data }, '[Notifications] Failed to create notification');
        return null;
    }
}
