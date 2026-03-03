import logger from '../../../_utils/logger.js';
import { kv } from '../../../_utils/kv.js';
import bcrypt from 'bcryptjs';
import { checkRateLimit } from '../../../_utils/rateLimit.js';
import { logProAudit } from '../../../lib/pro-auth.js';
import prisma from '../../../_utils/prisma.js';
/**
 * @param {import('../../../_utils/http-types').ApiRequest} req
 * @param {import('../../../_utils/http-types').ApiResponse} res
 */

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { token, password } = req.body;
    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const ip = rawIp ? String(rawIp).split(',')[0].trim() : 'unknown';

    if (!token || !password) {
        return res.status(400).json({ error: "Missing fields" });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: "Le mot de passe doit contenir au moins 8 caractères." });
    }

    // Rate Limit
    const limit = await checkRateLimit('RESET_PASSWORD', `ip:${ip}`);
    if (!limit.allowed) {
        return res.status(429).json(limit.error);
    }

    try {
        const key = `reset:${token}`;
        const data = await kv.get(key);

        if (!data) {
            return res.status(400).json({ error: "Lien invalide ou expiré." });
        }

        const { userId } = data;

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.proUser.update({
            where: { id: userId },
            data: { password_hash: hashedPassword }
        });

        await kv.del(key);
        await logProAudit('RESET_SUCCESS', user.id, user.structureId, {}, ip);

        return res.status(200).json({ message: "Mot de passe modifié avec succès." });

    } catch (e) {
        logger.error("Reset Password Error", e);
        return res.status(500).json({ error: "Internal Error" });
    }
}
