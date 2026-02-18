import { env } from '../../_utils/env.js';
import { signAdminSessionToken } from '../../_utils/auth.js';

/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const authMode = String(env.auth.mode || 'token').toLowerCase();
    const { email, password } = req.body;

    // Hardcoded check against Environment Variables
    const validEmail = env.secrets.adminEmail || 'admin@accesdirectaide.fr';
    // If no password set in env, use a default secure-ish placeholder for logic to prevent crash, 
    // but in reality this should satisfy the condition only if env is set.
    // For Staging Audit, user just wants "Security P0".
    const validPassword = env.secrets.adminPassword;

    if (!validPassword) {
        return res.status(500).json({ error: 'Server misconfiguration: ADMIN_PASSWORD missing' });
    }

    if (email === validEmail && password === validPassword) {
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

    return res.status(401).json({ error: 'Invalid credentials' });
}
