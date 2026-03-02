// @ts-nocheck
import prisma from '../../../_utils/prisma.js';
import { requireProAuth, requireProStructureContext } from '../../../_utils/auth.js';
import logger from '../../../_utils/logger.js';

/**
 * Dossier View Log API (Pro-only, RGPD transparency)
 *
 * GET /api/pro/dossier/views?shareId=xxx
 *
 * Returns the audit log of who viewed a given dossier.
 * Provides RGPD transparency: "Qui a vu mon dossier?"
 */
async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const proCtx = requireProStructureContext(req, res);
    if (!proCtx) return;

    const url = new URL(req.url || '/', `https://${req.headers?.host || 'localhost'}`);
    const shareId = url.searchParams.get('shareId');

    if (!shareId) {
        return res.status(400).json({ error: 'shareId requis.' });
    }

    try {
        // Check dossier exists
        const shared = await prisma.sharedDiagnostic.findUnique({
            where: { id: shareId },
            select: { id: true, viewCount: true },
        });

        if (!shared) {
            return res.status(404).json({ error: 'Dossier introuvable.' });
        }

        // Get view audit logs
        const viewLogs = await prisma.auditLog.findMany({
            where: {
                entityId: shareId,
                action: { in: ['DOSSIER_VIEWED', 'DOSSIER_EXPORTED', 'DOSSIER_STATUS_UPDATED'] },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
            select: {
                id: true,
                action: true,
                actorId: true,
                createdAt: true,
                details: true,
            },
        });

        return res.status(200).json({
            ok: true,
            shareId,
            viewCount: shared.viewCount,
            views: viewLogs.map((log) => ({
                id: log.id,
                action: log.action,
                actorId: log.actorId,
                at: log.createdAt,
                details: typeof log.details === 'string' ? JSON.parse(log.details) : log.details,
            })),
        });
    } catch (error) {
        logger.error({ err: error }, '[DossierViews] Erreur');
        return res.status(500).json({ error: 'Erreur consultation.' });
    }
}

export default requireProAuth(handler);
