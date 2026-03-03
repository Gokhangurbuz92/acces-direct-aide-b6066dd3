import logger from "../../_utils/logger.js";
import prisma from '../../_utils/prisma.js';

/**
 * POST /api/assistant/feedback
 *
 * Records user satisfaction feedback on an AI response.
 * Accepts: { logId: string, rating: 1 | -1, comment?: string }
 *
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { logId, rating, comment } = req.body || {};

    if (!logId || (rating !== 1 && rating !== -1)) {
        return res.status(400).json({
            error: 'invalid_payload',
            message: 'Les champs "logId" (string) et "rating" (1 ou -1) sont requis.',
        });
    }

    try {
        await prisma.conversationLog.update({
            where: { id: logId },
            data: {
                rating,
                userComment: comment ? String(comment).slice(0, 500) : null,
            },
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        logger.error('[Feedback Error]:', error);

        // If the log doesn't exist, return a soft error
        if (error.code === 'P2025') {
            return res.status(404).json({
                error: 'not_found',
                message: 'Ce log de conversation est introuvable.',
            });
        }

        return res.status(500).json({
            error: 'update_failed',
            message: 'Impossible d\'enregistrer le feedback.',
        });
    }
}
