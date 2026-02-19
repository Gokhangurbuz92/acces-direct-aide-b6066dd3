/**
 * @typedef {{
 *   method?: string,
 *   body?: any,
 *   query?: Record<string, string | number | boolean | null | undefined>,
 *   signal?: AbortSignal,
 * }} ProRequestOptions
 */

/**
 * @returns {string | null}
 */
export function getProToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('pro_token');
}

/**
 * @param {string} token
 */
export function buildProAuthHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

/**
 * @param {Record<string, string | number | boolean | null | undefined> | undefined} query
 * @returns {string}
 */
function buildQueryString(query) {
  if (!query || typeof query !== 'object') return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value == null || value === '') continue;
    params.set(key, String(value));
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

/**
 * @param {string} path
 * @param {ProRequestOptions=} options
 */
export async function proRdvRequest(path, options = {}) {
  const token = getProToken();
  if (!token) {
    throw new Error('Pro authentication required');
  }

  const response = await fetch(`${path}${buildQueryString(options.query)}`, {
    method: options.method || 'GET',
    headers: buildProAuthHeaders(token),
    body: typeof options.body === 'undefined' ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null);

  if (!response.ok) {
    const error = new Error(`Pro API error (${response.status})`);
    // @ts-ignore
    error.status = response.status;
    // @ts-ignore
    error.payload = payload;
    throw error;
  }

  return payload;
}

/**
 * @param {string} path
 */
export async function fetchProRdvReadiness(path = '/api/monitor/pro-rdv') {
  const response = await fetch(path, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  return {
    status: response.status,
    payload,
  };
}

/**
 * @param {{ serviceId?: string, startAt?: string, beneficiaryName?: string }} input
 * @returns {{ ok: boolean, error?: string }}
 */
export function validateAppointmentInput(input) {
  const serviceId = String(input?.serviceId || '').trim();
  const startAt = String(input?.startAt || '').trim();
  const beneficiaryName = String(input?.beneficiaryName || '').trim();

  if (!serviceId) return { ok: false, error: 'serviceId is required' };
  if (!startAt) return { ok: false, error: 'startAt is required' };
  if (!beneficiaryName) return { ok: false, error: 'beneficiaryName is required' };

  const parsed = new Date(startAt);
  if (Number.isNaN(parsed.getTime())) return { ok: false, error: 'startAt must be a valid ISO date' };

  return { ok: true };
}

/**
 * @param {{ startAt?: string, endAt?: string }} input
 * @returns {{ ok: boolean, error?: string }}
 */
export function validateTimeOffInput(input) {
  const startAt = String(input?.startAt || '').trim();
  const endAt = String(input?.endAt || '').trim();
  if (!startAt) return { ok: false, error: 'startAt is required' };
  if (!endAt) return { ok: false, error: 'endAt is required' };

  const start = new Date(startAt);
  const end = new Date(endAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { ok: false, error: 'Invalid time range' };
  }
  if (end <= start) return { ok: false, error: 'endAt must be greater than startAt' };
  return { ok: true };
}

export const proRdvClient = {
  services: {
    list() {
      return proRdvRequest('/api/pro/services');
    },
    create(payload) {
      return proRdvRequest('/api/pro/services', { method: 'POST', body: payload });
    },
    update(id, payload) {
      return proRdvRequest('/api/pro/services', { method: 'PATCH', query: { id }, body: payload });
    },
    remove(id) {
      return proRdvRequest('/api/pro/services', { method: 'DELETE', query: { id } });
    },
  },
  availability: {
    get() {
      return proRdvRequest('/api/pro/availability');
    },
    replace(rulesOrPayload, timezone = 'Europe/Paris') {
      /** @type {Record<string, any>} */
      let body = { rules: [], timezone };
      if (Array.isArray(rulesOrPayload)) {
        body = { rules: rulesOrPayload, timezone };
      } else if (rulesOrPayload && typeof rulesOrPayload === 'object') {
        if (Array.isArray(rulesOrPayload.rules)) {
          body = {
            rules: rulesOrPayload.rules,
            timezone: rulesOrPayload.timezone || timezone,
          };
        } else if (rulesOrPayload.slots_json && typeof rulesOrPayload.slots_json === 'object') {
          body = {
            slots_json: rulesOrPayload.slots_json,
            timezone: rulesOrPayload.timezone || timezone,
          };
        }
      }
      return proRdvRequest('/api/pro/availability', {
        method: 'PUT',
        body,
      });
    },
  },
  slots: {
    list(input) {
      return proRdvRequest('/api/pro/slots', {
        query: {
          serviceId: input?.serviceId,
          from: input?.from,
          to: input?.to,
        },
      });
    },
  },
  appointments: {
    list(filters = {}) {
      return proRdvRequest('/api/pro/appointments', { query: filters });
    },
    create(payload) {
      const validation = validateAppointmentInput(payload);
      if (!validation.ok) throw new Error(validation.error || 'Invalid appointment payload');
      return proRdvRequest('/api/pro/appointments', { method: 'POST', body: payload });
    },
    update(id, payload) {
      return proRdvRequest('/api/pro/appointments', {
        method: 'PATCH',
        body: { id, ...(payload || {}) },
      });
    },
    cancelLegacy(id) {
      return proRdvRequest('/api/pro/appointments/cancel', {
        method: 'POST',
        body: { id },
      });
    },
  },
  timeoff: {
    list(filters = {}) {
      return proRdvRequest('/api/pro/timeoff', { query: filters });
    },
    create(payload) {
      const validation = validateTimeOffInput(payload);
      if (!validation.ok) throw new Error(validation.error || 'Invalid time off payload');
      return proRdvRequest('/api/pro/timeoff', { method: 'POST', body: payload });
    },
    update(id, payload) {
      return proRdvRequest('/api/pro/timeoff', {
        method: 'PATCH',
        body: { id, ...(payload || {}) },
      });
    },
    remove(id) {
      return proRdvRequest('/api/pro/timeoff', { method: 'DELETE', query: { id } });
    },
  },
};

export default proRdvClient;
