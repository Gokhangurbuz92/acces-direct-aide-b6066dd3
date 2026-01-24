import * as Sentry from '@sentry/node';

const dsn = process.env.VITE_SENTRY_DSN || process.env.SENTRY_DSN;
const environment = process.env.VERCEL_ENV || process.env.VITE_ENV || 'development';
const release = process.env.VERCEL_GIT_COMMIT_SHA || process.env.VITE_GIT_COMMIT_SHA || 'dev';

if (dsn) {
  Sentry.init({
    dsn,
    environment,
    release,
    tracesSampleRate: 1.0,
    // Enable HTTP tracing
    integrations: [
        // Sentry.httpIntegration(), // Usually enabled by default in @sentry/node
    ],
  });
}

export const setUserContext = (user) => {
    Sentry.setUser(user);
};

export const setTags = (tags) => {
    Sentry.setTags(tags);
};

export default Sentry;
