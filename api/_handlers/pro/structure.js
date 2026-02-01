
import prisma from '../../_utils/prisma.js';
import { verifyProToken, ROLE, logProAudit } from '../../lib/pro-auth.js';

export default async function handler(req, res) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Missing token" });
    }

    const decoded = verifyProToken(authHeader.split(' ')[1]);
    if (!decoded) {
        return res.status(401).json({ error: "Invalid token" });
    }

    const { structureId, role, userId } = decoded;
    if (role !== ROLE.STRUCTURE_ADMIN && role !== ROLE.SUPERADMIN) {
        return res.status(403).json({ error: "Forbidden: Admins only" });
    }

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
