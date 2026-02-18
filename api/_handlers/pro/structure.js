
import prisma from '../../_utils/prisma.js';
import { logProAudit } from '../../lib/pro-auth.js';
import { AUTH_ROLE, requireProRole, requireProStructureContext } from '../../_utils/auth.js';
/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */

async function handler(req, res) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const proCtx = requireProStructureContext(req, res);
    if (!proCtx) return;

    const { structureId, userId } = proCtx;

    const { summary_falc, is_pro_enabled } = req.body;

    try {
        const updated = await prisma.structure.update({
            where: { id: structureId },
            data: {
                summary_falc,
                is_pro_enabled
            }
        });

        await logProAudit('STRUCTURE_UPDATED', userId, structureId, { is_pro_enabled }, req.socket.remoteAddress);
        return res.status(200).json(updated);

    } catch (e) {
        console.error("Structure Settings API Error", e);
        return res.status(500).json({ error: "Internal Error" });
    }
}

export default requireProRole(handler, [AUTH_ROLE.STRUCTURE_ADMIN, AUTH_ROLE.SUPERADMIN]);
