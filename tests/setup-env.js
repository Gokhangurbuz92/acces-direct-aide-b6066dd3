process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-CHANGE-ME';

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
