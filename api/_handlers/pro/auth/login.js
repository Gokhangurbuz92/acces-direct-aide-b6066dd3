import logger from '../../../_utils/logger.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { signProToken, checkRateLimit, logProAudit } from '../../../lib/pro-auth.js';
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

    const { email, password } = req.body;
    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const ip = rawIp ? String(rawIp).split(',')[0].trim() : 'unknown';

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
    }

    // Rate Limit (Check IP and Email)
    const ipLimit = await checkRateLimit(`ip:${ip}`);
    if (!ipLimit.allowed) {
        return res.status(429).json({ error: "Too many attempts. Try again later." });
    }

    // We don't rate limit email before checking existence to avoid DoS on specific accounts?
    // But we need to prevent brute force.
    const emailLimit = await checkRateLimit(`email:${email}`);
    if (!emailLimit.allowed) {
        return res.status(429).json({ error: "Too many attempts for this account." });
    }

    try {
        const users = await prisma.proUser.findMany({ where: { email } });
        const targetUser = users[0]; // Pick first for now.

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

        const isValid = await bcrypt.compare(password, targetUser.password_hash);

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

