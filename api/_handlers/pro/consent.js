import logger from '../../_utils/logger.js';
// @ts-nocheck
import prisma from '../../_utils/prisma.js';
import { requireProAuth } from '../../_utils/auth.js';
import { logProAudit } from '../../_utils/auth.js';
import crypto from 'crypto';
/**
 * Consent API (Pro-authenticated)
 *
 * POST /api/pro/consent
 *
 * Records the citizen's RGPD consent signature before a dossier
 * is shared with a professional. Stores a SHA-256 hash of the
 * signature (not the raw data) for tamper-proof audit compliance.
 *
 * Body:
 * - shareId: SharedDiagnostic ID
 * - signatureData: base64 canvas data URL
 */
async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const { shareId, signatureData } = req.body || {};

    if (!shareId || !signatureData) {
        return res.status(400).json({ error: 'shareId et signatureData requis.' });
    }

    try {
        // 1. Verify dossier exists
        const shared = await prisma.sharedDiagnostic.findUnique({
            where: { id: shareId },
        });

        if (!shared) {
            return res.status(404).json({ error: 'Dossier introuvable.' });
        }

        if (new Date() > new Date(shared.expiresAt)) {
            return res.status(410).json({ error: 'Ce dossier a expiré.' });
        }

        // 2. Create tamper-proof hash of the signature
        const signatureHash = crypto
            .createHash('sha256')
            .update(signatureData)
            .digest('hex');

        const ip = req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
        const ipHash = crypto
            .createHash('sha256')
            .update(ip)
            .digest('hex')
            .substring(0, 16);

        const consentTimestamp = new Date().toISOString();

        // 3. Store consent metadata in results JSON
        const currentResults = shared.results || {};
        const updatedResults = {
            ...currentResults,
            _consent: {
                signed: true,
                signatureHash,
                signedAt: consentTimestamp,
                ipHash,
                expiresAt: shared.expiresAt,
            },
        };

        await prisma.sharedDiagnostic.update({
            where: { id: shareId },
            data: { results: updatedResults },
        });

        // 4. Critical audit log entry (legal proof)
        await logProAudit('CONSENT_SIGNED', 'citizen', '', {
            shareId,
            signatureHash,
            signedAt: consentTimestamp,
            ipHash,
        }, ip);

        return res.status(200).json({
            ok: true,
            signedAt: consentTimestamp,
            signatureHash,
        });
    } catch (error) {
        logger.error({ err: error }, '[Consent] Erreur');
        return res.status(500).json({ error: 'Échec de l\'enregistrement du consentement.' });
    }
}

export default requireProAuth(handler);
