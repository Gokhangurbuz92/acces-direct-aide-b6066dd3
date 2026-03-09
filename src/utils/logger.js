export const aiLogger = {
    info: (msg, meta) => console.log(`[AI INFO] ${msg}`, meta || ''),
    error: (msg, meta) => console.error(`[AI ERROR] ${msg}`, meta || ''),
    warn: (msg, meta) => console.warn(`[AI WARN] ${msg}`, meta || '')
};

export const logger = aiLogger;
