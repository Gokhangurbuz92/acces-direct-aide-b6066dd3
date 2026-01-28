export function getHeader(res, key) {
    try {
        if (typeof res.getHeader === "function") return res.getHeader(key);
    } catch { }
    return undefined;
}

export function setHeader(res, key, value) {
    try {
        if (typeof res.setHeader === "function") return res.setHeader(key, value);
        if (typeof res.set === "function") return res.set(key, value);
    } catch { }
}

export function setCachePolicyTag(res, value) {
    // Only send debug headers if explicitly enabled or not in production
    // (Defaults to hidden in prod for cleanliness)
    const showDebug = process.env.CACHE_DEBUG_HEADERS === 'true' ||
        (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production');

    if (!showDebug) return;

    try {
        if (typeof res.setHeader === "function") return res.setHeader("x-cache-policy", value);
        if (typeof res.set === "function") return res.set("x-cache-policy", value);
    } catch { }
}

export function hasAuthHeader(req) {
    const h = req?.headers || {};
    return Boolean(h.authorization || h.Authorization);
}

export function setNoStore(res) {
    // private prevents shared caches from storing
    setHeader(res, "Cache-Control", "private, no-store, max-age=0, must-revalidate");
    setHeader(res, "Pragma", "no-cache");
}

export function setPublicCache(res, { sMaxage = 600, swr = 86400 } = {}) {
    setHeader(res, "Cache-Control", `public, max-age=0, s-maxage=${sMaxage}, stale-while-revalidate=${swr}`);
}

// Safety: if request is authorized, never public-cache it.
export function setAnonymousPublicCache(req, res, policy) {
    if (hasAuthHeader(req)) {
        setNoStore(res);
        return false;
    }
    setPublicCache(res, policy);
    return true;
}

// Guard: if handler returns 4xx/5xx, force no-store (avoid caching errors).
export function attachNoStoreOnError(res) {
    // Wrap writeHead (Node)
    if (typeof res.writeHead === "function") {
        const _writeHead = res.writeHead.bind(res);
        res.writeHead = (statusCode, headers) => {
            if (Number(statusCode) >= 400) setNoStore(res);
            return _writeHead(statusCode, headers);
        };
    }

    // Wrap status() (Express-like)
    if (typeof res.status === "function") {
        const _status = res.status.bind(res);
        res.status = (code) => {
            if (Number(code) >= 400) setNoStore(res);
            return _status(code);
        };
    }

    // Wrap json() (Express-like)
    if (typeof res.json === "function") {
        const _json = res.json.bind(res);
        res.json = (body) => {
            const code = Number(res.statusCode || 200);
            if (code >= 400) setNoStore(res);
            return _json(body);
        };
    }

    // Wrap end() (Node) — last line of defense
    if (typeof res.end === "function") {
        const _end = res.end.bind(res);
        res.end = (...args) => {
            const code = Number(res.statusCode || 200);
            if (code >= 400) setNoStore(res);
            return _end(...args);
        };
    }

    return res;
}
