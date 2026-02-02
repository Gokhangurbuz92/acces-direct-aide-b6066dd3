/**
 * Base Connector Interface
 * All source connectors must implement this interface
 */

export class BaseConnector {
    constructor(config = {}) {
        this.name = config.name || 'UnnamedConnector';
        this.domain = config.domain || '';
        this.userAgent = config.userAgent || 'AccesDirectAide/1.0 (contact@accesdirectaide.fr)';
        this.rateLimit = config.rateLimit || 1000; // ms between requests
        this.lastRequestTime = 0;
    }

    /**
     * Fetch raw data from source
     * @returns {Promise<Array>} Array of raw items
     */
    async fetch() {
        throw new Error('fetch() must be implemented by connector');
    }

    /**
     * Parse raw item into structured data
     * @param {Object} rawItem - Raw item from source
     * @returns {Object} Parsed item
     */
    parse(rawItem) {
        throw new Error('parse() must be implemented by connector');
    }

    /**
     * Map parsed item to Aide model
     * @param {Object} parsedItem - Parsed item
     * @returns {Object} Aide data ready for DB
     */
    mapToAide(parsedItem) {
        throw new Error('mapToAide() must be implemented by connector');
    }

    /**
     * Generate stable ID for deduplication
     * @param {Object} parsedItem - Parsed item
     * @returns {String} Stable ID (hash or source ID)
     */
    getStableId(parsedItem) {
        throw new Error('getStableId() must be implemented by connector');
    }

    /**
     * Respect rate limiting
     */
    async respectRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.rateLimit) {
            await new Promise(resolve => setTimeout(resolve, this.rateLimit - timeSinceLastRequest));
        }
        this.lastRequestTime = Date.now();
    }

    /**
     * Fetch with rate limiting and error handling
     * @param {String} url - URL to fetch
     * @param {Object} options - Fetch options
     * @returns {Promise<Response>}
     */
    async fetchWithRetry(url, options = {}, retries = 3) {
        await this.respectRateLimit();

        const defaultOptions = {
            headers: {
                'User-Agent': this.userAgent,
                ...options.headers
            },
            ...options
        };

        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url, defaultOptions);
                if (!response.ok && response.status >= 500 && i < retries - 1) {
                    // Retry on server errors
                    await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
                    continue;
                }
                return response;
            } catch (error) {
                if (i === retries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
            }
        }
    }

    /**
     * Normalize theme to taxonomy
     * @param {String} rawTheme - Raw theme from source
     * @returns {String} Normalized theme slug
     */
    normalizeTheme(rawTheme) {
        if (!rawTheme) return null;
        
        const themeMap = {
            'logement': 'logement',
            'hébergement': 'logement',
            'santé': 'sante',
            'handicap': 'handicap',
            'emploi': 'emploi',
            'formation': 'emploi',
            'famille': 'famille',
            'enfance': 'famille',
            'budget': 'budget',
            'finances': 'budget',
            'mobilité': 'mobilite',
            'transport': 'mobilite',
            'justice': 'justice',
            'droits': 'justice',
            'numérique': 'numerique',
            'digital': 'numerique',
            'étrangers': 'etrangers',
            'immigration': 'etrangers',
            'isolement': 'isolement',
            'lien social': 'isolement',
            'lgbtqia': 'lgbtqia',
            'lgbt': 'lgbtqia',
            'vieillissement': 'vieillissement',
            'seniors': 'vieillissement',
            'autonomie': 'vieillissement'
        };

        const normalized = rawTheme.toLowerCase().trim();
        return themeMap[normalized] || null;
    }

    /**
     * Extract domain from URL
     * @param {String} url - Full URL
     * @returns {String} Domain
     */
    extractDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch {
            return this.domain;
        }
    }

    /**
     * Generate content hash for deduplication
     * @param {Object} data - Data to hash
     * @returns {String} Hash
     */
    generateContentHash(data) {
        const crypto = require('crypto');
        const content = JSON.stringify({
            titre: data.titre,
            organisme: data.organisme,
            source_url: data.source_url
        });
        return crypto.createHash('sha256').update(content).digest('hex');
    }
}
