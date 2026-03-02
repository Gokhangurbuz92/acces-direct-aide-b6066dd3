// @ts-nocheck
import logger from '../../../_utils/logger.js';
import jwt from 'jsonwebtoken';
import { signProToken, verifyProToken } from '../../../lib/pro-auth.js';
import prisma from '../../../_utils/prisma.js';
import { checkRateLimit, getClientIp } from '../../../_utils/rateLimit.js';
import { env } from '../../../_utils/env.js';

/**
 * POST /api/pro/auth/refresh
 *
 * Accepts a valid OR recently-expired JWT (< 24h) and issues a fresh 8h token.
 * This avoids forcing re-login for active users whose session just expired.
 *
 * Body: { token }  (the current/expired JWT)
 * Returns: { token, user }
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const ip = getClientIp(req);

    // Rate limit refresh attempts
    const limit = await checkRateLimit('REFRESH_PRO', `refresh:${ip}`);
    if (!limit.allowed) {
        return res.status(429).json({ error: 'Trop de tentatives. Réessayez plus tard.' });
    }

    const { token } = req.body || {};
    if (!token) {
        return res.status(400).json({ error: 'Token requis.' });
    }

    const JWT_SECRET = env.secrets.jwtSecret;
    if (!JWT_SECRET) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        // 1. Try verifying normally (still valid)
        const validUser = verifyProToken(token);
        if (validUser) {
            // Token still valid — re-issue
            const user = await prisma.proUser.findUnique({
                where: { id: validUser.userId },
                select: { id: true, email: true, role: true, structureId: true, status: true },
            });

            if (!user || user.status === 'disabled') {
                return res.status(401).json({ error: 'Compte désactivé.' });
            }

            const newToken = signProToken(user);
            return res.status(200).json({
                token: newToken,
                user: { id: user.id, email: user.email, role: user.role, structureId: user.structureId },
            });
        }

        // 2. Token expired — check if < 24h old
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET, {
                algorithms: ['HS256'],
                ignoreExpiration: true, // Allow expired tokens
            });
        } catch {
            return res.status(401).json({ error: 'Token invalide.' });
        }

        if (!decoded || !decoded.userId || !decoded.structureId) {
            return res.status(401).json({ error: 'Token invalide.' });
        }

        // Check expiration window (max 24h grace period)
        const expiredAt = (decoded.exp || 0) * 1000;
        const gracePeriod = 24 * 60 * 60 * 1000; // 24 hours
        if (Date.now() - expiredAt > gracePeriod) {
            return res.status(401).json({ error: 'Session expirée. Veuillez vous reconnecter.' });
        }

        // 3. Verify user still exists and is active
        const user = await prisma.proUser.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, role: true, structureId: true, status: true },
        });

        if (!user || user.status === 'disabled') {
            return res.status(401).json({ error: 'Compte désactivé ou introuvable.' });
        }

        // 4. Issue fresh token
        const newToken = signProToken(user);

        logger.info({ userId: user.id }, '[Auth] Token refreshed');

        return res.status(200).json({
            token: newToken,
            user: { id: user.id, email: user.email, role: user.role, structureId: user.structureId },
        });
    } catch (error) {
        logger.error({ err: error }, '[Auth] Refresh error');
        return res.status(500).json({ error: 'Erreur lors du rafraîchissement.' });
    }
}
