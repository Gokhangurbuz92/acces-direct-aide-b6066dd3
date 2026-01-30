import { requireAuth } from '../../lib/pro-auth.js';
import prisma from '../../_utils/prisma.js';

async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const user = await prisma.proUser.findUnique({
            where: { id: req.user.userId },
            include: { structure: true }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Return user + structure (scrub password)
        const { password_hash, ...safeUser } = user;

        return res.status(200).json({
            user: safeUser,
            structure: user.structure
        });

    } catch (e) {
        console.error("Me API Error", e);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export default requireAuth(handler);
