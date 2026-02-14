
import crypto from 'crypto';
import { env } from './env.js';

export function verifyAdmin(req) {
    const adminToken = env.secrets.adminToken;
    if (!adminToken) {
        console.error("FATAL: ADMIN_TOKEN is not set.");
        return false;
    }

    // 1. Check for Authorization header
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false;

    const token = authHeader.split(' ')[1];

    // Constant-time comparison to prevent timing attacks
    const tokenBuffer = Buffer.from(token);
    const adminTokenBuffer = Buffer.from(adminToken);

    if (tokenBuffer.length !== adminTokenBuffer.length) return false;

    return crypto.timingSafeEqual(tokenBuffer, adminTokenBuffer);
};

export async function getAuthenticatedUser(req) {
    if (verifyAdmin(req)) {
        return { email: 'admin@accesdirectaide.fr', role: 'admin' };
    }
    return null;
}
