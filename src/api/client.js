// src/api/client.js
// Final build-safe version for Vite & Vercel
// No JSX, no advanced syntax that confuses Rollup parser

var getToken = function () {
    if (typeof window !== 'undefined') {
        return sessionStorage.getItem('access_token');
    }
    return null;
};

var apiRequest = async function (path, options) {
    var opt = options || {};
    var headers = { 'Content-Type': 'application/json' };
    var token = getToken();
    if (token) {
        headers['Authorization'] = 'Bearer ' + token;
    }

    var res = await fetch(path, {
        method: opt.method || 'GET',
        headers: headers,
        body: opt.body ? JSON.stringify(opt.body) : undefined
    });

    if (!res.ok) {
        throw new Error('API Error: ' + res.status);
    }

    return res.json();
};

var createEntityClient = function (endpoint) {
    return {
        list: function (sort, limit) {
            return apiRequest('/api/' + endpoint + '?sort=' + (sort || '') + '&limit=' + (limit || ''));
        },
        get: function (id) {
            return apiRequest('/api/' + endpoint + '?id=' + id);
        },
        create: function (data) {
            return apiRequest('/api/' + endpoint, { method: 'POST', body: data });
        },
        update: function (id, data) {
            return apiRequest('/api/' + endpoint + '?id=' + id, { method: 'PUT', body: data });
        },
        delete: function (id) {
            return apiRequest('/api/' + endpoint + '?id=' + id, { method: 'DELETE' });
        },
        filter: function (query, sort, limit) {
            var params = new URLSearchParams();
            Object.keys(query).forEach(function (k) {
                if (query[k] != null) params.append(k, query[k]);
            });
            if (sort) params.append('sort', sort);
            if (limit) params.append('limit', limit);
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
        }
    },
    auth: {
        login: async function (email, password) {
            var data = await apiRequest('/api/auth/login', {
                method: 'POST',
                body: { email: email, password: password }
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
        getInbox: function (status, page) {
            return apiRequest('/api/admin/inbox?status=' + (status || 'brouillon') + '&page=' + (page || 1));
        },
        performAction: function (action, ids) {
            return apiRequest('/api/admin/actions', {
                method: 'POST',
                body: { action: action, ids: ids }
            });
        },
        getRuns: function () {
            return apiRequest('/api/admin/runs');
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
            InvokeLLM: function (prompt) {
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
