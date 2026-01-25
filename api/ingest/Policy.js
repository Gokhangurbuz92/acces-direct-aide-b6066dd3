// api/ingest/Policy.js

/**
 * Defines the ingestion modes and compliance rules for sources.
 */
export const IngestionMode = {
    API: 'API',                   // Structured API (Best)
    RSS: 'RSS',                   // RSS Feed (Standard)
    SCRAPE: 'SCRAPE',             // HTML Scraping (Fragile, use with care)
    REFERENCE_ONLY: 'REFERENCE_ONLY' // No content ingestion, just link + title
};

/**
 * Returns the policy object for a given source configuration.
 * By default, we prefer official APIs. If a source explicitly forbids scraping via robots.txt (conceptually),
 * or legal constraints, it should be set to REFERENCE_ONLY.
 *
 * @param {string} sourceName - The identifier of the source
 * @param {object} config - Optional config override
 * @returns {object} Policy definition
 */
export function getPolicy(sourceName, config = {}) {
    // Default policy
    let mode = IngestionMode.SCRAPE;

    // Override logic based on source name or config
    // For now, simple mapping, can be extended to DB lookup
    if (config.mode) {
        mode = config.mode;
    }

    return {
        mode,
        canCopyContent: mode !== IngestionMode.REFERENCE_ONLY,
        shouldRespectRobots: true,
        rateLimitDelay: 1000, // ms between requests
    };
}
