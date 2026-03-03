import logger from '../../../_utils/logger.js';
import prisma from '../../../_utils/prisma.js';
import { signProToken, logProAudit } from '../../../lib/pro-auth.js';
import { checkRateLimit, getClientIp } from '../../../_utils/rateLimit.js';
import { verifyCode } from '../../../lib/totp.js';
import { verifyJwt } from '../../../lib/pro-auth.js';
import { env } from '../../../_utils/env.js';

/**
 * MFA Verify handler — second step of MFA login
 *
 * POST /api/pro/auth/mfa-verify
 * Body: { mfa_token: string, code: string }
 *
 * The mfa_token is a short-lived JWT (5min) issued by login.js
 * when the user has MFA enabled. This handler verifies the TOTP
 * code and issues the real pro JWT on success.
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { mfa_token, code } = req.body || {};
    const ip = getClientIp(req);

    if (!mfa_token || !code) {
        return res.status(400).json({ error: 'mfa_token and code are required' });
    }

    if (String(code).length !== 6) {
        return res.status(400).json({ error: 'Code must be 6 digits' });
    }

    // Rate limit by IP
    const limit = await checkRateLimit('MFA_VERIFY_PRO', `ip:${ip}`);
    if (!limit.allowed) {
        return res.status(429).json(limit.error || { error: 'Too many attempts. Try again later.' });
    }

    try {
        // Verify the temporary MFA token
        const jwtSecret = env.secrets.jwtSecret;
        if (!jwtSecret) {
            return res.status(500).json({ error: 'Server configuration error' });
        }

        let payload;
        try {
            payload = verifyJwt(mfa_token, jwtSecret, { algorithms: ['HS256'] });
        } catch {
            return res.status(401).json({ error: 'MFA token expired or invalid. Please login again.' });
        }

        if (payload?.scope !== 'mfa_pending') {
            return res.status(401).json({ error: 'Invalid token scope' });
        }

        // Load user with MFA secret
        const user = await prisma.proUser.findUnique({
            where: { id: payload.userId },
        });

        if (!user || !user.mfa_enabled || !user.mfa_secret) {
            return res.status(401).json({ error: 'MFA not configured for this account' });
        }

        // Verify the TOTP code
        const valid = verifyCode(user.mfa_secret, String(code));
        if (!valid) {
            await logProAudit('MFA_VERIFY_FAILED', user.id, user.structureId, { reason: 'Bad code' }, ip);
            return res.status(401).json({ error: 'Invalid verification code' });
        }

        // Issue the real pro token
        const token = signProToken(user);

        await logProAudit('LOGIN_SUCCESS', user.id, user.structureId, { mfa: true }, ip);

        return res.status(200).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                structureId: user.structureId,
            },
        });
    } catch (e) {
        logger.error('MFA verify error', e);
        return res.status(500).json({ error: 'MFA verification failed' });
    }
}
