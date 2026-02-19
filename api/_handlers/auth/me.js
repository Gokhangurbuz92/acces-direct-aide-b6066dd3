import { resolveAuthContext } from '../../_utils/auth.js';
import { env } from '../../_utils/env.js';
import prisma from '../../_utils/prisma.js';
import { getUserSessionTokenFromRequest, verifyUserSessionToken } from '../../_utils/user-auth.js';
/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const auth = resolveAuthContext(req);
    if (auth) {
        if (auth.authType === 'pro_jwt') {
            return res.status(200).json({
                session: {
                    kind: 'pro',
                    authType: auth.authType,
                    role: auth.role,
                },
                user: {
                    id: auth.userId || null,
                    email: auth.email || null,
                    role: auth.role,
                    structureId: auth.structureId || null,
                    authType: auth.authType,
                },
            });
        }

        return res.status(200).json({
            session: {
                kind: 'admin',
                authType: auth.authType,
                role: auth.role,
            },
            user: {
                id: 'admin',
                email: auth.email || env.secrets.adminEmail || 'admin@accesdirectaide.fr',
                role: auth.role,
                authType: auth.authType,
            },
        });
    }

    const sessionToken = getUserSessionTokenFromRequest(req);
    const userClaims = verifyUserSessionToken(sessionToken);
    if (!userClaims) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.citizenUser.findUnique({
        where: { id: userClaims.userId },
        select: {
            id: true,
            email: true,
            emailVerifiedAt: true,
        },
    });
    if (!user || !user.emailVerifiedAt || normalizeEmail(user.email) !== normalizeEmail(userClaims.email)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.status(200).json({
        session: {
            kind: 'user',
            authType: 'user_cookie',
            role: 'user',
        },
        user: {
            id: user.id,
            email: user.email,
            role: 'user',
            emailVerified: true,
            authType: 'user_cookie',
        },
    });
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
}
