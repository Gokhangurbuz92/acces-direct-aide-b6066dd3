import logger from '../../_utils/logger.js';
// @ts-nocheck
import prisma from '../../_utils/prisma.js';
import { env } from '../../_utils/env.js';
import { requireProAuth, requireProStructureContext } from '../../_utils/auth.js';
import crypto from 'crypto';

/**
 * SI-SIAO Interoperability API (Pro-only)
 *
 * POST /api/pro/interop-siao
 * Body: { shareId }
 *
 * Formats a SharedDiagnostic into the national SI-SIAO standard
 * and logs the transmission in the audit trail.
 *
 * FEATURE FLAG: SIAO_ENABLED must be 'true' for actual network calls.
 * When disabled, returns { status: 'not_configured' }.
 */
async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const proCtx = requireProStructureContext(req, res);
    if (!proCtx) return;

    // Feature flag guard — no SIAO calls when disabled
    const siaoEnabled = env.siao.enabled;
    if (!siaoEnabled) {
        return res.status(200).json({
            ok: false,
            status: 'not_configured',
            message: 'L\'interopérabilité SI-SIAO n\'est pas encore activée. Contactez votre administrateur pour l\'activer.',
        });
    }

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
                emetteur: proCtx.structureId,
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

        // Transmit to SI-SIAO national API (if configured)
        const siaoUrl = env.siao.apiUrl;
        let transmissionStatus = 'LOCAL_ONLY';

        if (siaoUrl) {
            try {
                const siaoRes = await fetch(`${siaoUrl}/v2/demande`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-ADA-Transmission-Id': transmissionId,
                        ...(env.siao.apiKey ? { Authorization: `Bearer ${env.siao.apiKey}` } : {}),
                    },
                    body: JSON.stringify(siaoPayload),
                    signal: AbortSignal.timeout(15000),
                });

                if (siaoRes.ok) {
                    transmissionStatus = 'TRANSMITTED';
                } else {
                    const errText = await siaoRes.text().catch(() => '');
                    logger.error({ status: siaoRes.status, body: errText }, '[SIAO] API error');
                    transmissionStatus = 'FAILED';
                }
            } catch (fetchErr) {
                logger.error({ err: fetchErr }, '[SIAO] Network error');
                transmissionStatus = 'NETWORK_ERROR';
            }
        } else {
            logger.warn({ transmissionId }, '[SIAO] API not configured — logged locally');
        }

        // Audit trail
        await prisma.auditLog.create({
            data: {
                action: 'EXTERNAL_TRANSMISSION_SIAO',
                entityId: shareId,
                entityType: 'DIAGNOSTIC',
                actorId: proCtx.userId,
                details: JSON.stringify({
                    transmissionId,
                    destination: 'SI-SIAO National',
                    transmissionStatus,
                    fieldsExported: Object.keys(siaoPayload.demandeur).length,
                }),
                ipHash: 'SYSTEM_GATEWAY',
            },
        });

        return res.status(200).json({
            ok: true,
            transmissionId,
            transmissionStatus,
            timestamp: siaoPayload.transmission.date,
            destination: 'SI-SIAO National',
        });
    } catch (error) {
        logger.error({ err: error }, '[SIAO] Erreur');
        return res.status(500).json({ error: 'Échec interopérabilité nationale.' });
    }
}

export default requireProAuth(handler);
