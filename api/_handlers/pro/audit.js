// @ts-nocheck
import prisma from '../../_utils/prisma.js';
import { AUTH_ROLE, requireProRole, requireProStructureContext } from '../../_utils/auth.js';

/**
 * Audit Log API
 *
 * GET /api/pro/audit
 *   ?page=1&limit=50&action=DOSSIER_VIEWED
 *
 * Returns paginated audit log entries for the structure.
 * Only accessible by STRUCTURE_ADMIN and SUPERADMIN.
 */
async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const proCtx = requireProStructureContext(req, res);
    if (!proCtx) return;

    const { structureId } = proCtx;

    const url = new URL(req.url || '/', `https://${req.headers?.host || 'localhost'}`);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)));
    const actionFilter = url.searchParams.get('action');

    try {
        const whereClause = {
            details: { path: ['structureId'], equals: structureId },
            ...(actionFilter ? { action: actionFilter } : {}),
        };

        const [logs, totalCount] = await Promise.all([
            prisma.auditLog.findMany({
                where: whereClause,
                orderBy: { timestamp: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.auditLog.count({ where: whereClause }),
        ]);

        // Enrich with user emails
        const actorIds = [...new Set(logs.map((l) => l.actor_id).filter(Boolean))];
        const actors = actorIds.length > 0
            ? await prisma.proUser.findMany({
                where: { id: { in: actorIds } },
                select: { id: true, email: true },
            })
            : [];

        const actorMap = {};
        actors.forEach((a) => { actorMap[a.id] = a.email; });

        const entries = logs.map((log) => ({
            id: log.id,
            action: log.action,
            actorId: log.actor_id,
            actorEmail: actorMap[log.actor_id] || null,
            details: log.details,
            timestamp: log.timestamp,
            ipHash: log.ip_hash,
        }));

        return res.status(200).json({
            ok: true,
            entries,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
            },
        });
    } catch (error) {
        console.error('[Audit Log] Erreur:', error.message);
        return res.status(500).json({ error: 'Impossible de charger le journal.' });
    }
}

export default requireProRole(handler, [AUTH_ROLE.STRUCTURE_ADMIN, AUTH_ROLE.SUPERADMIN]);
