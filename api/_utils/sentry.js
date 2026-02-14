import * as Sentry from '@sentry/node';
import { env } from './env.js';

const dsn = env.sentry.dsn;
const environment = env.sentry.environment;
const release = env.sentry.release;

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
