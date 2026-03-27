import logger from '../../_utils/logger.js';
import { env } from '../../_utils/env.js';
import { signAdminSessionToken } from '../../_utils/auth.js';
import { db } from '../../../src/db/index.js';
import { AdminUser, CitizenUser } from '../../../src/db/schema.js';
import { eq, sql } from 'drizzle-orm';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
import { checkRateLimit, getRateLimitStatus } from '../../_utils/rateLimit.js';
import { validate } from '../../_utils/validate.js';
import { loginSchema } from '../../_utils/schemas.js';
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
async function loginHandler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const authMode = String(env.auth.mode || 'token').toLowerCase();
    const email = normalizeEmail(req.validatedBody?.email || req.body?.email);
    const password = String(req.validatedBody?.password || req.body?.password || '');
    const mode = String(req.validatedBody?.mode || req.body?.mode || '').trim().toLowerCase();

    // Admin credentials from environment
    const validEmail = env.secrets.adminEmail || 'admin@accesdirectaide.fr';
    const adminPasswordHash = env.secrets.adminPasswordHash; // scrypt:salt:key format
    const adminPasswordLegacy = env.secrets.adminPassword;   // plain text fallback (deprecated)

    const wantsAdminMode = mode === 'admin';

    // Determine admin credential validity
    let adminCredentialsValid = false;
    if (email === validEmail && password) {
        if (adminPasswordHash) {
            // ✅ Secure mode: scrypt hash comparison with timingSafeEqual
            adminCredentialsValid = await verifyPassword(password, adminPasswordHash);
        } else if (adminPasswordLegacy) {
            // ⚠️ Legacy mode: plain text comparison (log warning)
            console.warn('[SECURITY] Admin login using plain-text ADMIN_PASSWORD. Migrate to ADMIN_PASSWORD_HASH (run: node scripts/hash-admin-password.mjs)');
            adminCredentialsValid = password === adminPasswordLegacy;
        }
    }

    if (adminCredentialsValid) {
        // Check if MFA is enabled for this admin
        let adminUser = null;
        try {
            adminUser = await db.query.AdminUser.findFirst({ where: eq(AdminUser.email, email) });
        } catch {
            // If DB unavailable, fall through to token-based auth
        }

        let token = '';

        if (authMode === 'jwt') {
            try {
                // Issue JWT WITHOUT mfa_verified — MFA step required separately
                token = signAdminSessionToken({ email, role: 'admin', mfa_verified: false });
            } catch {
                return res.status(500).json({ error: 'Server misconfiguration: AUTH_SECRET missing for jwt mode' });
            }
        } else {
            token = env.secrets.adminToken || '';
            if (!token) {
                return res.status(500).json({ error: 'Server misconfiguration: ADMIN_TOKEN missing' });
            }
        }

        // If MFA is enabled, return partial auth — client must complete MFA
        if (adminUser?.mfaEnabled) {
            return res.status(200).json({
                success: true,
                token, // Pre-MFA token (no mfa_verified claim)
                authMode,
                mfa_required: true,
                step: 'MFA_VERIFY',
                user: { email, role: 'admin' },
            });
        }

        return res.status(200).json({
            success: true,
            token,
            authMode,
            user: { email, role: 'admin' }
        });
    }

    if (wantsAdminMode) {
        if (!(adminPasswordHash || adminPasswordLegacy)) {
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
        const user = await db.query.CitizenUser.findFirst({
            where: eq(CitizenUser.email, email),
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if account is locked out
        if (user.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
            const remainingMs = new Date(user.lockoutUntil).getTime() - Date.now();
            const remainingMin = Math.ceil(remainingMs / 60000);
            return res.status(423).json({
                error: 'Account temporarily locked',
                code: 'ACCOUNT_LOCKED',
                message: `Trop de tentatives. Réessayez dans ${remainingMin} minute(s).`,
            });
        }

        const passwordOk = await verifyPassword(password, user.passwordHash);
        if (!passwordOk) {
            // Increment failed attempts
            const newAttempts = (user.failedLoginAttempts || 0) + 1;
            const updates = { failedLoginAttempts: newAttempts };

            // Lock account after MAX_FAILED_ATTEMPTS
            if (newAttempts >= MAX_FAILED_ATTEMPTS) {
                updates.lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
            }

            await db.update(CitizenUser)
                .set(updates)
                .where(eq(CitizenUser.id, user.id));

            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.emailVerifiedAt) {
            return res.status(403).json({
                error: 'Email verification required',
                code: 'EMAIL_NOT_VERIFIED',
            });
        }

        // Reset failed attempts on successful login
        if (user.failedLoginAttempts > 0 || user.lockoutUntil) {
            await db.update(CitizenUser)
                .set({ failedLoginAttempts: 0, lockoutUntil: null })
                .where(eq(CitizenUser.id, user.id));
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
    } catch (err) {
        logger.error({ err }, '[login] Authentication failed');
        return res.status(500).json({
            error: 'Erreur interne du serveur',
            _debug: `${err?.constructor?.name}: ${err?.message}`.slice(0, 200),
        });
    }
}

export default validate(loginSchema, loginHandler);
