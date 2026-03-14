import logger from '../../_utils/logger.js';
import { db } from '../../../src/db/index.js';
import { Invitation } from '../../../src/db/schema.js';
import { eq, and, isNull } from 'drizzle-orm';
import { logProAudit } from '../../_utils/auth.js';
import { AUTH_ROLE, requireProRole, requireProStructureContext } from '../../_utils/auth.js';
import crypto from 'crypto';

/**
 * Resend Invitation API
 *
 * POST /api/pro/resend-invite  { invitationId }
 * — Regenerates the token, extends expiry, and re-sends the email.
 */
async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const proCtx = requireProStructureContext(req, res);
    if (!proCtx) return;

    const { structureId, userId } = proCtx;
    const { invitationId } = req.body || {};

    if (!invitationId) {
        return res.status(400).json({ error: 'invitationId requis.' });
    }

    try {
        const invitation = await db.query.Invitation.findFirst({
            where: and(
                eq(Invitation.id, invitationId),
                eq(Invitation.structureId, structureId),
                isNull(Invitation.used_at)
            ),
        });

        if (!invitation) {
            return res.status(404).json({ error: 'Invitation introuvable ou déjà utilisée.' });
        }

        // Regenerate token and extend expiry by 7 days
        const newToken = crypto.randomBytes(32).toString('hex');
        const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await db.update(Invitation).set({
            token: newToken,
            expires_at: newExpiry,
        }).where(eq(Invitation.id, invitationId));

        logger.info(`[MOCK EMAIL] Invitation re-sent to ${invitation.email} with new token [REDACTED]`);

        await logProAudit('INVITATION_RESENT', userId, structureId, {
            email: invitation.email,
            invitationId,
        }, req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown');

        return res.status(200).json({ ok: true, email: invitation.email });
    } catch (e) {
        logger.error({ err: e }, '[ResendInvite] Erreur');
        return res.status(500).json({ error: 'Erreur interne.' });
    }
}

export default requireProRole(handler, [AUTH_ROLE.STRUCTURE_ADMIN, AUTH_ROLE.SUPERADMIN]);
