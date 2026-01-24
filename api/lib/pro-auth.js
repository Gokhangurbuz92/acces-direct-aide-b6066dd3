

import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { checkRateLimit as checkRateLimitUtil } from '../_utils/rateLimit.js';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is missing");
}

export const ROLE = {
    SUPERADMIN: 'SUPERADMIN',
    STRUCTURE_ADMIN: 'STRUCTURE_ADMIN',
    PRO: 'PRO'
};

/**
 * Sign a JWT token for a Pro user
 */
export function signProToken(user) {
    return jwt.sign(
        {
            userId: user.id,
            email: user.email,
            structureId: user.structureId,
            role: user.role
        },
        JWT_SECRET,
        { expiresIn: '8h' }
    );
}

/**
 * Verify a JWT token
 */
export function verifyProToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
}

/**
 * Rate limit helper (Backwards Compatibility Wrapper)
 * Uses the consolidated rate limiter in api/_utils/rateLimit.js
 */
export async function checkRateLimit(identifier) {
    const result = await checkRateLimitUtil('LOGIN_PRO', identifier);
    if (!result.allowed) {
        return { allowed: false, remaining: 0 };
    }
    return { allowed: true, remaining: 1 };
}

function hashIp(ip) {
    if (!ip) return 'unknown';
    return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);
}

/**
 * Log audit event
 */
export async function logProAudit(action, actorId, structureId, details, ip) {
    try {
        await prisma.auditLog.create({
            data: {
                action,
                actor_id: actorId, // ProUser ID
                actor: actorId, // Mapping to old field just in case
                entity: 'ProUser', // or target entity
                details: { ...details, structureId },
                ip,
                ip_hash: hashIp(ip)
            }
        });
    } catch (e) {
        console.error("Audit Log Error", e);
    }
}

/**
 * HOF for RBAC
 */
export function requireAuth(handler, allowedRoles = []) {
    return async (req, res) => {
        let token = null;
        if (req.headers && req.headers.authorization) {
            token = req.headers.authorization.replace('Bearer ', '');
        }

        const user = verifyProToken(token);
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
             // SUPERADMIN override
             if (user.role !== ROLE.SUPERADMIN) {
                 return res.status(403).json({ error: 'Forbidden' });
             }
        }

        req.user = user;
        return handler(req, res);
    };
}
