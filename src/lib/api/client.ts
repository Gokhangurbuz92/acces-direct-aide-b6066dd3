/**
 * Minimal fetch-based API client.
 *
 * - Typed GET wrapper with generics
 * - 10 s timeout via AbortController
 * - Structured error handling (ApiError)
 * - Safe JSON parsing
 * - No external dependencies
 */

import { getApiBaseUrl, API_TIMEOUT_MS } from "./config";
import type { ApiError } from "@/types/api";

// ---------------------------------------------------------------------------
// URL builder
// ---------------------------------------------------------------------------

/**
 * Build a full URL from a path and optional query parameters.
 *
 * @example
 *   buildUrl("/api/aides", { page: "1", q: "logement" })
 *   // → "/api/aides?page=1&q=logement"  (same-origin)
 *   // → "https://staging.example.com/api/aides?page=1&q=logement"
 */
export function buildUrl(
    path: string,
    params?: Record<string, string | number | boolean | undefined | null>,
): string {
    const base = getApiBaseUrl();
    const url = `${base}${path}`;

    if (!params) return url;

    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "") {
            searchParams.set(key, String(value));
        }
    }

    const qs = searchParams.toString();
    return qs ? `${url}?${qs}` : url;
}

// ---------------------------------------------------------------------------
// Error helper
// ---------------------------------------------------------------------------

function createApiError(
    status: number,
    message: string,
    body?: unknown,
): ApiError & Error {
    const err = new Error(message) as ApiError & Error;
    err.status = status;
    err.message = message;
    err.body = body;
    return err;
}

// ---------------------------------------------------------------------------
// GET wrapper
// ---------------------------------------------------------------------------

/**
 * Typed GET request against the API.
 *
 * @throws {ApiError & Error} on HTTP error or network failure
 */
export async function apiGet<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined | null>,
    options?: { signal?: AbortSignal; timeoutMs?: number },
): Promise<T> {
    const url = buildUrl(path, params);
    const timeoutMs = options?.timeoutMs ?? API_TIMEOUT_MS;

    // ---------- timeout ----------
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // Honour caller-provided signal (e.g. React unmount).
    if (options?.signal) {
        options.signal.addEventListener("abort", () => controller.abort(), {
            once: true,
        });
    }

    let response: Response;
    try {
        response = await fetch(url, {
            method: "GET",
            headers: { Accept: "application/json" },
            signal: controller.signal,
        });
    } catch (error: unknown) {
        clearTimeout(timeoutId);
        if (error instanceof DOMException && error.name === "AbortError") {
            throw createApiError(0, `Request timeout after ${timeoutMs}ms: ${path}`);
        }
        throw createApiError(0, `Network error: ${path}`, error);
    } finally {
        clearTimeout(timeoutId);
    }

    // ---------- HTTP error ----------
    if (!response.ok) {
        let body: unknown;
        try {
            body = await response.json();
        } catch {
            try {
                body = await response.text();
            } catch {
                body = null;
            }
        }
        throw createApiError(
            response.status,
            `API ${response.status}: ${path}`,
            body,
        );
    }

    // ---------- parse JSON ----------
    try {
        return (await response.json()) as T;
    } catch {
        throw createApiError(
            response.status,
            `Invalid JSON response: ${path}`,
        );
    }
}
