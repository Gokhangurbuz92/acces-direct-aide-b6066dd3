import { kv } from '../../../_utils/kv.js';
import crypto from 'crypto';
import { checkRateLimit } from '../../../_utils/rateLimit.js';
import { logProAudit } from '../../../lib/pro-auth.js';
import prisma from '../../../_utils/prisma.js';
import { env } from '../../../_utils/env.js';
/**
 * @param {import('../../../_utils/http-types').ApiRequest} req
 * @param {import('../../../_utils/http-types').ApiResponse} res
 */

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { email } = req.body;
    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const ip = rawIp ? String(rawIp).split(',')[0].trim() : 'unknown';

    if (!email) {
        return res.status(400).json({ error: "Email required" });
    }

    // Rate Limit
    const limit = await checkRateLimit('RESET_PASSWORD', `ip:${ip}`);
    if (!limit.allowed) {
        return res.status(429).json(limit.error);
    }

    try {
        const user = await prisma.proUser.findFirst({
            where: { email }
        });

        if (!user) {
            // Fake success to prevent enumeration
            return res.status(200).json({ message: "Si cet email existe, un lien a été envoyé." });
        }

        // Generate Token
        const token = crypto.randomBytes(32).toString('hex');
        const key = `reset:${token}`;

        // Store in KV for 1 hour
        await kv.set(key, { userId: user.id, email: user.email }, { ex: 3600 });

        // Mock Email
        const baseUrl = env.runtime.appBaseUrl || 'http://localhost:3000';
        const resetLink = `${baseUrl}/pro/reset-password?token=${token}`;
        // Avoid logging sensitive reset tokens.
        console.log(`[MOCK EMAIL] To: ${email} | Subject: Reset Password | Link: [REDACTED]`);

        await logProAudit('RESET_REQUESTED', user.id, user.structureId, {}, ip);

        return res.status(200).json({ message: "Si cet email existe, un lien a été envoyé." });

    } catch (e) {
        console.error("Forgot Password Error", e);
        return res.status(500).json({ error: "Internal Error" });
    }
}
