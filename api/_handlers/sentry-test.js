import * as Sentry from '@sentry/node';

// Initialize Sentry (Duplicate init is safe/noop if already done, 
// but in Vercel functions, state might not be shared across files easily without a shared util.
// For simplicity in this test file, re-init.)
if (process.env.VITE_SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.VITE_SENTRY_DSN,
        tracesSampleRate: 1.0,
        environment: process.env.VITE_ENV || process.env.VERCEL_ENV || 'development'
    });
}
/**
 * @param {import('../_utils/http-types').ApiRequest} req
 * @param {import('../_utils/http-types').ApiResponse} res
 */

export default async function handler(req, res) {
    if (process.env.VITE_PUBLIC_DIAGNOSTICS !== 'true') {
        return res.status(404).send('Not Found');
    }
    try {
        throw new Error("Sentry Server Test Error: Manually triggered.");
    } catch (error) {
        Sentry.captureException(error);
        // Flush to ensure event is sent before serverless function freezes
        await Sentry.flush(2000);

        return res.status(500).json({
            error: "Manually triggered error reported to Sentry.",
            message: error.message
        });
    }
}
