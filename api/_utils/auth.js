export const verifyAdmin = (req) => {
    // 1. Check for Authorization header
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader) return false;

    // 2. Extract token
    // Format: "Bearer <token>"
    const token = authHeader.split(' ')[1];
    if (!token) return false;

    // 3. Validate against Environment Variable
    // If ADMIN_TOKEN is not set in env, we fail closed (secure by default)
    if (!process.env.ADMIN_TOKEN) {
        console.error("CRITICAL: ADMIN_TOKEN is not defined in environment variables.");
        return false;
    }

    return token === process.env.ADMIN_TOKEN;
};

export const getAuthenticatedUser = async (req) => {
    if (verifyAdmin(req)) {
        return { email: 'admin@system', role: 'admin' };
    }
    return null;
};
