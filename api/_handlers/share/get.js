import logger from "../../_utils/logger.js";
import prisma from '../../_utils/prisma.js';

/**
 * GET /api/share/get?id=...
 *
 * Retrieves a shared diagnostic by ID, increments view count.
 * Returns 404 if the diagnostic is not found or has expired.
 *
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const id = url.searchParams.get('id');

    if (!id) {
        return res.status(400).json({
            error: 'missing_id',
            message: 'Le paramètre "id" est requis.',
        });
    }

    try {
        const shared = await prisma.sharedDiagnostic.findUnique({
            where: { id },
        });

        if (!shared) {
            return res.status(404).json({
                error: 'not_found',
                message: 'Ce dossier est introuvable ou a été supprimé.',
            });
        }

        // Check expiration
        if (new Date() > new Date(shared.expiresAt)) {
            return res.status(410).json({
                error: 'expired',
                message: 'Ce lien de partage a expiré. Demandez un nouveau lien à l\'usager.',
            });
        }

        // Increment view count (fire-and-forget)
        prisma.sharedDiagnostic.update({
            where: { id },
            data: { viewCount: { increment: 1 } },
        }).catch(() => { /* non-blocking */ });

        return res.status(200).json({
            success: true,
            data: {
                id: shared.id,
                createdAt: shared.createdAt,
                expiresAt: shared.expiresAt,
                situation: shared.situation,
                results: shared.results,
                viewCount: shared.viewCount + 1,
            },
        });
    } catch (error) {
        logger.error('[Share Get Error]:', error);
        return res.status(500).json({
            error: 'fetch_failed',
            message: 'Impossible de récupérer le dossier.',
        });
    }
}
