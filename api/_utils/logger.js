import pino from 'pino';
import { env } from './env.js';
import { redactForLog } from './redact.js';

const environment = env.runtime.vercelEnv;
const release = env.sentry.release;

const logger = pino({
    level: env.runtime.logLevel,
    base: {
        env: environment,
        service: 'api',
        release: release
    },
    formatters: {
        level: (label) => {
            return { level: label };
        },
    },
    hooks: {
        // Ensure every log line is safe: redact common secrets/PII and avoid logging bodies.
        logMethod(args, method) {
            try {
                if (args && args.length > 0 && args[0] && typeof args[0] === 'object') {
                    args[0] = redactForLog(args[0]);
                }
            } catch {
                // Best-effort only: logging must never crash the request.
            }
            return method.apply(this, args);
        },
    },
    // Redact sensitive keys if necessary
    redact: {
        paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'headers.authorization',
            'headers.cookie',
            'authorization',
            'cookie',
            'password',
            'token',
            'secret',
        ],
        remove: true
    }
});

export default logger;
