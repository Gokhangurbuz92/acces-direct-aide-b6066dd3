
/**
 * GDPR Compliant Logger
 * Ensures PII is masked before being written to stdout/logs.
 */

// Simple regex for emails
const EMAIL_REGEX = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
// Simple regex for phones (loose matching)
const PHONE_REGEX = /(\b(?:\+33|0)[1-9](?:[\s.-]*\d{2}){4}\b)/g;

/**
 * Masks an email address: jules@example.com -> j***@example.com
 */
function maskEmail(email) {
    if (!email) return email;
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const [local, domain] = parts;
    const maskedLocal = local.length > 1 ? local[0] + '***' : '***';
    return `${maskedLocal}@${domain}`;
}

/**
 * Masks a phone number: 0612345678 -> 06******78
 */
function maskPhone(phone) {
    if (!phone) return phone;
    const clean = phone.replace(/[\s.-]/g, '');
    if (clean.length < 6) return '******';
    return clean.substring(0, 2) + '******' + clean.substring(clean.length - 2);
}

/**
 * Recursively masks PII in objects/strings
 */
export function mask(input) {
    if (!input) return input;

    if (typeof input === 'string') {
        let output = input.replace(EMAIL_REGEX, (match) => maskEmail(match));
        output = output.replace(PHONE_REGEX, (match) => maskPhone(match));
        return output;
    }

    if (Array.isArray(input)) {
        return input.map(mask);
    }

    if (typeof input === 'object') {
        if (input instanceof Date) return input;

        const copy = { ...input };
        for (const key in copy) {
            // Check for specific keys that might contain PII even if regex misses
            if (/email/i.test(key) && typeof copy[key] === 'string') {
                copy[key] = maskEmail(copy[key]);
            } else if (/(phone|tel|mobile)/i.test(key) && typeof copy[key] === 'string') {
                copy[key] = maskPhone(copy[key]);
            } else if (/(password|secret|token|key)/i.test(key)) {
                copy[key] = '[REDACTED]';
            } else {
                copy[key] = mask(copy[key]);
            }
        }
        return copy;
    }

    return input;
}

/**
 * Logs a message with masked data.
 * @param {string} message
 * @param {any} data
 */
export function maskedLog(message, data = null) {
    if (data) {
        console.log(message, JSON.stringify(mask(data), null, 2));
    } else {
        console.log(message);
    }
}

export const logger = {
    info: (msg, data) => maskedLog(`[INFO] ${msg}`, data),
    error: (msg, err) => {
        // Errors are special, we want the stack, but mask the message if PII
        const maskedErr = err instanceof Error ? { message: mask(err.message), stack: err.stack } : mask(err);
        console.error(`[ERROR] ${msg}`, JSON.stringify(maskedErr, null, 2));
    },
    warn: (msg, data) => maskedLog(`[WARN] ${msg}`, data),
    mask
};
