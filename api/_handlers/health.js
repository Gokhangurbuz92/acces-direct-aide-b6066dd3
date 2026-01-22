// ROBUST HEALTH CHECK
// Designed to NEVER crash (HTTP 500), always return JSON.
// NO EXTERNAL DEPENDENCIES

export default async function handler(req, res) {
    const start = Date.now();

    // Response Structure (Lot 9.1 compliant)
    const status = {
        ok: false,
        core: {
            runtime: 'ok',
            postgres: 'unknown'
        },
        optional: {
            sentry: 'unknown'
        },
        version: process.env.VERCEL_GIT_COMMIT_SHA || process.env.npm_package_version || 'unknown',
        time: new Date().toISOString()
    };

    try {
        // 1. Sentry (Optional)
        if (process.env.VITE_SENTRY_DSN) {
            try {
                const Sentry = await import('@sentry/node');
                Sentry.init({
                    dsn: process.env.VITE_SENTRY_DSN,
                    tracesSampleRate: 1.0,
                    environment: process.env.VITE_ENV || process.env.VERCEL_ENV || 'development'
                });
                status.optional.sentry = 'ok';
            } catch (e) {
                console.error("Health: Sentry Init Failed", e);
                status.optional.sentry = 'fail';
            }
        } else {
            status.optional.sentry = 'skipped';
        }

        // 2. Postgres (Prisma) - Core dependency
        if (process.env.DATABASE_URL) {
            status.core.postgres = 'checking';
            try {
                const pkg = await import('@prisma/client');
                const { PrismaClient } = pkg.default || pkg;
                const prisma = new PrismaClient();
                await prisma.$queryRaw`SELECT 1`;
                await prisma.$disconnect();
                status.core.postgres = 'ok';
            } catch (e) {
                console.error("Health: Postgres Failed", e);
                status.core.postgres = 'fail';
            }
        } else {
            status.core.postgres = 'skipped';
        }

        // Global Success: service is up
        status.ok = true;

    } catch (globalError) {
        console.error("Health: Critical Global Error", globalError);
        status.ok = false;
        status.error = globalError.message;
    }

    status.duration_ms = Date.now() - start;

    return res.status(200).json(status);
}
