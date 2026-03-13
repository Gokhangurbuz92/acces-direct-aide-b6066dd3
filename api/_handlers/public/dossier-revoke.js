import logger from '../../_utils/logger.js';
// @ts-nocheck
import { db } from '../../../src/db/index.js';
import { SharedDiagnostic } from '../../../src/db/schema.js';
import { eq } from 'drizzle-orm';
import { logProAudit } from '../../_utils/auth.js';

/**
 * Dossier Revoke API (Citizen-facing)
 *
 * POST /api/public/dossier-revoke
 *
 * Implements the RGPD "right to be forgotten". When a citizen
 * revokes their shared diagnostic, the link is permanently
 * deleted making E2EE data unrecoverable.
 *
 * Body: { shareId: string }
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const { shareId } = req.body || {};

    if (!shareId) {
        return res.status(400).json({ error: 'shareId requis.' });
    }

    try {
        // Verify it exists first
        const shared = await db.query.SharedDiagnostic.findFirst({
            where: eq(SharedDiagnostic.id, shareId),
        });

        if (!shared) {
            return res.status(404).json({ error: 'Dossier introuvable ou déjà révoqué.' });
        }

        // Delete the shared diagnostic link
        await db.delete(SharedDiagnostic).where(eq(SharedDiagnostic.id, shareId));

        // Audit log — critical legal trace
        const ip = req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
        await logProAudit('DOSSIER_REVOKED_BY_USER', 'citizen', '', {
            shareId,
            revokedAt: new Date().toISOString(),
        }, ip).catch(() => { });

        return res.status(200).json({
            ok: true,
            message: 'Accès révoqué. Vos données chiffrées sont désormais inaccessibles.',
        });
    } catch (error) {
        logger.error('[Revoke] Erreur:', error.message);
        return res.status(500).json({ error: 'Échec de la révocation.' });
    }
}
