
import jwt from 'jsonwebtoken';
import { kv } from '@vercel/kv';
import { PrismaClient } from '@prisma/client';

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
    } catch (e) {
        return null;
    }
}

/**
 * Rate limit helper using Vercel KV
 * Limit: 5 attempts per 15 minutes per IP or Email
 */
export async function checkRateLimit(identifier) {
    if (!process.env.KV_REST_API_URL) {
        console.warn("KV_REST_API_URL not set, skipping rate limit (Dev mode)");
        return { allowed: true };
    }

    const key = `ratelimit:login:${identifier}`;
    try {
        const attempts = await kv.incr(key);
        if (attempts === 1) {
            await kv.expire(key, 15 * 60); // 15 min window
        }

        if (attempts > 5) {
            return { allowed: false, remaining: 0 };
        }

        return { allowed: true, remaining: 5 - attempts };
    } catch (e) {
        console.error("KV Error", e);
        return { allowed: true }; // Fail open if KV is down
    }
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
                // ip_hash: hash(ip) // TODO: user requested hash
            }
        });
    } catch (e) {
        console.error("Audit Log Error", e);
    }
}
