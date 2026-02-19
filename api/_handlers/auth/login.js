import { env } from '../../_utils/env.js';
import { signAdminSessionToken } from '../../_utils/auth.js';
import prisma from '../../_utils/prisma.js';
import { checkRateLimit, getRateLimitStatus } from '../../_utils/rateLimit.js';
import {
    buildUserSessionCookie,
    getClientIp,
    isValidEmail,
    normalizeEmail,
    verifyPassword,
    signUserSessionToken,
} from '../../_utils/user-auth.js';

/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const authMode = String(env.auth.mode || 'token').toLowerCase();
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');
    const mode = String(req.body?.mode || '').trim().toLowerCase();

    // Hardcoded check against Environment Variables
    const validEmail = env.secrets.adminEmail || 'admin@accesdirectaide.fr';
    // If no password set in env, use a default secure-ish placeholder for logic to prevent crash, 
    // but in reality this should satisfy the condition only if env is set.
    // For Staging Audit, user just wants "Security P0".
    const validPassword = env.secrets.adminPassword;

    const wantsAdminMode = mode === 'admin';
    const adminCredentialsValid = Boolean(validPassword) && email === validEmail && password === validPassword;

    if (adminCredentialsValid) {
        let token = '';

        if (authMode === 'jwt') {
            try {
                token = signAdminSessionToken({ email, role: 'admin' });
            } catch {
                return res.status(500).json({ error: 'Server misconfiguration: AUTH_SECRET missing for jwt mode' });
            }
        } else {
            token = env.secrets.adminToken || '';
            if (!token) {
                return res.status(500).json({ error: 'Server misconfiguration: ADMIN_TOKEN missing' });
            }
        }

        return res.status(200).json({
            success: true,
            token,
            authMode,
            user: { email, role: 'admin' }
        });
    }

    if (wantsAdminMode) {
        if (!validPassword) {
            return res.status(500).json({ error: 'Server misconfiguration: ADMIN_PASSWORD missing' });
        }
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!isValidEmail(email) || !password) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    const ip = getClientIp(req);
    const ipLimit = await checkRateLimit('LOGIN_USER', `ip:${ip}`);
    if (!ipLimit.allowed) {
        return res.status(getRateLimitStatus(ipLimit)).json(ipLimit.error || { error: 'Too many attempts' });
    }
    const emailLimit = await checkRateLimit('LOGIN_USER', `email:${email}`);
    if (!emailLimit.allowed) {
        return res.status(getRateLimitStatus(emailLimit)).json(emailLimit.error || { error: 'Too many attempts' });
    }

    try {
        const user = await prisma.citizenUser.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const passwordOk = await verifyPassword(password, user.passwordHash);
        if (!passwordOk) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.emailVerifiedAt) {
            return res.status(403).json({
                error: 'Email verification required',
                code: 'EMAIL_NOT_VERIFIED',
            });
        }

        const sessionToken = signUserSessionToken({
            userId: user.id,
            email: user.email,
        });
        res.setHeader('Set-Cookie', buildUserSessionCookie(sessionToken));

        return res.status(200).json({
            success: true,
            session: {
                kind: 'user',
                authType: 'user_cookie',
                role: 'user',
            },
            user: {
                id: user.id,
                role: 'user',
            },
        });
    } catch {
        return res.status(500).json({ error: 'Internal error' });
    }
}
