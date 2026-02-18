
import prisma from '../../_utils/prisma.js';
import { logProAudit } from '../../lib/pro-auth.js';
import { AUTH_ROLE, requireProRole, requireProStructureContext } from '../../_utils/auth.js';
/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */

async function handler(req, res) {
    const proCtx = requireProStructureContext(req, res);
    if (!proCtx) return;

    const { structureId, userId } = proCtx;

    try {
        if (req.method === 'GET') {
            // List users + pending invitations
            const users = await prisma.proUser.findMany({
                where: { structureId },
                select: { id: true, email: true, role: true, status: true, createdAt: true }
            });

            const invitations = await prisma.invitation.findMany({
                where: { structureId, used_at: null }
            });

            return res.status(200).json({ users, invitations });

        } else if (req.method === 'DELETE') {
            // Disable user (Soft delete or status change)
            // Query param: userId
            const { userId: targetUserId } = req.query;

            if (!targetUserId) return res.status(400).json({ error: "Missing userId" });
            if (targetUserId === userId) return res.status(400).json({ error: "Cannot disable yourself" });

            const targetUser = await prisma.proUser.findFirst({ where: { id: targetUserId, structureId } });
            if (!targetUser) return res.status(404).json({ error: "User not found" });

            await prisma.proUser.update({
                where: { id: targetUserId },
                data: { status: 'disabled' }
            });

            await logProAudit('USER_DISABLED', userId, structureId, { targetUserId }, req.socket.remoteAddress);
            return res.status(200).json({ success: true });
        } else {
            return res.status(405).json({ error: "Method not allowed" });
        }
    } catch (e) {
        console.error("Team API Error", e);
        return res.status(500).json({ error: "Internal Error" });
    }
}

export default requireProRole(handler, [AUTH_ROLE.STRUCTURE_ADMIN, AUTH_ROLE.SUPERADMIN]);
