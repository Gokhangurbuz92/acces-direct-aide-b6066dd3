import * as Sentry from '@sentry/node';
import { env } from './env.js';
import { redactValue } from './redact.js';

const dsn = env.sentry.dsn;
const environment = env.sentry.environment;
const release = env.sentry.release;

/** @param {Record<string, unknown> | undefined | null} headers */
function scrubHeaders(headers) {
  if (!headers || typeof headers !== 'object') return headers;
  /** @type {Record<string, unknown>} */
  const out = {};
  for (const [k, v] of Object.entries(headers)) {
    const key = String(k || '');
    const lower = key.toLowerCase();
    if (
      lower.includes('authorization') ||
      lower.includes('cookie') ||
      lower.includes('token') ||
      lower.includes('secret') ||
      lower.includes('password') ||
      lower.includes('key')
    ) {
      out[key] = '[REDACTED]';
      continue;
    }
    out[key] = typeof v === 'string' ? String(v).slice(0, 200) : v;
  }
  return out;
}

/** @param {any} event */
function scrubRequest(event) {
  if (!event || typeof event !== 'object') return event;

  if (event.request && typeof event.request === 'object') {
    // Never attach raw bodies or cookies.
    if ('data' in event.request) delete event.request.data;
    if ('cookies' in event.request) delete event.request.cookies;

    if (event.request.headers) {
      event.request.headers = scrubHeaders(event.request.headers);
    }

    if (typeof event.request.query_string === 'string') {
      event.request.query_string = String(redactValue(event.request.query_string));
    }

    if (typeof event.request.url === 'string') {
      // Redact any sensitive query params that might slip into URLs.
      try {
        const url = new URL(event.request.url);
        for (const [key] of url.searchParams.entries()) {
          const lower = String(key).toLowerCase();
          if (
            lower.includes('token') ||
            lower.includes('secret') ||
            lower.includes('password') ||
            lower === 'key' ||
            lower.includes('auth')
          ) {
            url.searchParams.set(key, '[REDACTED]');
          }
        }
        event.request.url = url.toString();
      } catch {
        event.request.url = String(redactValue(event.request.url));
      }
    }
  }

  return event;
}

if (dsn) {
  Sentry.init({
    dsn,
    environment,
    release,
    tracesSampleRate: 1.0,
    beforeSend(event) {
      return scrubRequest(event);
    },
  });
}

export default Sentry;
