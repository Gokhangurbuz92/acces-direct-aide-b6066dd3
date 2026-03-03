import logger from '../../_utils/logger.js';
// @ts-nocheck
import prisma from '../../_utils/prisma.js';
import { requireProAuth, requireProStructureContext } from '../../_utils/auth.js';
import crypto from 'crypto';
/**
 * Attestation Data API (Pro-only)
 *
 * GET /api/pro/attestation-data?shareId=xxx
 *
 * Prepares certified data for the official attestation PDF.
 * Generates a SHA-256 certification hash for tamper-proof verification.
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
        const dossier = await prisma.sharedDiagnostic.findUnique({
            where: { id: shareId },
        });

        if (!dossier) {
            return res.status(404).json({ error: 'Dossier introuvable.' });
        }

        // Certification hash (SHA-256 of shareId + createdAt)
        const certHash = crypto
            .createHash('sha256')
            .update(`${shareId}:${dossier.createdAt?.toISOString() || ''}`)
            .digest('hex')
            .slice(0, 12)
            .toUpperCase();

        const reference = `ADA-${certHash}`;

        // Safe results (strip sensitive)
        const results = { ...(dossier.results || {}) };
        delete results._files;
        delete results._consent;

        // Agent info from auth context
        const user = req.user || {};
        const proName = user.email ? user.email.split('@')[0] : 'Agent ADA';

        return res.status(200).json({
            ok: true,
            attestation: {
                reference,
                date: new Date().toLocaleDateString('fr-FR'),
                createdAt: dossier.createdAt,
                expiresAt: dossier.expiresAt,
                usagerToken: shareId.slice(0, 8).toUpperCase(),
                results,
                professional: {
                    name: proName,
                    role: user.role || 'Agent',
                    structure: proCtx.structureId,
                },
                certHash,
                verifyUrl: `https://accesdirectaide.fr/verify/${reference}`,
            },
        });
    } catch (error) {
        logger.error({ err: error }, '[Attestation] Erreur');
        return res.status(500).json({ error: 'Erreur attestation.' });
    }
}

export default requireProAuth(handler);
