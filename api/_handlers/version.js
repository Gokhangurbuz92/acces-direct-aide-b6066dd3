export default async function handler(req, res) {
    const debugToken = process.env.DEBUG_TOKEN;
    const requestToken = req.headers['x-debug-token'];

    // Strict security: if DEBUG_TOKEN is not set, disable the endpoint
    if (!debugToken) {
         console.warn("DEBUG_TOKEN not set in environment.");
         return res.status(503).json({ error: 'Debug token not configured on server' });
    }

    if (requestToken !== debugToken) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL;
    let dbHost = 'unknown';
    if (dbUrl) {
        try {
            // Masking: postgres://user:pass@hostname:port/db
            const parsed = new URL(dbUrl);
            const host = parsed.hostname;
            // Show only first 2 chars of host or "lo...st"
            dbHost = host.length > 4 ? `${host.substring(0, 2)}...${host.substring(host.length - 2)}` : 'masked';
        } catch {
            dbHost = 'invalid-url';
        }
    }

    let buildTime = new Date().toISOString();
    try {
        const buildInfo = await import('../_utils/build-info.js');
        if (buildInfo.buildTime) {
            buildTime = buildInfo.buildTime;
        }
    } catch {
        // Fallback to runtime time if build info missing
        console.warn("Could not load build-info.js");
    }

    const info = {
        commitSha: process.env.VERCEL_GIT_COMMIT_SHA || process.env.VITE_GIT_COMMIT_SHA || 'dev',
        buildTime: buildTime,
        vercelEnv: process.env.VERCEL_ENV || process.env.VITE_ENV || 'development',
        effectiveBaseUrl: `https://${req.headers.host}`,
        dbHost: dbHost,
    };

    return res.status(200).json(info);
}
