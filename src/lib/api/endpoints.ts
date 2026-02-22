/**
 * Typed endpoint wrappers for the Aides API.
 *
 * Routes confirmed in:
 *   - api/routes.js           → { path: 'aides', match: 'prefix' }
 *   - api/_handlers/aides.js  → GET list (query params) + GET by slug (path param)
 *   - api/lib/search-query.js → enrichment + pagination shape
 */

import { apiGet } from "./client";
import type { ApiAidesListResponse, ApiAideDetail } from "@/types/api";

// ---------------------------------------------------------------------------
// Search / list params (mirrors backend searchAidesSchema)
// ---------------------------------------------------------------------------

export interface ListAidesParams {
    q?: string;
    theme?: string;
    sousTheme?: string;
    /** "public" alias — audience filter */
    public?: string;
    territoire?: string;
    organisme?: string;
    urgent?: string;
    sort?: string;
    page?: number;
    pageSize?: number;
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

/**
 * Search / list Aides.
 *
 * GET /api/aides?q=…&theme=…&page=…&pageSize=…&sort=…
 */
export function listAides(
    params?: ListAidesParams,
): Promise<ApiAidesListResponse> {
    const query: Record<string, string | number | boolean | undefined | null> = {};

    if (params) {
        if (params.q) query.q = params.q;
        if (params.theme) query.theme = params.theme;
        if (params.sousTheme) query.sousTheme = params.sousTheme;
        if (params.public) query.public = params.public;
        if (params.territoire) query.territoire = params.territoire;
        if (params.organisme) query.organisme = params.organisme;
        if (params.urgent) query.urgent = params.urgent;
        if (params.sort) query.sort = params.sort;
        if (params.page != null) query.page = params.page;
        if (params.pageSize != null) query.pageSize = params.pageSize;
    }

    return apiGet<ApiAidesListResponse>("/api/aides", query);
}

/**
 * Get a single Aide by slug.
 *
 * GET /api/aides/:slug
 */
export function getAideBySlug(slug: string): Promise<ApiAideDetail> {
    return apiGet<ApiAideDetail>(`/api/aides/${encodeURIComponent(slug)}`);
}
