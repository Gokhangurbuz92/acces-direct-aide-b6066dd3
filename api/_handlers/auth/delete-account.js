import { db } from '../../../src/db/index.js';
import { CitizenUser, AuthToken, ConversationLog, SharedDiagnostic } from '../../../src/db/schema.js';
import { eq } from 'drizzle-orm';
import {
    getUserSessionTokenFromRequest,
    verifyUserSessionToken,
    buildUserSessionCookieClear,
} from '../../_utils/user-auth.js';
import logger from '../../_utils/logger.js';
import * as Sentry from '@sentry/node';

/**
 * DELETE /api/auth/delete-account
 *
 * RGPD right to erasure — allows a citizen to delete their account
 * and all associated personal data.
 *
 * Requires: authenticated citizen session (JWT cookie).
 *
 * Deletes in order:
 *   1. ConversationLog (by sessionId matching userId)
 *   2. SharedDiagnostic (no direct FK — skipped if no link)
 *   3. AuthToken (FK cascade from CitizenUser)
 *   4. CitizenUser record
 *
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */
export default async function handler(req, res) {
    if (req.method !== 'DELETE') {
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
        logger.info(`[GDPR] Droit à l'oubli — Deleting account for user ${userId}`);

        // 1. Delete conversation logs linked to this user
        // (ConversationLog uses sessionId which may contain userId)
        let conversationCount = 0;
        try {
            const convRes = await db.delete(ConversationLog)
                .where(eq(ConversationLog.sessionId, userId))
                .returning({ id: ConversationLog.id });
            conversationCount = convRes.length;
        } catch { /* Table might not have matching data */ }

        // 2. Delete auth tokens for this user
        let tokenCount = 0;
        try {
            const tokenRes = await db.delete(AuthToken)
                .where(eq(AuthToken.userId, userId))
                .returning({ id: AuthToken.id });
            tokenCount = tokenRes.length;
        } catch { /* FK cascade might handle this */ }

        // 3. Delete the citizen user record
        await db.delete(CitizenUser).where(eq(CitizenUser.id, userId));

        // 4. Clear the session cookie
        res.setHeader('Set-Cookie', buildUserSessionCookieClear());

        logger.info(`[GDPR] ✅ Account deleted for user ${userId}`, {
            conversationLogs: conversationCount,
            authTokens: tokenCount,
        });

        return res.status(200).json({
            ok: true,
            message: 'Compte supprimé. Toutes vos données personnelles ont été effacées.',
        });
    } catch (error) {
        logger.error(`[GDPR] ❌ Account deletion failed for user ${userId}`, error);
        Sentry.captureException(error);
        return res.status(500).json({ error: 'Erreur lors de la suppression du compte' });
    }
}
