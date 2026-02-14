
import { createClient } from '@vercel/kv';
import { env } from './env.js';



const memoryStore = new Map();

let kvClient;

if (env.kv.url && env.kv.token) {
    kvClient = createClient({
        url: env.kv.url,
        token: env.kv.token
    });
} else {
    console.warn("[KV] Missing Credentials - Using Memory Store (Dev Mode)");
}

export const kv = {
    async set(key, value, opts) {
        if (kvClient) return kvClient.set(key, value, opts);

        // Memory fallback (Dev only)
        // opts: { ex: seconds }
        memoryStore.set(key, { value, expires: opts?.ex ? Date.now() + opts.ex * 1000 : null });
        return 'OK';
    },
    async get(key) {
        if (kvClient) return kvClient.get(key);

        const data = memoryStore.get(key);
        if (!data) return null;
        if (data.expires && Date.now() > data.expires) {
            memoryStore.delete(key);
            return null;
        }
        return data.value;
    },
    async del(key) {
        if (kvClient) return kvClient.del(key);
        memoryStore.delete(key);
        return 1;
    },
    // Add other methods if needed
    async incr(key) {
        if (kvClient) return kvClient.incr(key);
        const data = memoryStore.get(key);
        let val = (data?.value || 0) + 1;
        memoryStore.set(key, { value: val, expires: data?.expires });
        return val;
    },
    async expire(key, seconds) {
        if (kvClient) return kvClient.expire(key, seconds);
        const data = memoryStore.get(key);
        if (data) {
            data.expires = Date.now() + seconds * 1000;
            memoryStore.set(key, data);
        }
        return 1;
    }
};
