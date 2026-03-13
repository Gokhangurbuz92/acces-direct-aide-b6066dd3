import logger from '../../../_utils/logger.js';
import { verifyPassword } from '../../../_utils/user-auth.js';
import jwt from 'jsonwebtoken';
import { signProToken, logProAudit } from '../../../_utils/auth.js';
import { checkRateLimit, getClientIp, getRateLimitStatus } from '../../../_utils/rateLimit.js';
import { db } from '../../../src/db/index.js';
import { eq } from 'drizzle-orm';
import { env } from '../../../_utils/env.js';
/**
 * @param {import('../../../_utils/http-types').ApiRequest} req
 * @param {import('../../../_utils/http-types').ApiResponse} res
 */

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { email, password } = req.body;
    const ip = getClientIp(req);

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
    }

    // Rate Limit — Dual-key: IP + Email (P2 Bouclier Anti-Brute-Force)
    // LOGIN_PRO: 5 attempts per 15 minutes (configured in rateLimit.js)
    const ipLimit = await checkRateLimit('LOGIN_PRO', `ip:${ip}`);
    if (!ipLimit.allowed) {
        res.setHeader('Retry-After', '900');
        return res.status(getRateLimitStatus(ipLimit)).json(
            ipLimit.error || { error: "Trop de tentatives de connexion. Veuillez patienter 15 minutes." }
        );
    }

    const emailLimit = await checkRateLimit('LOGIN_PRO', `email:${email}`);
    if (!emailLimit.allowed) {
        res.setHeader('Retry-After', '900');
        return res.status(getRateLimitStatus(emailLimit)).json(
            emailLimit.error || { error: "Trop de tentatives pour ce compte. Veuillez patienter 15 minutes." }
        );
    }

    try {
        const targetUser = await db.query.ProUser.findFirst({ where: (u, { eq }) => eq(u.email, email) });

        const authError = () => res.status(401).json({ error: "Invalid credentials" });

        if (!targetUser) {
            await logProAudit('LOGIN_FAILED', 'unknown', 'unknown', { email, reason: 'User not found' }, ip);
            return authError();
        }

        if (targetUser.status !== 'active' && targetUser.status !== 'pending') {
            // If disabled
            await logProAudit('LOGIN_FAILED', targetUser.id, targetUser.structureId, { reason: 'Account disabled' }, ip);
            return res.status(403).json({ error: "Account disabled" });
        }

        const isValid = await verifyPassword(password, targetUser.password_hash);

        if (!isValid) {
            await logProAudit('LOGIN_FAILED', targetUser.id, targetUser.structureId, { reason: 'Bad password' }, ip);
            return authError();
        }

        // --- MFA Challenge ---
        if (targetUser.mfa_enabled && targetUser.mfa_secret) {
            const jwtSecret = env.secrets.jwtSecret;
            if (!jwtSecret) {
                return res.status(500).json({ error: 'Server configuration error' });
            }

            // Issue a short-lived token that can ONLY be used for MFA verification
            const mfaToken = jwt.sign(
                {
                    userId: targetUser.id,
                    email: targetUser.email,
                    structureId: targetUser.structureId,
                    scope: 'mfa_pending',
                },
                jwtSecret,
                { expiresIn: '5m', algorithm: 'HS256' }
            );

            await logProAudit('MFA_CHALLENGE', targetUser.id, targetUser.structureId, {}, ip);

            return res.status(200).json({
                mfa_required: true,
                mfa_token: mfaToken,
            });
        }

        // --- Standard login (no MFA) ---
        const token = signProToken(targetUser);

        await logProAudit('LOGIN_SUCCESS', targetUser.id, targetUser.structureId, {}, ip);

        return res.status(200).json({
            token,
            user: {
                id: targetUser.id,
                email: targetUser.email,
                role: targetUser.role,
                structureId: targetUser.structureId
            }
        });

    } catch (e) {
        logger.error("Login error", e);
        return res.status(500).json({ error: "Login failed" });
    }
}

