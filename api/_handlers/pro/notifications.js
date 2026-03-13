import logger from '../../_utils/logger.js';
// @ts-nocheck
import { db } from '../../../src/db/index.js';
import { ProNotification } from '../../../src/db/schema.js';
import { eq, and, isNull, inArray, count } from 'drizzle-orm';
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

            let whereConditions = [eq(ProNotification.userId, userId)];
            if (unreadOnly) {
                whereConditions.push(isNull(ProNotification.readAt));
            }

            const [notifications, totalRes, unreadCountRes] = await Promise.all([
                db.query.ProNotification.findMany({
                    where: and(...whereConditions),
                    orderBy: (pn, { desc }) => [desc(pn.createdAt)],
                    limit,
                    offset: skip,
                }),
                db.select({ count: count() }).from(ProNotification).where(and(...whereConditions)),
                db.select({ count: count() }).from(ProNotification).where(and(eq(ProNotification.userId, userId), isNull(ProNotification.readAt))),
            ]);
            
            const total = totalRes[0].count;
            const unreadCount = unreadCountRes[0].count;

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

            const updated = await db.update(ProNotification).set({
                    readAt: action === 'read' ? new Date() : null,
            }).where(
                and(
                    inArray(ProNotification.id, safeIds),
                    eq(ProNotification.userId, userId)
                )
            ).returning();

            // Get new unread count
            const unreadCountRes = await db.select({ count: count() }).from(ProNotification).where(
                and(eq(ProNotification.userId, userId), isNull(ProNotification.readAt))
            );
            const unreadCount = unreadCountRes[0].count;

            return res.status(200).json({
                ok: true,
                updated: updated.length,
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
        const [newNotif] = await db.insert(ProNotification).values({
                userId: data.userId,
                structureId: data.structureId,
                type: data.type,
                title: data.title,
                message: data.message,
                metadata: data.metadata || null,
        }).returning();
        return newNotif;
    } catch (error) {
        logger.warn({ err: error, data }, '[Notifications] Failed to create notification');
        return null;
    }
}
