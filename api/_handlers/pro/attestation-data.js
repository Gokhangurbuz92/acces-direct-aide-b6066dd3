// @ts-nocheck
import prisma from '../../_utils/prisma.js';
import { verifyProToken } from '../../lib/pro-auth.js';
import crypto from 'crypto';

/**
 * Attestation Data API (Pro-only)
 *
 * GET /api/pro/attestation-data?shareId=xxx
 *
 * Prepares certified data for the official attestation PDF.
 * Generates a SHA-256 certification hash for tamper-proof verification.
 */
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    // Auth
    const token = req.cookies?.pro_token;
    if (!token) return res.status(401).json({ error: 'Non autorisé.' });
    const user = verifyProToken(token);
    if (!user) return res.status(401).json({ error: 'Session invalide.' });

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

        // Agent info from auth token
        const proName = user.firstName
            ? `${user.firstName} ${(user.lastName || '')[0]}.`
            : 'Agent ADA';

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
                    structure: user.structureName || 'AccesDirectAide',
                },
                certHash,
                verifyUrl: `https://accesdirectaide.fr/verify/${reference}`,
            },
        });
    } catch (error) {
        console.error('[Attestation] Erreur:', error.message);
        return res.status(500).json({ error: 'Erreur attestation.' });
    }
}
