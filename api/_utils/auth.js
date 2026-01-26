
export function verifyAdmin(req) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return false;

    const token = authHeader.split(' ')[1];
    if (!token) return false;

    return token === process.env.ADMIN_TOKEN;
}

export async function getAuthenticatedUser(req) {
    if (verifyAdmin(req)) {
        return { email: 'admin@accesdirectaide.fr', role: 'admin' };
    }
    return null;
}
