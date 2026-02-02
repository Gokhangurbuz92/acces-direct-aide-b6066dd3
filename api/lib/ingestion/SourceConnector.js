/**
 * @fileoverview Base interface/class for source connectors
 * All source connectors MUST implement this interface to ensure consistent ingestion
 */

const crypto = require('crypto');

/**
 * Base SourceConnector interface
 * All connectors must extend this class and implement abstract methods
 */
class SourceConnector {
  /**
   * @param {Object} config
   * @param {string} config.name - Connector name (e.g., 'grandest', 'agefiph')
   * @param {string} config.domain - Source domain (e.g., 'grandest.fr')
   * @param {number} [config.rateLimit=1000] - Min delay between requests (ms)
   * @param {string} [config.userAgent] - Custom user agent
   */
  constructor(config) {
    if (this.constructor === SourceConnector) {
      throw new Error('SourceConnector is abstract and cannot be instantiated directly');
    }
    this.name = config.name;
    this.domain = config.domain;
    this.rateLimit = config.rateLimit || 1000;
    this.userAgent = config.userAgent || 'AccesDirectAide-Bot/1.0 (contact@accesdirectaide.fr)';
    this.lastRequestTime = 0;
  }

  /**
   * Fetch raw data from source (implement in subclass)
   * @returns {Promise<Array<Object>>} Raw items from source
   */
  async fetch() {
    throw new Error('fetch() must be implemented by subclass');
  }

  /**
   * Parse raw HTML/data (implement in subclass)
   * @param {Object} rawItem
   * @returns {Promise<Object>} Parsed item with extracted fields
   */
  async parse(rawItem) {
    throw new Error('parse() must be implemented by subclass');
  }

  /**
   * Map parsed item to Aide model (implement in subclass)
   * @param {Object} parsedItem
   * @returns {Promise<Object>} Aide object ready for upsert
   */
  async mapToAide(parsedItem) {
    throw new Error('mapToAide() must be implemented by subclass');
  }

  /**
   * Generate stable ID for deduplication (implement in subclass)
   * Default implementation: hash of source_url
   * @param {Object} aide
   * @returns {string} Stable unique ID
   */
  getStableId(aide) {
    if (!aide.source_url) {
      throw new Error('source_url is required for stable ID generation');
    }
    return crypto.createHash('sha256').update(aide.source_url).digest('hex').substring(0, 32);
  }

  /**
   * Generate slug from title
   * @param {string} title
   * @returns {string} URL-safe slug
   */
  generateSlug(title) {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Rate limiting helper
   * @private
   */
  async _respectRateLimit() {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.rateLimit) {
      await new Promise(resolve => setTimeout(resolve, this.rateLimit - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * HTTP fetch with rate limiting and retries
   * @param {string} url
   * @param {Object} [options]
   * @returns {Promise<Response>}
   */
  async _fetch(url, options = {}) {
    await this._respectRateLimit();

    const headers = {
      'User-Agent': this.userAgent,
      ...options.headers,
    };

    const maxRetries = 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, { ...options, headers });
        if (!response.ok && response.status >= 500) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response;
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    throw lastError;
  }

  /**
   * Full ingestion pipeline (fetch -> parse -> map -> return)
   * @returns {Promise<Array<Object>>} Array of Aide objects ready for upsert
   */
  async ingest() {
    const startTime = Date.now();
    console.log(`[${this.name}] Starting ingestion from ${this.domain}`);

    try {
      // 1. Fetch raw data
      const rawItems = await this.fetch();
      console.log(`[${this.name}] Fetched ${rawItems.length} raw items`);

      // 2. Parse + map
      const aides = [];
      const errors = [];

      for (const rawItem of rawItems) {
        try {
          const parsed = await this.parse(rawItem);
          const aide = await this.mapToAide(parsed);
          aide._stableId = this.getStableId(aide);
          aides.push(aide);
        } catch (error) {
          errors.push({ rawItem, error: error.message });
        }
      }

      const duration = Date.now() - startTime;
      console.log(`[${this.name}] Ingestion completed in ${duration}ms: ${aides.length} aides, ${errors.length} errors`);

      if (errors.length > 0) {
        console.warn(`[${this.name}] Errors during ingestion:`, errors.slice(0, 5));
      }

      return { aides, errors, stats: { total: rawItems.length, success: aides.length, failed: errors.length, duration } };
    } catch (error) {
      console.error(`[${this.name}] Fatal error during ingestion:`, error);
      throw error;
    }
  }
}

module.exports = SourceConnector;
