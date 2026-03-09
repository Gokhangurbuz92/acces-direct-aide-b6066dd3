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

import { cryptoE2EE } from '@/lib/crypto-messaging.js';

/**
 * Décrypte les messages d'une conversation s'ils sont chiffrés E2EE.
 */
async function decryptConversation(data, conversationId) {
  if (!data?.item?.messages) return data;

  data.item.messages = await Promise.all(
    data.item.messages.map(async (msg) => {
      if (msg.body && msg.body.startsWith('E2EE:')) {
        try {
          msg.body = await cryptoE2EE.decrypt(msg.body.slice(5), conversationId);
        } catch (err) {
          // Fallback géré par le try/catch interne de cryptoE2EE s'il échoue, 
          // mais par sécurité.
        }
      }
      return msg;
    })
  );

  return data;
}

/**
 * Décrypte les derniers messages (lastMessage) dans une liste de conversations.
 */
async function decryptConversationList(data) {
  if (!data?.items) return data;

  data.items = await Promise.all(
    data.items.map(async (conv) => {
      if (conv.lastMessage?.body?.startsWith('E2EE:')) {
        try {
          conv.lastMessage.body = await cryptoE2EE.decrypt(conv.lastMessage.body.slice(5), conv.id);
        } catch (err) {
          // fallback
        }
      }
      return conv;
    })
  );

  return data;
}

export const rdvMessagingClient = {
  authMe() {
    return requestJson('/api/auth/me', { auth: 'user' });
  },
  user: {
    async listConversations() {
      const data = await requestJson('/api/messages/conversations', { auth: 'user' });
      return decryptConversationList(data);
    },
    async getConversation(conversationId) {
      const data = await requestJson(`/api/messages/conversations/${encodeURIComponent(conversationId)}`, { auth: 'user' });
      return decryptConversation(data, conversationId);
    },
    async sendMessage(conversationId, body) {
      const encryptedBlob = await cryptoE2EE.encrypt(body, conversationId);
      const finalBody = `E2EE:${encryptedBlob}`;

      const data = await requestJson(`/api/messages/conversations/${encodeURIComponent(conversationId)}`, {
        method: 'POST',
        auth: 'user',
        body: { body: finalBody },
      });

      // Décrypter le message renvoyé dans la réponse si nécessaire
      if (data?.item?.body?.startsWith('E2EE:')) {
        data.item.body = await cryptoE2EE.decrypt(data.item.body.slice(5), conversationId);
      }

      return data;
    },
    getOrCreateFromAppointment(appointmentId) {
      return requestJson(`/api/messages/from-appointment/${encodeURIComponent(appointmentId)}`, {
        method: 'POST',
        auth: 'user',
      });
    },
  },
  pro: {
    async listConversations() {
      const data = await requestJson('/api/pro/messages/conversations', { auth: 'pro' });
      return decryptConversationList(data);
    },
    async getConversation(conversationId) {
      const data = await requestJson(`/api/pro/messages/conversations/${encodeURIComponent(conversationId)}`, { auth: 'pro' });
      return decryptConversation(data, conversationId);
    },
    async sendMessage(conversationId, body) {
      const encryptedBlob = await cryptoE2EE.encrypt(body, conversationId);
      const finalBody = `E2EE:${encryptedBlob}`;

      const data = await requestJson(`/api/pro/messages/conversations/${encodeURIComponent(conversationId)}`, {
        method: 'POST',
        auth: 'pro',
        body: { body: finalBody },
      });

      if (data?.item?.body?.startsWith('E2EE:')) {
        data.item.body = await cryptoE2EE.decrypt(data.item.body.slice(5), conversationId);
      }

      return data;
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
