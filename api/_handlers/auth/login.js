/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { email, password } = req.body;

    // Hardcoded check against Environment Variables
    const validEmail = process.env.ADMIN_EMAIL || 'admin@accesdirectaide.fr';
    // If no password set in env, use a default secure-ish placeholder for logic to prevent crash, 
    // but in reality this should satisfy the condition only if env is set.
    // For Staging Audit, user just wants "Security P0".
    const validPassword = process.env.ADMIN_PASSWORD;

    if (!validPassword) {
        return res.status(500).json({ error: 'Server misconfiguration: ADMIN_PASSWORD missing' });
    }

    if (email === validEmail && password === validPassword) {
        // Return the static ADMIN_TOKEN
        // In a real app we'd sign a JWT, but for this "P0 fix" we use the shared secret approach
        // as requested by the plan (Middleware Admin Token).
        // Ensure ADMIN_TOKEN exists
        const token = process.env.ADMIN_TOKEN;

        if (!token) {
            return res.status(500).json({ error: 'Server misconfiguration: ADMIN_TOKEN missing' });
        }

        return res.status(200).json({
            success: true,
            token: token,
            user: { email, role: 'admin' }
        });
    }

    return res.status(401).json({ error: 'Invalid credentials' });
}
