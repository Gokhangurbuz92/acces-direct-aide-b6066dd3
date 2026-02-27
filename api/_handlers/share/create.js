import prisma from '../../_utils/prisma.js';

/**
 * POST /api/share/create
 *
 * Saves a diagnostic snapshot and generates a shareable link.
 * Shared diagnostics expire after 7 days by default.
 *
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { situation, results } = req.body || {};

    if (!situation || !results) {
        return res.status(400).json({
            error: 'invalid_payload',
            message: 'Les champs "situation" et "results" sont requis.',
        });
    }

    try {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7-day expiration

        const shared = await prisma.sharedDiagnostic.create({
            data: {
                situation,
                results,
                expiresAt,
            },
        });

        return res.status(200).json({
            success: true,
            shareId: shared.id,
            shareUrl: `/share/${shared.id}`,
            expiresAt: shared.expiresAt,
        });
    } catch (error) {
        console.error('[Share Create Error]:', error);
        return res.status(500).json({
            error: 'create_failed',
            message: 'Impossible de créer le lien de partage.',
        });
    }
}
