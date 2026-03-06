import { logger } from '../logger.js';
import { SourceConnector } from './SourceConnector.js';
import crypto from 'crypto';

const API_BASE = 'https://aides-territoires.beta.gouv.fr/api/aids/';
const PAGE_SIZE = 50;
const MAX_PAGES = 100; // Safety cap: 50 * 100 = 5000 aides max

/**
 * Connector for the Aides Territoires API (beta.gouv.fr).
 *
 * Public API — no token needed for read access.
 * Docs: https://aides-territoires.beta.gouv.fr/api/swagger/
 *
 * This connector fetches published aides with pagination and caches
 * them in memory so the ingest-aids pipeline can process them one by one.
 */
export class AidesTerritoiresConnector extends SourceConnector {
    constructor() {
        super('aides-territoires', 'https://aides-territoires.beta.gouv.fr');
        /** @type {Map<string, object>} */
        this._cache = new Map();
    }

    /**
     * Fetches all published aides from the API (paginated).
     * Returns a list of "virtual" URLs (one per aide) that the pipeline
     * will pass back to fetch() and parse().
     *
     * @returns {Promise<string[]>}
     */
    async getDetailUrls() {
        this._cache.clear();
        let nextUrl = `${API_BASE}?published=true&page_size=${PAGE_SIZE}`;
        let page = 0;

        while (nextUrl && page < MAX_PAGES) {
            page++;
            let response;
            let retries = 0;
            const maxRetries = 1;

            while (retries <= maxRetries) {
                try {
                    const headers = { Accept: 'application/json' };
                    // API v1.8+ requires auth — X-AUTH-TOKEN per OpenAPI spec
                    const apiKey = process.env.AIDES_TERRITOIRES_API_KEY;
                    if (apiKey) {
                        headers['X-AUTH-TOKEN'] = apiKey;
                        headers['Authorization'] = `Bearer ${apiKey}`;
                    }
                    response = await fetch(nextUrl, {
                        headers,
                        signal: AbortSignal.timeout(30_000),
                    });
                    if (response.ok) break;
                    // Retry on 5xx
                    if (response.status >= 500 && retries < maxRetries) {
                        retries++;
                        logger.warn(`[AidesTerritoires] Retry ${retries}/${maxRetries} after ${response.status} on page ${page}`);
                        await new Promise(r => setTimeout(r, 2000));
                        continue;
                    }
                    throw new Error(`Aides Territoires API ${response.status}: ${response.statusText}`);
                } catch (err) {
                    if (retries < maxRetries && err.name !== 'AbortError') {
                        retries++;
                        logger.warn(`[AidesTerritoires] Retry ${retries}/${maxRetries} after error on page ${page}: ${err.message}`);
                        await new Promise(r => setTimeout(r, 2000));
                        continue;
                    }
                    throw err;
                }
            }

            const data = await response.json();
            const results = data.results || [];

            for (const item of results) {
                const key = item.slug || item.id || crypto.randomUUID();
                const virtualUrl = `${this.baseUrl}/aides/${key}/`;
                this._cache.set(virtualUrl, item);
            }

            nextUrl = data.next || null;

            // Log progress every 10 pages
            if (page % 10 === 0) {
                logger.info(`[AidesTerritoires] Fetched page ${page}, cache size: ${this._cache.size}`);
            }
        }

        logger.info(`[AidesTerritoires] Total fetched: ${this._cache.size} aides across ${page} pages`);
        return Array.from(this._cache.keys());
    }

    /**
     * Returns the cached JSON for the given virtual URL.
     * @param {string} url
     * @returns {Promise<string>}
     */
    async fetch(url) {
        const item = this._cache.get(url);
        if (!item) throw new Error(`No cached item for ${url}`);
        return JSON.stringify(item);
    }

    /**
     * Parses a cached API item into the normalized aide format.
     * @param {string} json - JSON string from fetch()
     * @param {string} url - Virtual URL
     * @returns {Promise<{
     *   title: string, description: string, content: string,
     *   source_url: string, apply_url: string|null, theme: string|null,
     *   fetched_at: Date,
     *   _territory_scope: string, _source_last_modified: Date|null,
     *   _montant_max: string|null, _echelon_territorial: string|null,
     *   _code_insee_territoire: string|null, _source_donnee: string,
     *   _lien_demarche: string|null, _financers: string|null,
     *   _targeted_audiences: string[]
     * }>}
     */
    async parse(json, url) {
        const item = JSON.parse(json);

        const title = (item.name || '').trim();
        const description = this._cleanHtml(item.description || '').substring(0, 500);
        const content = this._cleanHtml(item.description || '');
        const sourceUrl = item.url || url;
        const applyUrl = item.application_url || item.origin_url || null;

        // Map AT categories to our themes
        let theme = null;
        const categories = item.categories || [];
        if (categories.length > 0) {
            // Use the first category slug as theme
            theme = categories[0];
        }

        // ── Cahier des charges enrichment ──

        // Montant max: extract from subvention or loan fields
        let montantMax = null;
        if (item.subvention_rate_upper_bound) {
            montantMax = `${item.subvention_rate_upper_bound}%`;
        } else if (item.loan_amount) {
            montantMax = `${item.loan_amount}€`;
        } else if (item.recoverable_advance_amount) {
            montantMax = `${item.recoverable_advance_amount}€ (avance récupérable)`;
        }

        // Echelon territorial: map from AT perimeter scale
        const echelonTerritorial = this._mapPerimeter(item.perimeter);

        // Code INSEE territoire: extract from perimeter details
        let codeInseeTerritoire = null;
        if (item.perimeter) {
            // perimeter can be a string like "Strasbourg (67)" or an object
            const perimStr = typeof item.perimeter === 'string' ? item.perimeter : (item.perimeter_scale || '');
            const codeMatch = perimStr.match(/\((\d{2,5})\)/);
            if (codeMatch) codeInseeTerritoire = codeMatch[1];
        }

        // Financers (porteurs): flatten to comma-separated string
        const financers = Array.isArray(item.financers)
            ? item.financers.map(f => typeof f === 'string' ? f : (f?.name || '')).filter(Boolean).join(', ')
            : null;

        // Targeted audiences
        const targetedAudiences = Array.isArray(item.targeted_audiences)
            ? item.targeted_audiences.filter(a => typeof a === 'string')
            : [];

        return {
            title,
            description,
            content,
            source_url: sourceUrl,
            apply_url: applyUrl,
            theme,
            fetched_at: new Date(),
            // Enriched metadata for ingest-aids.js
            _territory_scope: echelonTerritorial,
            _source_last_modified: item.date_updated ? new Date(item.date_updated) : null,
            _montant_max: montantMax,
            _echelon_territorial: echelonTerritorial,
            _code_insee_territoire: codeInseeTerritoire,
            _source_donnee: 'Aides-Territoires',
            _lien_demarche: applyUrl,
            _financers: financers || null,
            _targeted_audiences: targetedAudiences,
        };
    }

    /**
     * @param {object} item
     * @returns {string}
     */
    getStableId(item) {
        return crypto.createHash('md5').update(item.source_url || '').digest('hex');
    }

    /**
     * Map Aides Territoires perimeter to our territory_scope enum.
     * @param {string|null} perimeter
     * @returns {string}
     */
    _mapPerimeter(perimeter) {
        if (!perimeter) return 'NATIONAL';
        const p = (typeof perimeter === 'string' ? perimeter : '').toLowerCase();
        if (p.includes('commune')) return 'COMMUNAL';
        if (p.includes('département') || p.includes('departement')) return 'DEPARTMENTAL';
        if (p.includes('région') || p.includes('region')) return 'REGIONAL';
        return 'NATIONAL';
    }

    /**
     * Strip HTML tags from text.
     * @param {string} html
     * @returns {string}
     */
    _cleanHtml(html) {
        return html
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\s+/g, ' ')
            .trim();
    }
}
