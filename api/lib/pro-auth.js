
import jwt from 'jsonwebtoken';
import prisma from '../_utils/prisma.js';
import crypto from 'crypto';
import { checkRateLimit as checkRateLimitUtil } from '../_utils/rateLimit.js';
import { env } from '../_utils/env.js';

/** @typedef {import('../_utils/http-types').ApiRequest} ApiRequest */
/** @typedef {import('../_utils/http-types').ApiResponse} ApiResponse */

function getJwtSecret() {
    return env.secrets.jwtSecret;
}

export const ROLE = {
    SUPERADMIN: 'SUPERADMIN',
    STRUCTURE_ADMIN: 'STRUCTURE_ADMIN',
    PRO: 'PRO'
};

/**
 * Sign a JWT token for a Pro user
 */
/** @param {any} user */
export function signProToken(user) {
    const JWT_SECRET = getJwtSecret();
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is missing");
    }

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
// ... (rest is same)

// ...

/**
 * Verify a JWT token
 * Hardened: Enforce HS256 to prevent algorithm confusion attacks
 */
/** @param {string} token */
export function verifyProToken(token) {
    const JWT_SECRET = getJwtSecret();
    if (!JWT_SECRET) return null;

    try {
        return jwt.verify(token, JWT_SECRET, {
            algorithms: ['HS256']
        });
    } catch {
        return null;
    }
}

/**
 * Rate limit helper (Backwards Compatibility Wrapper)
 * Uses the consolidated rate limiter in api/_utils/rateLimit.js
 */
/** @param {string} identifier */
export async function checkRateLimit(identifier) {
    const result = await checkRateLimitUtil('LOGIN_PRO', identifier);
    if (!result.allowed) {
        return { allowed: false, remaining: 0 };
    }
    return { allowed: true, remaining: 1 };
}

/** @param {string} ip */
function hashIp(ip) {
    if (!ip) return 'unknown';
    return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);
}

/**
 * Log audit event
 */
/** @param {string} action @param {string} actorId @param {string} structureId @param {any} details @param {string} ip */
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
/** @param {(req: ApiRequest, res: ApiResponse) => any} handler @param {string[]=} allowedRoles */
export function requireAuth(handler, allowedRoles = []) {
    /** @param {ApiRequest} req @param {ApiResponse} res */
    async function wrapped(req, res) {
        let token = null;
        const authHeader = req.headers?.authorization || "";
        const match = authHeader.match(/^Bearer\s+(.+)$/i);

        if (match) {
            token = match[1];
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
    }

    return wrapped;
}
