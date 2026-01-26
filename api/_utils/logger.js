import pino from 'pino';

const environment = process.env.VERCEL_ENV || process.env.VITE_ENV || 'development';
const release = process.env.VERCEL_GIT_COMMIT_SHA || process.env.VITE_GIT_COMMIT_SHA || 'dev';

const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
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
