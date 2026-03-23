import { db } from '../../../src/db/index.js';
import { CitizenUser, AuthToken, ConversationLog, SharedDiagnostic, ProAppointment } from '../../../src/db/schema.js';
import { eq } from 'drizzle-orm';
import {
    getUserSessionTokenFromRequest,
    verifyUserSessionToken,
} from '../../_utils/user-auth.js';
import logger from '../../_utils/logger.js';
import * as Sentry from '@sentry/node';

/**
 * GET /api/auth/export-data
 *
 * RGPD right to data portability — allows a citizen to download
 * all their personal data in JSON format.
 *
 * Requires: authenticated citizen session (JWT cookie).
 *
 * Exports:
 *   - CitizenUser profile (email, phone, timestamps — no passwordHash)
 *   - ConversationLog entries
 *   - SharedDiagnostic entries
 *   - ProAppointment entries
 *   - AuthToken metadata (creation dates, no hashes)
 *
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Authenticate citizen
    const token = getUserSessionTokenFromRequest(req);
    const session = verifyUserSessionToken(token);

    if (!session || !session.userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const { userId } = session;

    try {
        logger.info(`[GDPR] Export de données demandé par l'utilisateur ${userId}`);

        // 1. Fetch user profile (exclude passwordHash)
        const user = await db.query.CitizenUser.findFirst({
            where: eq(CitizenUser.id, userId),
        });

        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        const { passwordHash, ...userProfile } = user;

        // 2. Fetch related data in parallel
        const [conversations, diagnostics, appointments, tokens] = await Promise.all([
            db.query.ConversationLog.findMany({
                where: eq(ConversationLog.sessionId, userId),
                orderBy: (cl, { desc }) => [desc(cl.createdAt)],
            }).catch(() => []),
            db.query.SharedDiagnostic.findMany({
                where: eq(SharedDiagnostic.userId, userId),
            }).catch(() => []),
            db.query.ProAppointment.findMany({
                where: eq(ProAppointment.citizenUserId, userId),
                orderBy: (pa, { desc }) => [desc(pa.createdAt)],
            }).catch(() => []),
            db.query.AuthToken.findMany({
                where: eq(AuthToken.userId, userId),
                columns: { id: true, type: true, expiresAt: true, usedAt: true, createdAt: true },
            }).catch(() => []),
        ]);

        const exportData = {
            exportInfo: {
                exportedAt: new Date().toISOString(),
                userId,
                format: 'RGPD Article 20 — Droit à la portabilité',
            },
            profile: userProfile,
            conversations,
            diagnostics,
            appointments,
            authTokens: tokens,
        };

        // Set content disposition for download
        const filename = `export-donnees-${new Date().toISOString().slice(0, 10)}.json`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');

        logger.info(`[GDPR] ✅ Export réussi pour l'utilisateur ${userId}`, {
            conversations: conversations.length,
            diagnostics: diagnostics.length,
            appointments: appointments.length,
            authTokens: tokens.length,
        });

        return res.status(200).json(exportData);
    } catch (error) {
        logger.error(`[GDPR] ❌ Export failed for user ${userId}`, error);
        Sentry.captureException(error);
        return res.status(500).json({ error: 'Erreur lors de l\'export des données' });
    }
}
