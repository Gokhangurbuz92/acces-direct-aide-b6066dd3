// src/api/client.js
// Final build-safe version for Vite & Vercel
// No JSX, no advanced syntax that confuses Rollup parser

/**
 * @typedef {Object} ApiRequestOptions
 * @property {string=} method
 * @property {Record<string, string>=} headers
 * @property {any=} body
 * @property {AbortSignal=} signal
 * @property {boolean=} auth
 */

var getToken = function () {
    if (typeof window !== 'undefined') {
        return sessionStorage.getItem('access_token');
    }
    return null;
};

/**
 * @param {string} path
 * @param {ApiRequestOptions=} opt
 */
var shouldAttachAuth = function (path, opt) {
    if (opt && opt.auth === false) return false;
    if (opt && opt.auth === true) return true;
    // Default: only attach token to /api/admin, /api/auth, /api/pro
    return /^\/api\/(admin|auth|pro)\b/.test(path);
};

/**
 * @param {string} path
 * @param {ApiRequestOptions=} options
 * @returns {Promise<any>}
 */
var apiRequest = async function (path, options) {
    var opt = options || {};

    /** @type {Record<string, string>} */
    var headers = {
        "Content-Type": "application/json",
        ...(opt.headers || {}),
    };

    var token = getToken();
    // Use helper to decide if we send Authorization header
    if (token && shouldAttachAuth(path, opt)) {
        headers["Authorization"] = "Bearer " + token;
    }

    var res = await fetch(path, {
        method: opt.method || "GET",
        headers: headers,
        body: opt.body ? JSON.stringify(opt.body) : undefined,
        signal: opt.signal,
    });

    var contentType = res.headers.get("content-type") || "";
    var payload = null;

    if (contentType.includes("application/json")) {
        payload = await res.json().catch(() => null);
    } else {
        payload = await res.text().catch(() => null);
    }

    if (!res.ok) {
        var err = new Error("API Error: " + res.status);
        err.status = res.status;
        err.payload = payload;
        throw err;
    }

    return payload;
};

/** @param {string} endpoint */
var createEntityClient = function (endpoint) {
    return {
        /** @param {string=} sort @param {number | string=} limit */
        list: function (sort, limit) {
            return apiRequest('/api/' + endpoint + '?sort=' + (sort || '') + '&limit=' + (limit || ''));
        },
        /** @param {any} id */
        get: function (id) {
            return apiRequest('/api/' + endpoint + '?id=' + id);
        },
        /** @param {any} data */
        create: function (data) {
            return apiRequest('/api/' + endpoint, { method: 'POST', body: data });
        },
        /** @param {any} id @param {any} data */
        update: function (id, data) {
            return apiRequest('/api/' + endpoint + '?id=' + id, { method: 'PUT', body: data });
        },
        /** @param {any} id */
        delete: function (id) {
            return apiRequest('/api/' + endpoint + '?id=' + id, { method: 'DELETE' });
        },
        /** @param {Record<string, any>} query @param {string=} sort @param {number | string=} limit */
        filter: function (query, sort, limit) {
            var params = new URLSearchParams();
            Object.keys(query).forEach(function (k) {
                if (query[k] != null) params.append(k, query[k]);
            });
            if (sort) params.append('sort', sort);
            if (limit) params.append('limit', String(limit));
            return apiRequest('/api/' + endpoint + '?' + params.toString());
        }
    };
};

export const apiClient = {
    taxonomy: {
        get: function () {
            return apiRequest('/api/taxonomy');
        }
    },
    health: {
        check: function () {
            return apiRequest('/api/healthz');
        },
        deep: function () {
            return apiRequest('/api/health/deep', { auth: true });
        }
    },
    auth: {
        /** @param {string} email @param {string} password */
        login: async function (email, password) {
            var data = await apiRequest('/api/auth/login', {
                method: 'POST',
                body: { email: email, password: password, mode: 'admin' }
            });
            sessionStorage.setItem('access_token', data.token);
            return data.user;
        },
        logout: async function () {
            sessionStorage.removeItem('access_token');
            if (typeof window !== 'undefined') window.location.href = '/admin/login';
        },
        getUser: async function () {
            var token = getToken();
            if (!token) return null;
            try {
                var data = await apiRequest('/api/auth/me');
                return data.user;
            } catch (e) {
                sessionStorage.removeItem('access_token');
                return null;
            }
        }
    },
    admin: {
        /** @param {string=} status @param {number=} page */
        getInbox: function (status, page) {
            return apiRequest('/api/admin/inbox?status=' + (status || 'brouillon') + '&page=' + (page || 1));
        },
        /** @param {string} action @param {string[]} ids */
        performAction: function (action, ids) {
            return apiRequest('/api/admin/actions', {
                method: 'POST',
                body: { action: action, ids: ids }
            });
        },
        getRuns: function () {
            return apiRequest('/api/admin/runs');
        },
        /** @param {string=} job @param {number | string=} limit */
        getCronRuns: function (job, limit) {
            var params = new URLSearchParams();
            if (job) params.append('job', job);
            if (limit != null) params.append('limit', String(limit));
            return apiRequest('/api/admin/cron-runs?' + params.toString());
        },
        /** @param {string} id */
        getCronRun: function (id) {
            return apiRequest('/api/admin/cron-runs/' + encodeURIComponent(id));
        },
        /** @param {number=} limitPerType */
        scanReviewQueue: function (limitPerType) {
            var body = {};
            if (limitPerType != null) body.limitPerType = Number(limitPerType);
            return apiRequest('/api/admin/review-queue/scan', {
                method: 'POST',
                body: body
            });
        },
        /**
         * @param {{ status?: string, entityType?: string, reason?: string, limit?: number | string, cursor?: string }=} filters
         */
        getReviewQueueItems: function (filters) {
            var params = new URLSearchParams();
            var input = filters || {};
            if (input.status) params.append('status', String(input.status));
            if (input.entityType) params.append('entityType', String(input.entityType));
            if (input.reason) params.append('reason', String(input.reason));
            if (input.limit != null) params.append('limit', String(input.limit));
            if (input.cursor) params.append('cursor', String(input.cursor));
            return apiRequest('/api/admin/review-queue?' + params.toString());
        },
        /** @param {string} id @param {'resolved' | 'ignored'} status */
        updateReviewQueueStatus: function (id, status) {
            return apiRequest('/api/admin/review-queue/' + encodeURIComponent(id), {
                method: 'PATCH',
                body: { status: status }
            });
        },
        /** @param {string[]} ids @param {'resolved' | 'ignored'} status */
        bulkUpdateReviewQueue: function (ids, status) {
            return apiRequest('/api/admin/review-queue/bulk', {
                method: 'PATCH',
                body: {
                    ids: Array.isArray(ids) ? ids : [],
                    status: status
                }
            });
        }
    },
    monitor: {
        getDataQuality: function () {
            return apiRequest('/api/monitor/data-quality');
        },
        getIngestionFreshness: function () {
            return apiRequest('/api/monitor/ingestion-freshness');
        }
    },
    entities: {
        Aide: createEntityClient('aides'),
        Structure: createEntityClient('structures'),
        Demarche: createEntityClient('demarches'),
        Actualite: createEntityClient('actualites'),
        Guide: createEntityClient('guides'),
        UpdateLog: createEntityClient('update-logs'),
        Source: createEntityClient('sources')
    },
    integrations: {
        Core: {
            /** @param {string | { prompt: string }} input */
            InvokeLLM: function (input) {
                var prompt =
                    typeof input === 'string'
                        ? input
                        : (input && typeof input === 'object' && 'prompt' in input)
                            ? input.prompt
                            : '';
                return apiRequest('/api/integrations/core/invoke', {
                    method: 'POST',
                    body: { prompt: prompt }
                });
            }
        }
    }
};

export const adminClient = apiClient;
export const publicClient = apiClient;
export const client = apiClient;
export const api = apiClient;

export default apiClient;
