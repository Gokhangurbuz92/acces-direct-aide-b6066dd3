/**
 * @fileoverview AGEFIPH connector - scrapes https://www.agefiph.fr/
 */

const SourceConnector = require('../SourceConnector');
const { mapKeywordToTheme, mapKeywordToSousTheme, mapKeywordToPublic, extractTerritoire } = require('../taxonomy');
const cheerio = require('cheerio');

class AgefiphConnector extends SourceConnector {
  constructor() {
    super({
      name: 'agefiph',
      domain: 'agefiph.fr',
      rateLimit: 2000,
    });
    this.baseUrl = 'https://www.agefiph.fr';
    // AGEFIPH aides pages - adapt to actual structure
    this.aidesListUrls = [
      'https://www.agefiph.fr/aides-handicap',
      'https://www.agefiph.fr/ressources-handicap/recherche?type=aide',
    ];
  }

  /**
   * Fetch list of aides from AGEFIPH
   * @returns {Promise<Array<Object>>} Raw aide links
   */
  async fetch() {
    const allAideLinks = [];

    for (const listUrl of this.aidesListUrls) {
      console.log(`[${this.name}] Fetching from ${listUrl}`);
      try {
        const response = await this._fetch(listUrl);
        const html = await response.text();
        const $ = cheerio.load(html);

        // AGEFIPH uses cards/links - adapt selector
        $('a[href*="/aides-handicap/"], a[href*="/aide/"], .aide-card a, .dispositif a').each((i, elem) => {
          const href = $(elem).attr('href');
          if (!href || href === '#') return;

          let fullUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;

          if (!allAideLinks.find(a => a.url === fullUrl)) {
            allAideLinks.push({
              url: fullUrl,
              title: $(elem).text().trim() || 'Sans titre',
            });
          }
        });
      } catch (error) {
        console.error(`[${this.name}] Error fetching ${listUrl}:`, error.message);
      }
    }

    console.log(`[${this.name}] Found ${allAideLinks.length} potential aide links`);
    return allAideLinks.slice(0, 50);
  }

  /**
   * Parse individual aide page
   * @param {Object} rawItem
   * @returns {Promise<Object>}
   */
  async parse(rawItem) {
    console.log(`[${this.name}] Parsing ${rawItem.url}`);
    const response = await this._fetch(rawItem.url);
    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $('h1').first().text().trim() || rawItem.title;
    const summary = $('meta[name="description"]').attr('content') || $('.chapo, .intro').first().text().trim() || '';
    const description = $('.content, .description, article').first().text().trim() || '';

    // Conditions
    const conditions = $('h2:contains("Qui"), h3:contains("Bénéficiaires")').next('ul, p').text().trim() || '';

    // Montant
    const montant = $('h2:contains("Montant"), h3:contains("Financement")').next('p').text().trim() || '';

    // Steps
    const steps = $('h2:contains("Comment"), h3:contains("Démarche")').next('ul, ol').find('li').map((i, el) => $(el).text().trim()).get().join('\n') || '';

    // Pièces
    const pieces = $('h2:contains("Pièces"), h3:contains("Documents")').next('ul').find('li').map((i, el) => $(el).text().trim()).get().join('\n') || '';

    // Apply URL
    let applyUrl = '';
    const applyLink = $('a:contains("Faire une demande"), a:contains("Demander cette aide"), a.cta, a.btn-primary').first();
    if (applyLink.length) {
      const href = applyLink.attr('href');
      applyUrl = href && href.startsWith('http') ? href : (href ? `${this.baseUrl}${href}` : '');
    }

    // Contacts
    const contacts = $('h2:contains("Contact")').next('p, ul').text().trim() || 'AGEFIPH - 0 800 11 10 09';

    // Tags
    const tags = $('.tag, .keyword, .thematique').map((i, el) => $(el).text().trim()).get();
    tags.push('handicap'); // Always add handicap tag

    return {
      source_url: rawItem.url,
      title,
      summary,
      description,
      conditions,
      montant,
      steps,
      pieces_a_fournir: pieces,
      apply_url: applyUrl || rawItem.url,
      contacts,
      tags,
      organisme: 'AGEFIPH',
    };
  }

  /**
   * Map to Aide model
   * @param {Object} parsed
   * @returns {Promise<Object>}
   */
  async mapToAide(parsed) {
    // AGEFIPH is always handicap-related
    let theme = 'HANDICAP';
    let sousTheme = null;

    // Try to refine theme from title/tags
    for (const tag of parsed.tags) {
      const mappedTheme = mapKeywordToTheme(tag);
      if (mappedTheme && mappedTheme !== 'HANDICAP') {
        sousTheme = mapKeywordToSousTheme(mappedTheme, tag);
        break;
      }
    }

    const publics = ['Personnes en situation de handicap'];

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
      public: publics,
      theme,
      sous_theme: sousTheme,
      territoire_niveau: territoire.niveau,
      territoire_codes: territoire.codes,
      territoire_label: territoire.label,
      urgent: false,
      statut: 'publie',
      source_url: parsed.source_url,
      apply_url: parsed.apply_url,
      source_domain: this.domain,
      fetched_at: new Date(),
      source_last_modified: null,
      tags: parsed.tags,
      contacts: parsed.contacts,
      falc_summary: null,
      falc_steps: null,
    };
  }
}

module.exports = AgefiphConnector;
