import logger from "../../_utils/logger.js";
// @ts-nocheck
import prisma from '../../_utils/prisma.js';

/**
 * Citizen Passport API (Public)
 *
 * GET /api/public/passport?shareId=xxx
 *
 * Returns the citizen's shared diagnostic info + upcoming appointments.
 * No auth — the shareId acts as a bearer token for the citizen.
 */
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const url = new URL(req.url || '/', `https://${req.headers?.host || 'localhost'}`);
    const shareId = url.searchParams.get('shareId');

    if (!shareId) {
        return res.status(400).json({ error: 'shareId requis.' });
    }

    try {
        const shared = await prisma.sharedDiagnostic.findUnique({
            where: { id: shareId },
        });

        if (!shared) {
            return res.status(404).json({ error: 'Dossier introuvable ou expiré.' });
        }

        const isExpired = new Date() > new Date(shared.expiresAt);

        // Find appointments for this citizen
        let appointments = [];
        if (shared.citizenUserId) {
            appointments = await prisma.proAppointment.findMany({
                where: {
                    citizenUserId: shared.citizenUserId,
                    startAt: { gte: new Date() },
                    status: { not: 'cancelled' },
                },
                select: {
                    id: true,
                    startAt: true,
                    endAt: true,
                    status: true,
                    service: { select: { label: true, mode: true } },
                    createdByProUser: { select: { firstName: true, lastName: true } },
                },
                orderBy: { startAt: 'asc' },
                take: 5,
            });
        }

        const consent = shared.results?._consent || null;

        return res.status(200).json({
            ok: true,
            passport: {
                shareId: shared.id,
                createdAt: shared.createdAt,
                expiresAt: shared.expiresAt,
                isExpired,
                hasConsent: !!consent?.signed,
                consentDate: consent?.signedAt || null,
                filesCount: (shared.results?._files || []).length,
                appointments: appointments.map((a) => ({
                    id: a.id,
                    date: a.startAt,
                    endAt: a.endAt,
                    status: a.status,
                    service: a.service?.label || 'Consultation',
                    mode: a.service?.mode || 'visio',
                    professional: a.createdByProUser
                        ? `${a.createdByProUser.firstName} ${(a.createdByProUser.lastName || '')[0]}.`
                        : 'Agent ADA',
                })),
            },
        });
    } catch (error) {
        logger.error('[Passport] Erreur:', error.message);
        return res.status(500).json({ error: 'Erreur interne.' });
    }
}
