// @ts-nocheck
import prisma from '../../_utils/prisma.js';
import { requireProAuth, requireProStructureContext } from '../../_utils/auth.js';

/**
 * Pro Notifications API
 *
 * GET /api/pro/notifications
 *   ?since=ISO8601  — optional, only return events after this timestamp
 *
 * Returns recent AuditLog entries relevant to the agent's structure,
 * transformed into notification-shaped objects.
 */
async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const proCtx = requireProStructureContext(req, res);
    if (!proCtx) return;

    const { structureId, userId } = proCtx;

    const url = new URL(req.url || '/', `https://${req.headers?.host || 'localhost'}`);
    const since = url.searchParams.get('since');

    try {
        const whereClause = {
            details: { path: ['structureId'], equals: structureId },
            ...(since ? { timestamp: { gte: new Date(since) } } : {}),
        };

        const logs = await prisma.auditLog.findMany({
            where: whereClause,
            orderBy: { timestamp: 'desc' },
            take: 30,
        });

        // Transform audit logs into notifications
        const notifications = logs.map((log) => ({
            id: log.id,
            type: getNotificationType(log.action),
            title: getNotificationTitle(log.action),
            message: getNotificationMessage(log.action, log.details),
            timestamp: log.timestamp,
            actorId: log.actor_id,
            isOwn: log.actor_id === userId,
            action: log.action,
        }));

        return res.status(200).json({
            ok: true,
            notifications,
            count: notifications.length,
        });
    } catch (error) {
        console.error('[Notifications] Erreur:', error.message);
        return res.status(500).json({ error: 'Impossible de charger les notifications.' });
    }
}

function getNotificationType(action) {
    if (action.includes('MESSAGE') || action.includes('CHAT')) return 'message';
    if (action.includes('APPOINTMENT') || action.includes('RDV') || action.includes('BOOKING')) return 'appointment';
    if (action.includes('DOSSIER') || action.includes('SHARE')) return 'dossier';
    if (action.includes('LOGIN') || action.includes('REGISTER') || action.includes('INVITATION')) return 'auth';
    if (action.includes('USER_DISABLED')) return 'team';
    return 'system';
}

function getNotificationTitle(action) {
    const titles = {
        DOSSIER_VIEWED: 'Dossier consulté',
        DOSSIER_STATUS_UPDATED: 'Statut dossier mis à jour',
        REGISTER_VIA_INVITE: 'Nouveau membre',
        INVITATION_SENT: 'Invitation envoyée',
        LOGIN_SUCCESS: 'Connexion',
        USER_DISABLED: 'Membre désactivé',
        REGISTER_SUCCESS: 'Inscription structure',
    };
    return titles[action] || action.replace(/_/g, ' ').toLowerCase();
}

function getNotificationMessage(action, details) {
    const d = details || {};
    switch (action) {
        case 'DOSSIER_VIEWED':
            return `Dossier #${(d.shareId || '').slice(0, 8)} consulté (vue n°${d.viewCount || '?'})`;
        case 'DOSSIER_STATUS_UPDATED':
            return `Dossier #${(d.shareId || '').slice(0, 8)} → ${d.status || '?'}`;
        case 'REGISTER_VIA_INVITE':
            return `Un nouveau collaborateur a rejoint la structure via invitation.`;
        case 'INVITATION_SENT':
            return `Invitation envoyée à ${d.email || '?'} (rôle: ${d.role || 'PRO'})`;
        case 'LOGIN_SUCCESS':
            return `Connexion réussie`;
        case 'USER_DISABLED':
            return `Un compte collaborateur a été désactivé.`;
        default:
            return action.replace(/_/g, ' ');
    }
}

export default requireProAuth(handler);
