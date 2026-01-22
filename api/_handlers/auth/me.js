import { verifyAdmin } from '../../_utils/auth.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!verifyAdmin(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // If verification passes, return user info
    // Since we use a static token, we assume the user is the generic admin
    return res.status(200).json({
        user: {
            email: process.env.ADMIN_EMAIL || 'admin@accesdirectaide.fr',
            role: 'admin'
        }
    });
}
