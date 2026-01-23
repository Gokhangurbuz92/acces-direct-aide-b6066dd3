export default async function handler(req, res) {
    const sha = process.env.VERCEL_GIT_COMMIT_SHA || 'dev';
    const version = process.env.npm_package_version || 'unknown';

    return res.status(200).json({
        version,
        sha,
        env: process.env.VERCEL_ENV || 'development'
    });
}
