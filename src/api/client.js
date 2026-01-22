// API Client for local endpoints
// Replaces legacy external SDK usage

const getToken = () => {
    if (typeof window !== 'undefined') {
        return sessionStorage.getItem('access_token');
    }
    return null;
};

// ... (skip lines)

auth: {
    login: async (email, password) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!res.ok) throw new Error('Login failed');
        const data = await res.json();
        sessionStorage.setItem('access_token', data.token);
        return data.user;
    },
        logout: async () => {
            sessionStorage.removeItem('access_token');
            if (typeof window !== 'undefined') window.location.href = '/admin/login';
        },

const createEntityClient = (entityName, endpoint) => {
        return {
            list: async (sort, limit) => {
                const params = new URLSearchParams();
                if (sort) params.append('sort', sort);
                if (limit) params.append('limit', limit);

                const headers = { 'Content-Type': 'application/json' };
                const token = getToken();
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const response = await fetch(`/api/${endpoint}?${params.toString()}`, { headers });
                if (!response.ok) throw new Error(`Failed to fetch ${entityName}`);
                return response.json();
            },
            filter: async (query, sort, limit) => {
                const params = new URLSearchParams();
                Object.keys(query).forEach(key => {
                    if (query[key] !== undefined && query[key] !== null) {
                        params.append(key, query[key]);
                    }
                });

                if (sort) params.append('sort', sort);
                if (limit) params.append('limit', limit);

                const headers = { 'Content-Type': 'application/json' };
                const token = getToken();
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const response = await fetch(`/api/${endpoint}?${params.toString()}`, { headers });
                if (!response.ok) throw new Error(`Failed to fetch ${entityName}`);
                return response.json();
            },
            get: async (id) => {
                const headers = { 'Content-Type': 'application/json' };
                const token = getToken();
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const response = await fetch(`/api/${endpoint}?id=${id}`, { headers });
                if (!response.ok) throw new Error(`Failed to fetch ${entityName} with id ${id}`);
                const data = await response.json();
                return Array.isArray(data) ? data[0] : data;
            },
            create: async (data) => {
                const headers = { 'Content-Type': 'application/json' };
                const token = getToken();
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const response = await fetch(`/api/${endpoint}`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(data)
                });
                if (!response.ok) throw new Error(`Failed to create ${entityName}`);
                return response.json();
            },
            update: async (id, data) => {
                const headers = { 'Content-Type': 'application/json' };
                const token = getToken();
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const response = await fetch(`/api/${endpoint}?id=${id}`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify(data)
                });
                if (!response.ok) throw new Error(`Failed to update ${entityName}`);
                return response.json();
            },
            delete: async (id) => {
                const headers = { 'Content-Type': 'application/json' };
                const token = getToken();
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const response = await fetch(`/api/${endpoint}?id=${id}`, {
                    method: 'DELETE',
                    headers
                });
                if (!response.ok) throw new Error(`Failed to delete ${entityName}`);
                return response.json();
            }
        };
    };

    const apiClient = {
        auth: {
            login: async (email, password) => {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                if (!res.ok) throw new Error('Login failed');
                const data = await res.json();
                localStorage.setItem('access_token', data.token);
                return data.user;
            },
            logout: async () => {
                localStorage.removeItem('access_token');
                if (typeof window !== 'undefined') window.location.href = '/admin/login';
            },
            getUser: async () => {
                const token = getToken();
                if (!token) return null;
                try {
                    const res = await fetch('/api/auth/me', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!res.ok) {
                        sessionStorage.removeItem('access_token');
                        return null;
                    }
                    const data = await res.json();
                    return data.user;
                } catch (e) {
                    return null;
                }
            },
            user: null
        },
        admin: {
            getInbox: async (status = 'brouillon', page = 1) => {
                const token = getToken();
                const headers = {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                };
                const response = await fetch(`/api/admin/inbox?status=${status}&page=${page}`, { headers });
                if (!response.ok) throw new Error('Failed to fetch inbox');
                return response.json();
            },
            performAction: async (action, ids) => {
                const token = getToken();
                const headers = {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                };
                const response = await fetch('/api/admin/actions', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ action, ids })
                });
                if (!response.ok) throw new Error('Action failed');
                return response.json();
            },
            getRuns: async () => {
                const token = getToken();
                const headers = {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                };
                const response = await fetch('/api/admin/runs', { headers });
                if (!response.ok) throw new Error('Failed to fetch runs');
                return response.json();
            }
        },
        entities: {
            Aide: createEntityClient('Aide', 'aides'),
            Structure: createEntityClient('Structure', 'structures'),
            Demarche: createEntityClient('Demarche', 'demarches'),
            Actualite: createEntityClient('Actualite', 'actualites'),
            UpdateLog: createEntityClient('UpdateLog', 'update-logs'),
            Source: createEntityClient('Source', 'sources'),
        },
        agents: {
            createConversation: async () => ({ id: 'mock-conv-id' }),
            getConversation: async () => ({ messages: [] }),
            addMessage: async () => ({}),
            subscribeToConversation: (id, callback) => {
                setTimeout(() => {
                    callback({ messages: [{ role: 'assistant', content: "Le chat est temporairement indisponible." }] });
                }, 1000);
                return () => { };
            }
        },
        integrations: {
            Core: {
                InvokeLLM: async () => "Le chat est temporairement indisponible."
            }
        },
        functions: {
            invoke: async (name, args) => {
                console.log(`Mock invoking function ${name}`, args);
                return { success: true };
            }
        }
    };

    export { apiClient };
    export const adminClient = apiClient;
    export const client = apiClient;
