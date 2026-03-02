// @ts-nocheck
import prisma from '../../_utils/prisma.js';
import { logProAudit } from '../../lib/pro-auth.js';
import { AUTH_ROLE, requireProRole, requireProStructureContext } from '../../_utils/auth.js';
import { createNotification } from './notifications.js';
import logger from '../../_utils/logger.js';

const VALID_ROLES = ['PRO', 'STRUCTURE_ADMIN', 'SUPERADMIN'];

/**
 * Team Management API (Admin-only)
 *
 * GET    /api/pro/team?page=1&limit=20 — List users + invitations (paginated)
 * PATCH  /api/pro/team                 — Update user role
 * DELETE /api/pro/team?userId=xxx      — Disable user
 */
async function handler(req, res) {
    const proCtx = requireProStructureContext(req, res);
    if (!proCtx) return;

    const { structureId, userId } = proCtx;

    try {
        // ── GET: List team with pagination ──
        if (req.method === 'GET') {
            const url = new URL(req.url || '/', `https://${req.headers?.host || 'localhost'}`);
            const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
            const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));
            const skip = (page - 1) * limit;

            const [users, total] = await Promise.all([
                prisma.proUser.findMany({
                    where: { structureId },
                    select: { id: true, email: true, role: true, status: true, createdAt: true },
                    orderBy: { createdAt: 'desc' },
                    take: limit,
                    skip,
                }),
                prisma.proUser.count({ where: { structureId } }),
            ]);

            const invitations = await prisma.invitation.findMany({
                where: { structureId, used_at: null },
                orderBy: { created_at: 'desc' },
                take: 10,
            });

            return res.status(200).json({
                users,
                invitations,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            });
        }

        // ── PATCH: Update user role ──
        if (req.method === 'PATCH') {
            const { targetUserId, role } = req.body || {};

            if (!targetUserId || !role) {
                return res.status(400).json({ error: 'targetUserId et role requis.' });
            }

            if (!VALID_ROLES.includes(role)) {
                return res.status(400).json({
                    error: `Rôle invalide. Valeurs acceptées: ${VALID_ROLES.join(', ')}`,
                });
            }

            if (targetUserId === userId) {
                return res.status(400).json({ error: 'Impossible de modifier son propre rôle.' });
            }

            // Verify target user belongs to same structure
            const targetUser = await prisma.proUser.findFirst({
                where: { id: targetUserId, structureId },
            });

            if (!targetUser) {
                return res.status(404).json({ error: 'Utilisateur introuvable dans cette structure.' });
            }

            const previousRole = targetUser.role;

            await prisma.proUser.update({
                where: { id: targetUserId },
                data: { role },
            });

            // Audit
            await logProAudit('USER_ROLE_CHANGED', userId, structureId, {
                targetUserId,
                previousRole,
                newRole: role,
            }, req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown');

            // Notify target user
            await createNotification({
                userId: targetUserId,
                structureId,
                type: 'team_role_change',
                title: 'Votre rôle a été modifié',
                message: `Votre rôle a été changé de ${previousRole} à ${role}.`,
                metadata: { previousRole, newRole: role, changedBy: userId },
            });

            return res.status(200).json({
                ok: true,
                targetUserId,
                previousRole,
                newRole: role,
            });
        }

        // ── DELETE: Disable user ──
        if (req.method === 'DELETE') {
            const url = new URL(req.url || '/', `https://${req.headers?.host || 'localhost'}`);
            const targetUserId = url.searchParams.get('userId') || req.query?.userId;

            if (!targetUserId) {
                return res.status(400).json({ error: 'userId requis.' });
            }

            if (targetUserId === userId) {
                return res.status(400).json({ error: 'Impossible de se désactiver soi-même.' });
            }

            const targetUser = await prisma.proUser.findFirst({
                where: { id: targetUserId, structureId },
            });

            if (!targetUser) {
                return res.status(404).json({ error: 'Utilisateur introuvable.' });
            }

            await prisma.proUser.update({
                where: { id: targetUserId },
                data: { status: 'disabled' },
            });

            await logProAudit('USER_DISABLED', userId, structureId, {
                targetUserId,
            }, req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown');

            return res.status(200).json({ ok: true });
        }

        return res.status(405).json({ error: 'Méthode non autorisée' });
    } catch (error) {
        logger.error({ err: error }, '[Team] Erreur');
        return res.status(500).json({ error: 'Erreur interne.' });
    }
}

export default requireProRole(handler, [AUTH_ROLE.STRUCTURE_ADMIN, AUTH_ROLE.SUPERADMIN]);
