process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.VERCEL_ENV = process.env.VERCEL_ENV || 'test';

// Provide safe defaults for required server secrets in test mode.
// These are NOT production secrets.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.ADA_ENCRYPTION_KEY = process.env.ADA_ENCRYPTION_KEY || '0'.repeat(64);
process.env.CRON_SECRET = process.env.CRON_SECRET || 'test-cron-secret';
process.env.ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'test-admin-token';
process.env.BYPASS_SECRET = process.env.BYPASS_SECRET || 'test-bypass-secret';

// Ensure tests never talk to external KV/Upstash.
process.env.KV_REST_API_URL = '';
process.env.KV_REST_API_TOKEN = '';
process.env.UPSTASH_KV_KV_REST_API_URL = '';
process.env.UPSTASH_KV_KV_REST_API_TOKEN = '';
process.env.UPSTASH_REDIS_REST_URL = '';
process.env.UPSTASH_REDIS_REST_TOKEN = '';

// Silence noisy logs during tests (resilience checks, validation errors)
const originalError = console.error;
const originalWarn = console.warn;

console.error = (...args) => {
    const msg = String(args?.[0] ?? "");
    // Filter out expected errors tested in resilience suites
    if (
        msg.includes("Actualites DB Error (Recovered)") ||
        msg.includes("Unauthorized Pipeline Attempt") ||
        msg.includes("ZodError") ||
        msg.includes("SLOT_TAKEN") ||
        msg.includes("Pipeline: Ingest Structures failed")
    ) {
        return;
    }
    originalError(...args);
};

console.warn = (...args) => {
    originalWarn(...args);
};
