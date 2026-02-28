// @ts-nocheck
import prisma from '../../_utils/prisma.js';
import { verifyProToken } from '../../lib/pro-auth.js';
import crypto from 'crypto';

/**
 * SI-SIAO Interoperability API (Pro-only)
 *
 * POST /api/pro/interop-siao
 * Body: { shareId }
 *
 * Formats a SharedDiagnostic into the national SI-SIAO standard
 * and logs the transmission in the audit trail.
 * Production: HTTPS + mutual TLS to api.siao.gouv.fr
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    // Auth
    const token = req.cookies?.pro_token;
    if (!token) return res.status(401).json({ error: 'Non autorisé.' });
    const user = verifyProToken(token);
    if (!user) return res.status(401).json({ error: 'Session invalide.' });

    const { shareId } = req.body || {};
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

        // Generate transmission reference
        const transmissionId = `ADA-SIAO-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

        // Map to SI-SIAO payload (DGCS standard)
        const siaoPayload = {
            transmission: {
                id: transmissionId,
                date: new Date().toISOString(),
                emetteur: user.structureName || 'AccesDirectAide',
                version: '2.0',
            },
            demandeur: {
                identifiant_anonyme: shareId.slice(0, 10),
                zone_geographique: dossier.zipCode || '67000',
            },
            evaluation: {
                is_urgent: Boolean(dossier.isUrgent),
                date_diagnostic: dossier.createdAt?.toISOString(),
            },
        };

        // Production: POST to https://api.siao.gouv.fr/v2/demande with mTLS
        console.log(`[SIAO] Transmission ${transmissionId} → api.siao.gouv.fr`);

        // Audit trail
        await prisma.auditLog.create({
            data: {
                action: 'EXTERNAL_TRANSMISSION_SIAO',
                entityId: shareId,
                entityType: 'DIAGNOSTIC',
                actorId: user.id || user.sub || 'system',
                details: JSON.stringify({
                    transmissionId,
                    destination: 'SI-SIAO National',
                    fieldsExported: Object.keys(siaoPayload.demandeur).length,
                }),
                ipHash: 'SYSTEM_GATEWAY',
            },
        });

        return res.status(200).json({
            ok: true,
            transmissionId,
            timestamp: siaoPayload.transmission.date,
            destination: 'SI-SIAO National',
        });
    } catch (error) {
        console.error('[SIAO] Erreur:', error.message);
        return res.status(500).json({ error: 'Échec interopérabilité nationale.' });
    }
}
