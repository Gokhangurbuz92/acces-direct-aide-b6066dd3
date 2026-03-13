import logger from '../../_utils/logger.js';
// @ts-nocheck
import { db } from '../../../src/db/index.js';
import { SharedDiagnostic, ProAppointment } from '../../../src/db/schema.js';
import { eq, and, gte, ne } from 'drizzle-orm';

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
        const shared = await db.query.SharedDiagnostic.findFirst({
            where: eq(SharedDiagnostic.id, shareId),
        });

        if (!shared) {
            return res.status(404).json({ error: 'Dossier introuvable ou expiré.' });
        }

        const isExpired = new Date() > new Date(shared.expiresAt);

        // Find appointments for this citizen
        let appointments = [];
        if (shared.citizenUserId) {
            appointments = await db.query.ProAppointment.findMany({
                where: and(
                    eq(ProAppointment.citizenUserId, shared.citizenUserId),
                    gte(ProAppointment.startAt, new Date()),
                    ne(ProAppointment.status, 'cancelled')
                ),
                columns: {
                    id: true,
                    startAt: true,
                    endAt: true,
                    status: true,
                },
                with: {
                    service: { columns: { label: true, mode: true } },
                    createdByProUser: { columns: { firstName: true, lastName: true } },
                },
                orderBy: (pa, { asc }) => [asc(pa.startAt)],
                limit: 5,
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
