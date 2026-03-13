import logger from '../../_utils/logger.js';
import { db } from '../../../src/db/index.js';
import { ProUser, Invitation } from '../../../src/db/schema.js';
import { eq, and, isNull } from 'drizzle-orm';
import { ROLE, logProAudit } from '../../_utils/auth.js';
import { AUTH_ROLE, requireProRole, requireProStructureContext } from '../../_utils/auth.js';
import crypto from 'crypto';
/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */

async function handler(req, res) {
    if (req.method !== 'POST' && req.method !== 'DELETE') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const proCtx = requireProStructureContext(req, res);
    if (!proCtx) return;

    const { structureId, userId } = proCtx;

    // ── DELETE: Cancel a pending invitation ──
    if (req.method === 'DELETE') {
        const url = new URL(req.url || '/', `https://${req.headers?.host || 'localhost'}`);
        const invitationId = url.searchParams.get('id') || req.query?.id;

        if (!invitationId) {
            return res.status(400).json({ error: 'id requis.' });
        }

        try {
            const invitation = await db.query.Invitation.findFirst({
                where: and(
                    eq(Invitation.id, invitationId),
                    eq(Invitation.structureId, structureId),
                    isNull(Invitation.used_at)
                )
            });

            if (!invitation) {
                return res.status(404).json({ error: 'Invitation introuvable.' });
            }

            await db.delete(Invitation).where(eq(Invitation.id, invitationId));

            await logProAudit('INVITATION_CANCELLED', userId, structureId, {
                email: invitation.email,
                invitationId,
            }, req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown');

            return res.status(200).json({ ok: true });
        } catch (e) {
            logger.error({ err: e }, '[Invite] Cancel error');
            return res.status(500).json({ error: 'Erreur interne.' });
        }
    }

    // ── POST: Create invitation ──

    const { email, role: inviteRole } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    try {
        // Check if user already exists in structure
        const existing = await db.query.ProUser.findFirst({
            where: and(eq(ProUser.structureId, structureId), eq(ProUser.email, email))
        });
        if (existing) {
            return res.status(400).json({ error: "User already in team" });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        const [invitation] = await db.insert(Invitation).values({
                structureId,
                email,
                role: inviteRole || ROLE.PRO,
                token,
                expires_at
        }).returning();

        // Mock sending email (token intentionally redacted in logs)
        logger.info(`[MOCK EMAIL] Invitation sent to ${email} with token [REDACTED]`);

        await logProAudit('INVITATION_SENT', userId, structureId, { email, role: inviteRole }, req.socket.remoteAddress);

        return res.status(201).json(invitation);

    } catch (e) {
        logger.error("Invite API Error", e);
        return res.status(500).json({ error: "Internal Error" });
    }
}

export default requireProRole(handler, [AUTH_ROLE.STRUCTURE_ADMIN, AUTH_ROLE.SUPERADMIN]);
