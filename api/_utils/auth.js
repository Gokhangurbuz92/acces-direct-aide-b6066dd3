
import crypto from 'crypto';

export function verifyAdmin(req) {
    if (!process.env.ADMIN_TOKEN) {
        console.error("FATAL: ADMIN_TOKEN is not set.");
        return false;
    }

    // 1. Check for Authorization header
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false;

    // 2. Extract token
    // Format: "Bearer <token>"
    const token = authHeader.split(' ')[1];

    // Constant-time comparison to prevent timing attacks
    const tokenBuffer = Buffer.from(token);
    const adminTokenBuffer = Buffer.from(process.env.ADMIN_TOKEN);

    if (tokenBuffer.length !== adminTokenBuffer.length) return false;

    return crypto.timingSafeEqual(tokenBuffer, adminTokenBuffer);
};

export const getAuthenticatedUser = async (req) => {
    if (verifyAdmin(req)) {
        return { email: 'admin@system', role: 'admin' };
    }
    return null;
};
