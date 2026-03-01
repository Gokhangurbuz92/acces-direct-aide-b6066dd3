import { logger } from '../logger.js';
import { SourceConnector } from './SourceConnector.js';
import crypto from 'crypto';

/**
 * Default dataset URL — DILA "Fiches pratiques particuliers" from data.gouv.fr.
 * Override with env var SERVICE_PUBLIC_DEMARCHES_DATASET_URL.
 *
 * The dataset provides thousands of "fiches pratiques" covering administrative
 * procedures for French citizens (démarches, droits, formulaires).
 *
 * Source: https://www.data.gouv.fr/fr/datasets/service-public-fr-guide-vos-droits-et-demarches-particuliers/
 * License: Licence Ouverte v2.0 — Attribution "Service-Public.gouv.fr / DILA"
 */
const DEFAULT_DATASET_URL =
    'https://www.data.gouv.fr/fr/datasets/r/4afe86da-211a-49f5-a4f2-dea85e69d0f1';

const MAX_ITEMS = 10000; // Safety cap
const FETCH_TIMEOUT_MS = 45_000; // 45s (Vercel limit is 50s)

/**
 * Category mapping from Service-Public themes to ADA categories.
 */
const THEME_TO_CATEGORY = {
    'logement': 'logement',
    'social-sante': 'sante',
    'social - santé': 'sante',
    'travail': 'emploi',
    'famille': 'famille',
    'argent': 'argent',
    'justice': 'droits',
    'papiers-citoyennete': 'papiers',
    'papiers - citoyenneté': 'papiers',
    'transports': 'mobilite',
    'loisirs': 'loisirs',
    'etrangers': 'etranger',
    'étranger en france': 'etranger',
    'étrangers en france': 'etranger',
    'formation': 'formation',
    'associations': 'administratif',
    'creation-entreprise': 'emploi',
};

function mapCategory(themes) {
    if (!themes) return 'administratif';
    const raw = Array.isArray(themes) ? themes : [themes];
    for (const t of raw) {
        const key = String(t).toLowerCase().trim();
        if (THEME_TO_CATEGORY[key]) return THEME_TO_CATEGORY[key];
        // Partial match
        for (const [pattern, cat] of Object.entries(THEME_TO_CATEGORY)) {
            if (key.includes(pattern)) return cat;
        }
    }
    return 'administratif';
}

function cleanHtml(html) {
    if (!html) return '';
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

/**
 * Connector for Service-Public.fr "Fiches pratiques" dataset (DILA).
 *
 * Auto-detects JSON vs XML based on Content-Type:
 *  - JSON (array of objects): direct parse
 *  - XML: basic regex parse for <Publication> elements
 *
 * Each fiche becomes a Démarche with:
 *  slug, titre, description_courte, lien_officiel, source_url, categorie, audiences
 */
export class ServicePublicDemarchesConnector extends SourceConnector {
    constructor() {
        super(
            'service-public',
            'https://www.service-public.fr'
        );
        /** @type {Map<string, object>} */
        this._cache = new Map();
        this._datasetUrl = process.env.SERVICE_PUBLIC_DEMARCHES_DATASET_URL || DEFAULT_DATASET_URL;
    }

    /**
     * Fetches the dataset (JSON or XML) and returns virtual URLs.
     * @returns {Promise<string[]>}
     */
    async getDetailUrls() {
        this._cache.clear();

        logger.info(`[ServicePublic] Fetching dataset from: ${this._datasetUrl}`);

        const response = await fetch(this._datasetUrl, {
            headers: { Accept: 'application/json, application/xml, text/xml' },
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
            redirect: 'follow',
        });

        if (!response.ok) {
            throw new Error(`Service-Public dataset HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = (response.headers.get('content-type') || '').toLowerCase();
        const body = await response.text();

        let items;
        if (contentType.includes('json') || body.trimStart().startsWith('[') || body.trimStart().startsWith('{')) {
            items = this._parseJSON(body);
        } else {
            items = this._parseXML(body);
        }

        logger.info(`[ServicePublic] Parsed ${items.length} fiches from dataset`);

        // Filter: keep only "Particuliers" scope if available, and only fiches with titles
        let filtered = items.filter(item => {
            if (!item.titre || String(item.titre).trim().length < 5) return false;
            // If audience/scope is specified, keep only Particuliers
            if (item.audience && !String(item.audience).toLowerCase().includes('particulier')) return false;
            return true;
        });

        // Safety cap
        if (filtered.length > MAX_ITEMS) {
            filtered = filtered.slice(0, MAX_ITEMS);
        }

        for (const item of filtered) {
            const key = item.id || item.slug || crypto.randomUUID();
            const virtualUrl = `${this.baseUrl}/particuliers/vosdroits/${key}`;
            this._cache.set(virtualUrl, item);
        }

        logger.info(`[ServicePublic] After filtering: ${this._cache.size} fiches (Particuliers scope)`);
        return Array.from(this._cache.keys());
    }

    /**
     * @param {string} url
     * @returns {Promise<string>}
     */
    async fetch(url) {
        const item = this._cache.get(url);
        if (!item) throw new Error(`No cached item for ${url}`);
        return JSON.stringify(item);
    }

    /**
     * @param {string} json
     * @param {string} url
     * @returns {Promise<object>}
     */
    async parse(json, url) {
        const item = JSON.parse(json);
        return {
            titre: (item.titre || '').trim(),
            description_courte: cleanHtml(item.description || item.introduction || item.texte || '').substring(0, 300),
            contenu_detaille: cleanHtml(item.texte || item.description || ''),
            pour_qui: item.pour_qui || item.beneficiaires || null,
            lien_officiel: item.url || item.lien_officiel || url,
            source_url: item.url || url,
            source_url_exact: item.url || url,
            source_host: 'service-public.fr',
            categorie: mapCategory(item.theme || item.themes || item.categorie),
            audiences: item.audiences || ['Particuliers'],
            territory_scope: 'NATIONAL',
            external_id: item.id || null,
            source_api: 'service-public-dila',
            fetched_at: new Date(),
        };
    }

    /**
     * @param {object} item
     * @returns {string}
     */
    getStableId(item) {
        return crypto.createHash('md5').update(item.source_url || item.titre || '').digest('hex');
    }

    // -----------------------------------------------------------------------
    // Parsers
    // -----------------------------------------------------------------------

    /**
     * Parse JSON dataset. Handles both array format and {results:[]} format.
     * @param {string} body
     * @returns {object[]}
     */
    _parseJSON(body) {
        try {
            const data = JSON.parse(body);
            if (Array.isArray(data)) return data;
            if (data.results && Array.isArray(data.results)) return data.results;
            // Single object with nested data
            if (data.data && Array.isArray(data.data)) return data.data;
            // Object with fiches
            if (data.fiches && Array.isArray(data.fiches)) return data.fiches;
            // If it's a paginated response
            if (data.next && data.results) return data.results;
            // Wrap single item
            if (data.titre || data.title || data.id) return [data];
            logger.warn('[ServicePublic] Unexpected JSON structure, keys:', Object.keys(data).slice(0, 10));
            return [];
        } catch (e) {
            logger.error('[ServicePublic] JSON parse error:', e.message);
            return [];
        }
    }

    /**
     * Parse XML dataset. Extracts <Publication> or <Fiche> elements.
     * Basic regex-based parser (no XML library dependency).
     * @param {string} body
     * @returns {object[]}
     */
    _parseXML(body) {
        const items = [];

        // Try to match <Publication> or <Fiche> or <Dossier> elements
        const patterns = [
            /<Publication[^>]*>([\s\S]*?)<\/Publication>/gi,
            /<Fiche[^>]*>([\s\S]*?)<\/Fiche>/gi,
            /<FichePratique[^>]*>([\s\S]*?)<\/FichePratique>/gi,
        ];

        for (const regex of patterns) {
            let match;
            while ((match = regex.exec(body)) !== null) {
                const block = match[1] || match[0];
                const item = this._extractFromXmlBlock(block, match[0]);
                if (item.titre) {
                    items.push(item);
                }
            }
            if (items.length > 0) break; // Use first matching pattern
        }

        // If no structured elements found, try flat tag extraction
        if (items.length === 0) {
            logger.warn('[ServicePublic] No structured XML elements found, trying flat extraction');
            const titles = body.match(/<dc:title>(.*?)<\/dc:title>/gi) || [];
            for (const titleTag of titles) {
                const titre = titleTag.replace(/<\/?dc:title>/gi, '').trim();
                if (titre.length >= 5) {
                    items.push({ titre, id: crypto.randomUUID() });
                }
            }
        }

        return items;
    }

    /**
     * @param {string} block
     * @param {string} fullMatch
     * @returns {object}
     */
    _extractFromXmlBlock(block, fullMatch) {
        const get = (tag) => {
            const m = block.match(new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, 'is'));
            return m ? cleanHtml(m[1]) : null;
        };
        const getAttr = (attr) => {
            const m = fullMatch.match(new RegExp(`${attr}="([^"]*)"`, 'i'));
            return m ? m[1] : null;
        };

        return {
            id: getAttr('ID') || getAttr('id') || get('Identifiant') || crypto.randomUUID(),
            titre: get('dc:title') || get('titre') || get('Titre') || get('title') || '',
            description: get('dc:description') || get('Introduction') || get('Texte') || get('Resume') || '',
            texte: get('Texte') || get('Corps') || '',
            url: get('FilAriane')
                ? `https://www.service-public.fr/particuliers/vosdroits/${getAttr('ID') || ''}`
                : null,
            theme: get('Theme') || get('dc:subject') || null,
            audience: get('Audience') || getAttr('audience') || 'Particuliers',
            pour_qui: get('Beneficiaires') || null,
        };
    }
}
