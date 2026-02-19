// @ts-nocheck
import { sentryRef } from '@/observability/sentryRef.js';

/**
 * @returns {any}
 */
function getSentryClient() {
  const client = sentryRef.current;
  if (!client) return null;
  if (typeof client.captureException !== 'function' && typeof client.captureMessage !== 'function') {
    return null;
  }
  return client;
}

/**
 * @param {'network_error' | 'request_failed'} kind
 * @param {{ endpoint: string, method: string, surface: string, status?: number, requestId?: string | null }} context
 * @param {unknown=} error
 */
function captureMessagingIssue(kind, context, error) {
  const Sentry = getSentryClient();
  if (!Sentry) return;

  const level = (context.status || 0) >= 500 ? 'error' : 'warning';

  try {
    if (typeof Sentry.withScope === 'function') {
      Sentry.withScope((scope) => {
        if (scope && typeof scope.setTag === 'function') {
          scope.setTag('module', 'rdv');
          scope.setTag('surface', context.surface);
          scope.setTag('endpoint', context.endpoint);
          scope.setTag('http.method', context.method);
          if (typeof context.status === 'number') scope.setTag('http.status_code', String(context.status));
          if (context.requestId) scope.setTag('request_id', context.requestId);
        }

        if (scope && typeof scope.setContext === 'function') {
          scope.setContext('rdv_messaging', {
            endpoint: context.endpoint,
            method: context.method,
            status: typeof context.status === 'number' ? context.status : null,
            requestId: context.requestId || null,
          });
        }

        if (error && typeof Sentry.captureException === 'function') {
          Sentry.captureException(error);
          return;
        }

        if (typeof Sentry.captureMessage === 'function') {
          Sentry.captureMessage(`rdv_messaging_${kind}`, { level });
        }
      });
      return;
    }

    if (error && typeof Sentry.captureException === 'function') {
      Sentry.captureException(error);
      return;
    }

    if (typeof Sentry.captureMessage === 'function') {
      Sentry.captureMessage(`rdv_messaging_${kind}`, { level });
    }
  } catch {
    // best effort
  }
}

/**
 * @param {string} path
 * @param {{ method?: string, body?: any, auth?: 'user' | 'pro', signal?: AbortSignal }=} options
 */
async function requestJson(path, options = {}) {
  const method = String(options.method || 'GET').toUpperCase();
  const auth = options.auth || 'user';

  /** @type {Record<string, string>} */
  const headers = {
    Accept: 'application/json',
  };

  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }

  if (auth === 'pro') {
    const proToken = typeof window !== 'undefined' ? localStorage.getItem('pro_token') : null;
    if (!proToken) {
      const error = new Error('Pro authentication required');
      // @ts-ignore
      error.status = 401;
      throw error;
    }
    headers.Authorization = `Bearer ${proToken}`;
  }

  /** @type {Response} */
  let response;
  try {
    response = await fetch(path, {
      method,
      credentials: auth === 'user' ? 'include' : 'same-origin',
      headers,
      body: typeof options.body === 'undefined' ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (networkError) {
    captureMessagingIssue(
      'network_error',
      {
        endpoint: path,
        method,
        surface: auth === 'user' ? 'user-messaging' : 'pro-messaging',
      },
      networkError,
    );
    const error = new Error('Network error');
    // @ts-ignore
    error.status = 0;
    throw error;
  }

  const requestId = response.headers.get('x-request-id');
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null);

  if (!response.ok) {
    captureMessagingIssue('request_failed', {
      endpoint: path,
      method,
      surface: auth === 'user' ? 'user-messaging' : 'pro-messaging',
      status: response.status,
      requestId,
    });

    const message = typeof payload?.error === 'string' ? payload.error : `HTTP ${response.status}`;
    const error = new Error(message);
    // @ts-ignore
    error.status = response.status;
    // @ts-ignore
    error.payload = payload;
    // @ts-ignore
    error.requestId = requestId;
    throw error;
  }

  return payload;
}

export const rdvMessagingClient = {
  authMe() {
    return requestJson('/api/auth/me', { auth: 'user' });
  },
  user: {
    listConversations() {
      return requestJson('/api/messages/conversations', { auth: 'user' });
    },
    getConversation(conversationId) {
      return requestJson(`/api/messages/conversations/${encodeURIComponent(conversationId)}`, { auth: 'user' });
    },
    sendMessage(conversationId, body) {
      return requestJson(`/api/messages/conversations/${encodeURIComponent(conversationId)}`, {
        method: 'POST',
        auth: 'user',
        body: { body },
      });
    },
    getOrCreateFromAppointment(appointmentId) {
      return requestJson(`/api/messages/from-appointment/${encodeURIComponent(appointmentId)}`, {
        method: 'POST',
        auth: 'user',
      });
    },
  },
  pro: {
    listConversations() {
      return requestJson('/api/pro/messages/conversations', { auth: 'pro' });
    },
    getConversation(conversationId) {
      return requestJson(`/api/pro/messages/conversations/${encodeURIComponent(conversationId)}`, { auth: 'pro' });
    },
    sendMessage(conversationId, body) {
      return requestJson(`/api/pro/messages/conversations/${encodeURIComponent(conversationId)}`, {
        method: 'POST',
        auth: 'pro',
        body: { body },
      });
    },
  },
};

/**
 * @param {any} error
 * @param {string=} fallback
 */
export function messagingErrorText(error, fallback = 'Une erreur est survenue.') {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  if (error?.payload?.error && typeof error.payload.error === 'string') return error.payload.error;
  if (error?.message && typeof error.message === 'string') return error.message;
  return fallback;
}
