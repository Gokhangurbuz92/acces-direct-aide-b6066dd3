/**
 * Base connector interface for démarches ingestion
 *
 * All source connectors must extend this class and implement:
 * - fetch(): Retrieve raw data from source
 * - parse(rawData): Extract structured info from raw data
 * - mapToDemarche(parsedData): Map to Demarche model
 * - getStableId(parsedData): Generate unique stable ID for dedup
 */

import crypto from 'crypto';

export class SourceConnector {
  /**
   * @param {string} name - Connector name (e.g., "Service-Public.fr")
   * @param {string} domain - Source domain (e.g., "service-public.fr")
   * @param {object} options - Optional config (rate limit, user agent, etc.)
   */
  constructor(name, domain, options = {}) {
    this.name = name;
    this.domain = domain;
    this.options = {
      userAgent: options.userAgent || 'AccesDirectAide-Bot/1.0 (+https://accesdirectaide.fr)',
      rateLimit: options.rateLimit || 1000, // ms between requests
      timeout: options.timeout || 30000, // 30s
      ...options
    };
    this.lastRequestTime = 0;
  }

  /**
   * Fetch raw data from source
   * Must be implemented by subclass
   * @returns {Promise<Array<object>>} - Array of raw items
   */
  async fetch() {
    throw new Error(`fetch() not implemented in ${this.name}`);
  }

  /**
   * Parse raw data into structured format
   * Must be implemented by subclass
   * @param {object} rawData - Raw data from source
   * @returns {Promise<object>} - Parsed data
   */
  async parse(rawData) {
    throw new Error(`parse() not implemented in ${this.name}`);
  }

  /**
   * Map parsed data to Demarche model
   * Must be implemented by subclass
   * @param {object} parsedData - Parsed data
   * @returns {Promise<object>} - Demarche object
   */
  async mapToDemarche(parsedData) {
    throw new Error(`mapToDemarche() not implemented in ${this.name}`);
  }

  /**
   * Generate stable ID for deduplication
   * Default: hash(source_url)
   * @param {object} parsedData - Parsed data
   * @returns {string} - Stable ID
   */
  getStableId(parsedData) {
    if (!parsedData.source_url) {
      throw new Error('source_url is required for stable ID generation');
    }
    return crypto.createHash('sha256').update(parsedData.source_url).digest('hex').substring(0, 16);
  }

  /**
   * Compute content hash for change detection
   * @param {object} demarcheData - Demarche object
   * @returns {string} - Content hash
   */
  computeContentHash(demarcheData) {
    // Hash based on key content fields (exclude metadata like fetched_at)
    const content = JSON.stringify({
      titre: demarcheData.titre,
      description_courte: demarcheData.description_courte,
      etapes: demarcheData.etapes,
      documents_necessaires: demarcheData.documents_necessaires,
      pieces_a_fournir: demarcheData.pieces_a_fournir,
      apply_url: demarcheData.apply_url,
      organisme: demarcheData.organisme
    });
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Rate limiting helper
   */
  async respectRateLimit() {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.options.rateLimit) {
      const waitTime = this.options.rateLimit - elapsed;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * HTTP fetch helper with rate limiting and error handling
   * @param {string} url - URL to fetch
   * @returns {Promise<Response>}
   */
  async httpFetch(url) {
    await this.respectRateLimit();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.options.userAgent,
          'Accept': 'text/html,application/json,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.options.timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Extract Last-Modified header if present
   * @param {Response} response - HTTP response
   * @returns {Date|null}
   */
  extractLastModified(response) {
    const lastModified = response.headers.get('Last-Modified');
    if (lastModified) {
      const date = new Date(lastModified);
      return isNaN(date.getTime()) ? null : date;
    }
    return null;
  }

  /**
   * Log helper
   */
  log(level, message, data = {}) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      connector: this.name,
      message,
      ...data
    }));
  }
}
