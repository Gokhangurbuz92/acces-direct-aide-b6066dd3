/**
 * BASE CONNECTOR ARCHITECTURE
 *
 * Abstract base class for all actualites connectors
 */

import { normalizeUrl, extractDomain, generateStableId } from '../url-utils.js';
import { classifyTopics, classifyImpact, calculateReliabilityScore, classifyAudience } from '../classification.js';
import { enrichArticle } from '../ai-enrichment.js';

export class BaseConnector {
  /**
   * @param {Object} config
   * @param {string} config.name
   * @param {string} config.domain
   * @param {string} config.source_type - "official" | "institution" | "association" | "media"
   * @param {number} config.trust_level
   */
  constructor(config) {
    this.name = config.name;
    this.domain = config.domain;
    this.source_type = config.source_type || 'official';
    this.trust_level = config.trust_level || 50;
    this.topics_hint = config.topics_hint || [];
    this.audience_hint = config.audience_hint || [];
  }

  /**
   * Discover new items from the source
   * Must be implemented by subclass
   *
   * @param {Object} options
   * @param {number} options.limit - Max items to discover
   * @returns {Promise<Array<Object>>} - Raw items from source
   */
  async discover({ limit }) {
    throw new Error('discover() must be implemented by connector');
  }

  /**
   * Fetch full details for a single item
   * Optional - default implementation returns the item as-is
   *
   * @param {Object} item - Raw item from discover()
   * @returns {Promise<Object>} - Enriched item
   */
  async fetchItem(item) {
    return item;
  }

  /**
   * Parse raw item into normalized format
   * Must be implemented by subclass
   *
   * @param {Object} rawItem - Raw item from source
   * @returns {Promise<Object>} - Normalized actualite object
   */
  async parse(rawItem) {
    throw new Error('parse() must be implemented by connector');
  }

  /**
   * Map normalized item to DB format with classification
   *
   * @param {Object} normalized
   * @param {Object} aiEnrichments - AI-generated enrichments (optional)
   * @returns {Object} - Ready for DB upsert
   */
  map(normalized, aiEnrichments = {}) {
    // Normalize URLs
    const canonical_url = normalizeUrl(normalized.source_url || '');
    const source_domain = extractDomain(normalized.source_url || '');

    // Classify topics
    const topicsClassification = classifyTopics({
      title: normalized.title || '',
      excerpt: normalized.excerpt || '',
      content: normalized.content || '',
      tags: normalized.tags || [],
      source_domain
    });

    // Classify impact
    const impact = classifyImpact({
      title: normalized.title || '',
      excerpt: normalized.excerpt || '',
      content: normalized.content || '',
      tags: normalized.tags || []
    });

    // Classify audience
    const audience = classifyAudience({
      title: normalized.title || '',
      excerpt: normalized.excerpt || '',
      content: normalized.content || '',
      topics: topicsClassification.topics
    });

    // Calculate reliability
    const reliability_score = calculateReliabilityScore({
      source_type: this.source_type,
      source_domain,
      has_exact_url: !!normalized.source_url
    });

    // Generate stable ID for dedup
    const stable_id = generateStableId({
      canonical_url,
      source_url: normalized.source_url,
      title: normalized.title,
      source_published_at: normalized.source_published_at
    });

    return {
      // Core content
      titre: normalized.title,
      slug: normalized.slug,
      excerpt: normalized.excerpt,
      contenu: normalized.content,
      content_markdown: normalized.content_markdown,
      falc_summary: aiEnrichments.falc_summary || normalized.falc_summary,
      change_summary: aiEnrichments.change_summary || normalized.change_summary,
      next_steps: aiEnrichments.next_steps || normalized.next_steps,

      // Topics (AI-enhanced if available)
      topics: aiEnrichments.topics || topicsClassification.topics,
      topic_primary: aiEnrichments.topic_primary || topicsClassification.topic_primary,
      tags: normalized.tags || [],

      // Impact & Audience (AI-enhanced if available)
      impact: aiEnrichments.impact || impact,
      audience,

      // Territory
      territory_level: normalized.territory_level,
      territory_codes: normalized.territory_codes || [],
      territoire: normalized.territoire || 'FRANCE',
      departements: normalized.departements || [],

      // Source tracking
      source_name: this.name,
      source_domain,
      source_type: this.source_type,
      reliability_score,
      source_url: normalized.source_url,
      canonical_url,
      source_published_at: normalized.source_published_at,
      source_last_modified: normalized.source_last_modified,

      // Ingestion tracking
      fetched_at: new Date(),
      first_seen_at: new Date(),
      raw_data_hash: stable_id,
      dedupe_hash: stable_id,

      // Dates
      date_publication: normalized.source_published_at || new Date(),

      // Status
      statut: this.source_type === 'official' ? 'publie' : 'brouillon',
      status: this.source_type === 'official' ? 'publie' : 'brouillon',
      quality_score: reliability_score,
      auto_publish: this.source_type === 'official',

      // Related
      related_aide_slugs: normalized.related_aide_slugs || [],
      related_demarche_slugs: normalized.related_demarche_slugs || [],

      // Legacy fields (for compatibility)
      categorie: topicsClassification.topic_primary,
      type_actu: impact,
      est_important: impact === 'important' || impact === 'alerte',
      score_fiabilite: reliability_score
    };
  }

  /**
   * Full pipeline: discover → parse → map (with optional AI enrichment)
   *
   * @param {Object} options
   * @param {number} options.limit
   * @param {boolean} options.useAI - Enable AI enrichment (default: true if BLACKBOX_API_KEY set)
   * @returns {Promise<Array<Object>>} - Items ready for DB upsert
   */
  async run({ limit, useAI = !!process.env.BLACKBOX_API_KEY }) {
    const rawItems = await this.discover({ limit });
    const mapped = [];

    for (const rawItem of rawItems) {
      try {
        const enriched = await this.fetchItem(rawItem);
        const normalized = await this.parse(enriched);

        // AI enrichment (optional)
        let aiEnrichments = {};
        if (useAI && process.env.BLACKBOX_API_KEY) {
          try {
            aiEnrichments = await enrichArticle({
              title: normalized.title,
              excerpt: normalized.excerpt,
              content: normalized.content,
              topics: normalized.topics || [],
              impact: normalized.impact || 'info'
            });
          } catch (aiError) {
            console.warn(`[${this.name}] AI enrichment failed, continuing without it:`, aiError.message);
          }
        }

        const dbReady = this.map(normalized, aiEnrichments);
        mapped.push(dbReady);
      } catch (error) {
        console.error(`[${this.name}] Error processing item:`, error);
        // Continue with other items
      }
    }

    return mapped;
  }
}
