import { resolveAuthContext } from '../../_utils/auth.js';
import { env } from '../../_utils/env.js';
/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const auth = resolveAuthContext(req);
    if (!auth) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

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
