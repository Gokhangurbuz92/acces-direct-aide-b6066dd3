import { getHeader, setNoStore, setPublicCache, hasAuthHeader, setCachePolicyTag } from "./cache.js";

function parseUrl(req) {
    // req.url might be "/api/aides?slug=..."
    try {
        return new URL(req.url || "", "http://localhost");
    } catch {
        return new URL("http://localhost/");
    }
}

function isPrivatePath(pathname) {
    // Hard NO-STORE zones
    if (/^\/api\/(admin|auth|pro|cron)\b/i.test(pathname)) return true;
    if (/^\/api\/public\/(messages|appointments|suggest-structure)\b/i.test(pathname)) return true;
    if (/^\/api\/(upload|download)\b/i.test(pathname)) return true;
    return false;
}

function isVariesByUserPublicUnsafe(pathname) {
    // Per your audit: these may expose drafts for admin/pro
    // Per your audit: these may expose drafts for admin/pro
    return pathname === "/api/actualites" || pathname === "/api/guides" || pathname === "/api/tools";
}

function isVercelDefaultCacheControl(v) {
    const s = String(v || "").toLowerCase();
    // Vercel runtime default we want to override:
    // "public, max-age=0, must-revalidate"
    return (
        s.includes("public") &&
        s.includes("max-age=0") &&
        s.includes("must-revalidate") &&
        !s.includes("s-maxage") &&
        !s.includes("stale-while-revalidate") &&
        !s.includes("no-store")
    );
}

export function applyCachePolicy(req, res) {
    // If handler already set Cache-Control, respectfully bail...
    // UNLESS it's the Vercel default "public, max-age=0, must-revalidate" which kills CDN caching.
    const existing = getHeader(res, "Cache-Control");
    if (existing && !isVercelDefaultCacheControl(existing)) return;

    const method = (req.method || "GET").toUpperCase();
    const url = parseUrl(req);
    const pathname = url.pathname;
    const sp = url.searchParams;

    // Default: no-store for non-GET
    if (method !== "GET") {
        setCachePolicyTag(res, "NOSTORE_METHOD");
        return setNoStore(res);
    }

    // Any Authorization => no-store (prevents leaking admin views / user-variant mixing)
    if (hasAuthHeader(req)) {
        setCachePolicyTag(res, "NOSTORE_AUTH");
        return setNoStore(res);
    }

    // Private zones => no-store
    if (isPrivatePath(pathname)) {
        setCachePolicyTag(res, "NOSTORE_PRIVATE");
        return setNoStore(res);
    }

    // Varies-by-user public endpoints => no-store (safe default)
    if (isVariesByUserPublicUnsafe(pathname)) {
        setCachePolicyTag(res, "NOSTORE_VARIES");
        return setNoStore(res);
    }

    // === PUBLIC CACHE WHITELIST ===
    // robots/sitemap (very stable)
    if (pathname === "/api/robots.txt" || pathname === "/robots.txt") {
        setCachePolicyTag(res, "ROBOTS_1D");
        return setPublicCache(res, { sMaxage: 86400, swr: 604800 });
    }
    if (pathname === "/api/sitemap.xml" || pathname === "/sitemap.xml") {
        setCachePolicyTag(res, "SITEMAP_1H");
        return setPublicCache(res, { sMaxage: 3600, swr: 86400 });
    }

    // taxonomy (stable)
    if (pathname === "/api/taxonomy") {
        setCachePolicyTag(res, "TAXONOMY_1H");
        return setPublicCache(res, { sMaxage: 3600, swr: 86400 });
    }

    // public stats (already configured in your code, but safe to unify here)
    if (pathname === "/api/public/stats") {
        setCachePolicyTag(res, "STATS_5M");
        return setPublicCache(res, { sMaxage: 300, swr: 3600 });
    }

    // availability (volatile)
    if (pathname === "/api/public/availability") {
        setCachePolicyTag(res, "AVAIL_1M");
        return setPublicCache(res, { sMaxage: 60, swr: 120 });
    }

    // Entities: list vs detail policy
    if (
        pathname === "/api/aides" ||
        pathname === "/api/structures" ||
        pathname === "/api/demarches" ||
        pathname === "/api/dispositifs"
    ) {
        const isDetail = sp.has("id") || sp.has("slug");

        // Structures: geo/search is more volatile (optional nuance)
        const isStructures = pathname === "/api/structures";
        const isGeoOrSearch = isStructures && (sp.has("q") || sp.has("lat") || sp.has("lon"));

        if (isDetail) {
            setCachePolicyTag(res, "DETAIL_1M");
            return setPublicCache(res, { sMaxage: 60, swr: 3600 });
        }
        if (isGeoOrSearch) {
            setCachePolicyTag(res, "STRUCTURES_GEO_1M");
            return setPublicCache(res, { sMaxage: 60, swr: 600 });
        }
        setCachePolicyTag(res, "LIST_10M");
        return setPublicCache(res, { sMaxage: 600, swr: 86400 });
    }

    // Not in whitelist => default no-store (safe)
    setCachePolicyTag(res, "NOSTORE_DEFAULT");
    return setNoStore(res);
}
