
import prisma from '../../_utils/prisma.js';
import { verifyProToken, ROLE, logProAudit } from '../../lib/pro-auth.js';
import crypto from 'crypto';
/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

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

    const { email, role: inviteRole } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    try {
        // Check if user already exists in structure
        const existing = await prisma.proUser.findFirst({ where: { structureId, email } });
        if (existing) {
            return res.status(400).json({ error: "User already in team" });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        const invitation = await prisma.invitation.create({
            data: {
                structureId,
                email,
                role: inviteRole || ROLE.PRO,
                token,
                expires_at
            }
        });

        // Mock sending email
        console.log(`[MOCK EMAIL] Invitation sent to ${email} with token ${token}`);

        await logProAudit('INVITATION_SENT', userId, structureId, { email, role: inviteRole }, req.socket.remoteAddress);

        return res.status(201).json(invitation);

    } catch (e) {
        console.error("Invite API Error", e);
        return res.status(500).json({ error: "Internal Error" });
    }
}
