/**
 * CSRF Double-Submit Cookie — Frontend Utility
 *
 * Reads the `__csrf` cookie set by the backend and returns
 * the matching `x-csrf-token` header for inclusion in fetch() calls.
 *
 * Usage:
 *   fetch('/api/endpoint', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json', ...getCsrfHeaders() },
 *     body: JSON.stringify(payload),
 *   });
 */

/**
 * Read the __csrf cookie value from document.cookie.
 * Returns an empty object if the cookie is not yet set (first visit before any API call).
 */
export function getCsrfHeaders(): Record<string, string> {
  if (typeof document === 'undefined') return {};
  const match = document.cookie.match(/(?:^|;\s*)__csrf=([^;]+)/);
  return match ? { 'x-csrf-token': match[1] } : {};
}
