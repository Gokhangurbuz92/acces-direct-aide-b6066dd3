/**
 * @fileoverview Grand Est connector - scrapes https://www.grandest.fr/aides/
 */

const SourceConnector = require('../SourceConnector');
const { mapKeywordToTheme, mapKeywordToSousTheme, mapKeywordToPublic, extractTerritoire } = require('../taxonomy');
const cheerio = require('cheerio');

class GrandEstConnector extends SourceConnector {
  constructor() {
    super({
      name: 'grandest',
      domain: 'grandest.fr',
      rateLimit: 2000, // 2s between requests
    });
    this.baseUrl = 'https://www.grandest.fr';
    this.aidesListUrl = 'https://www.grandest.fr/vos-aides-regionales/';
  }

  /**
   * Fetch list of aides from Grand Est
   * @returns {Promise<Array<Object>>} Raw aide links
   */
  async fetch() {
    console.log(`[${this.name}] Fetching aide list from ${this.aidesListUrl}`);
    const response = await this._fetch(this.aidesListUrl);
    const html = await response.text();
    const $ = cheerio.load(html);

    const aideLinks = [];

    // Grand Est has aide cards with links - adapt selector based on actual HTML structure
    // Common patterns: .aide-card, .dispositif-item, article a, etc.
    // FALLBACK: We'll look for links containing '/aide' or '/dispositif' in href
    $('a[href*="/aide"], a[href*="/dispositif"], a[href*="/vos-aides"]').each((i, elem) => {
      const href = $(elem).attr('href');
      if (!href) return;

      let fullUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;

      // Avoid duplicates
      if (!aideLinks.find(a => a.url === fullUrl)) {
        aideLinks.push({
          url: fullUrl,
          title: $(elem).text().trim() || 'Sans titre',
        });
      }
    });

    console.log(`[${this.name}] Found ${aideLinks.length} potential aide links`);

    // Limit to first 50 for safety (remove in production if needed)
    return aideLinks.slice(0, 50);
  }

  /**
   * Parse individual aide page
   * @param {Object} rawItem - { url, title }
   * @returns {Promise<Object>}
   */
  async parse(rawItem) {
    console.log(`[${this.name}] Parsing ${rawItem.url}`);
    const response = await this._fetch(rawItem.url);
    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract fields - adapt selectors to actual Grand Est HTML structure
    const title = $('h1').first().text().trim() || rawItem.title;
    const summary = $('meta[name="description"]').attr('content') || $('.chapo, .intro, .summary').first().text().trim() || '';
    const description = $('.content, .description, article').first().text().trim() || '';

    // Conditions / eligibility
    const conditions = $('h2:contains("Conditions"), h3:contains("Bénéficiaires")').next('ul, p').text().trim() || '';

    // Montant
    const montant = $('h2:contains("Montant"), h3:contains("Aide financière")').next('p').text().trim() || '';

    // Steps
    const steps = $('h2:contains("Comment"), h3:contains("Démarche")').next('ul, ol').find('li').map((i, el) => $(el).text().trim()).get().join('\n') || '';

    // Pièces
    const pieces = $('h2:contains("Pièces"), h3:contains("Documents")').next('ul').find('li').map((i, el) => $(el).text().trim()).get().join('\n') || '';

    // Apply URL (look for "Faire une demande" button)
    let applyUrl = '';
    const applyLink = $('a:contains("Faire une demande"), a:contains("Demander"), a.btn-primary').first();
    if (applyLink.length) {
      const href = applyLink.attr('href');
      applyUrl = href && href.startsWith('http') ? href : (href ? `${this.baseUrl}${href}` : '');
    }

    // Contacts
    const contacts = $('h2:contains("Contact")').next('p, ul').text().trim() || '';

    // Tags / keywords
    const tags = $('.tag, .keyword').map((i, el) => $(el).text().trim()).get();

    // Last modified (if available in meta or footer)
    let sourceLastModified = null;
    const lastModText = $('meta[name="last-modified"]').attr('content') || $('.last-update, .date-maj').text().trim();
    if (lastModText) {
      sourceLastModified = new Date(lastModText);
    }

    return {
      source_url: rawItem.url,
      title,
      summary,
      description,
      conditions,
      montant,
      steps,
      pieces_a_fournir: pieces,
      apply_url: applyUrl || rawItem.url, // Fallback to source_url if no apply found
      contacts,
      tags,
      source_last_modified: sourceLastModified,
      organisme: 'Région Grand Est',
    };
  }

  /**
   * Map parsed item to Aide model
   * @param {Object} parsed
   * @returns {Promise<Object>}
   */
  async mapToAide(parsed) {
    // Extract theme from title/tags
    let theme = null;
    let sousTheme = null;

    for (const tag of parsed.tags) {
      const mappedTheme = mapKeywordToTheme(tag);
      if (mappedTheme) {
        theme = mappedTheme;
        sousTheme = mapKeywordToSousTheme(theme, tag);
        break;
      }
    }

    if (!theme) {
      theme = mapKeywordToTheme(parsed.title) || mapKeywordToTheme(parsed.description) || 'SOCIAL';
    }

    // Extract public
    const publicCandidates = [...parsed.tags, parsed.conditions, parsed.title];
    const publics = publicCandidates
      .map(p => mapKeywordToPublic(p))
      .filter(Boolean);

    const territoire = extractTerritoire({ organisme: parsed.organisme });

    const slug = this.generateSlug(parsed.title);

    return {
      slug,
      title: parsed.title,
      summary: parsed.summary.substring(0, 500),
      description: parsed.description,
      conditions: parsed.conditions,
      montant_avantage: parsed.montant,
      steps: parsed.steps,
      pieces_a_fournir: parsed.pieces_a_fournir,
      organisme: parsed.organisme,
      public: publics.length > 0 ? publics : ['Tous publics'],
      theme,
      sous_theme: sousTheme,
      territoire_niveau: territoire.niveau,
      territoire_codes: territoire.codes,
      territoire_label: territoire.label,
      urgent: false, // Not extractable from Grand Est, default false
      statut: 'publie',
      source_url: parsed.source_url,
      apply_url: parsed.apply_url,
      source_domain: this.domain,
      fetched_at: new Date(),
      source_last_modified: parsed.source_last_modified,
      tags: parsed.tags,
      contacts: parsed.contacts,
      falc_summary: null, // Not available
      falc_steps: null,
    };
  }
}

module.exports = GrandEstConnector;
