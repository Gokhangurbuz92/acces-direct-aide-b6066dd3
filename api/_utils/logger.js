import pino from 'pino';
import { env } from './env.js';

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
    // Redact sensitive keys if necessary
    redact: {
        paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'token'],
        remove: true
    }
});

export default logger;
