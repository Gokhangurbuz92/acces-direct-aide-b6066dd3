/**
 * Service-Public.fr Connector
 *
 * Source: https://www.service-public.fr
 * Strategy: Uses the Service-Public API v2 (https://api.service-public.fr)
 * OR scrapes public pages if API not available
 *
 * IMPORTANT: This is a reference implementation.
 * Service-Public.fr has a public API for some data but scraping may be needed for details.
 * Always respect robots.txt and rate limits.
 */

import { SourceConnector } from './base.js';
import { mapCategoryFromSource } from '../../taxonomies/demarches.categories.js';
import { mapSituationFromSource } from '../../taxonomies/demarches.situations.js';
import * as cheerio from 'cheerio';

export class ServicePublicConnector extends SourceConnector {
  constructor() {
    super('Service-Public.fr', 'service-public.fr', {
      rateLimit: 2000, // 2s between requests (respectful)
      baseUrl: 'https://www.service-public.fr'
    });
  }

  /**
   * Fetch démarches from Service-Public.fr
   * Strategy: Use sitemap or known URL patterns
   */
  async fetch() {
    this.log('info', 'Starting fetch from Service-Public.fr');

    // STRATEGY 1: Use known common démarches URLs (curated list)
    // In production, you would either:
    // - Parse sitemap.xml
    // - Use Service-Public API if available
    // - Maintain a curated list of high-priority pages

    const commonDemarchesUrls = [
      // Identité
      'https://www.service-public.fr/particuliers/vosdroits/F1341', // Carte d'identité
      'https://www.service-public.fr/particuliers/vosdroits/F14503', // Passeport
      'https://www.service-public.fr/particuliers/vosdroits/F1427', // Acte de naissance

      // Mobilité
      'https://www.service-public.fr/particuliers/vosdroits/F1758', // Permis de conduire
      'https://www.service-public.fr/particuliers/vosdroits/F1050', // Carte grise

      // Logement
      'https://www.service-public.fr/particuliers/vosdroits/F12006', // Aide au logement

      // Santé
      'https://www.service-public.fr/particuliers/vosdroits/F265', // Carte Vitale
      'https://www.service-public.fr/particuliers/vosdroits/F34308', // Complémentaire santé solidaire

      // Emploi
      'https://www.service-public.fr/particuliers/vosdroits/F14926', // Inscription Pôle Emploi

      // Famille
      'https://www.service-public.fr/particuliers/vosdroits/F2550', // Allocations familiales

      // Budget
      'https://www.service-public.fr/particuliers/vosdroits/F502', // RSA
      'https://www.service-public.fr/particuliers/vosdroits/F2882', // Prime d'activité
      'https://www.service-public.fr/particuliers/vosdroits/F358', // Déclaration impôts

      // Handicap
      'https://www.service-public.fr/particuliers/vosdroits/F12242', // AAH

      // Retraite
      'https://www.service-public.fr/particuliers/vosdroits/F15675', // Demande de retraite

      // Immigration
      'https://www.service-public.fr/particuliers/vosdroits/F2209', // Titre de séjour
    ];

    const rawItems = [];

    for (const url of commonDemarchesUrls) {
      try {
        this.log('info', 'Fetching page', { url });
        const response = await this.httpFetch(url);
        const html = await response.text();
        const lastModified = this.extractLastModified(response);

        rawItems.push({
          url,
          html,
          lastModified,
          fetchedAt: new Date()
        });

        this.log('info', 'Fetched successfully', { url });
      } catch (error) {
        this.log('error', 'Fetch failed', { url, error: error.message });
      }
    }

    this.log('info', 'Fetch completed', { total: rawItems.length });
    return rawItems;
  }

  /**
   * Parse Service-Public.fr HTML page
   */
  async parse(rawData) {
    const $ = cheerio.load(rawData.html);

    // Extract metadata
    const titre = $('h1').first().text().trim() ||
                  $('meta[property="og:title"]').attr('content') ||
                  'Titre non trouvé';

    const description = $('meta[name="description"]').attr('content') ||
                       $('meta[property="og:description"]').attr('content') ||
                       '';

    // Extract main content sections
    const sections = {};

    // "C'est quoi" / "De quoi s'agit-il ?" section
    $('h2').each((i, elem) => {
      const heading = $(elem).text().trim();
      const content = $(elem).nextUntil('h2').text().trim();

      if (heading.match(/quoi|agit|présentation/i)) {
        sections.description = content;
      } else if (heading.match(/qui|concerné|bénéficiaire/i)) {
        sections.pourQui = content;
      } else if (heading.match(/étapes|démarche|procédure/i)) {
        sections.etapes = content;
      } else if (heading.match(/documents|pièces|justificatifs/i)) {
        sections.documents = content;
      } else if (heading.match(/où|comment|faire/i)) {
        sections.ouFaire = content;
      } else if (heading.match(/délai|durée/i)) {
        sections.delai = content;
      } else if (heading.match(/coût|montant/i)) {
        sections.cout = content;
      }
    });

    // Extract structured steps if available
    const etapes = [];
    $('.sp-procedure-step, .demarche-etape').each((i, elem) => {
      const stepTitle = $(elem).find('h3, .step-title').first().text().trim();
      const stepDescription = $(elem).find('p, .step-content').text().trim();
      if (stepTitle || stepDescription) {
        etapes.push({
          numero: i + 1,
          titre: stepTitle || `Étape ${i + 1}`,
          description: stepDescription,
          conseils: null
        });
      }
    });

    // Extract documents list
    const documents = [];
    $('ul li, .document-item').each((i, elem) => {
      const text = $(elem).text().trim();
      if (text && text.match(/justificatif|document|pièce|attestation|certificat/i)) {
        documents.push(text);
      }
    });

    // Extract links
    const applyUrl = $('a[href*="demarches"], a[href*="teleservice"]').first().attr('href') || null;
    const sourceUrl = rawData.url;

    // Extract organisme (infer from domain/context)
    const organisme = this.extractOrganisme(titre, sections);

    // Extract canal (infer from content)
    const canal = this.extractCanal($, sections);

    // Extract territoire
    const territoire = this.extractTerritoire($, sections);

    return {
      titre,
      description_courte: description.substring(0, 300),
      description: sections.description || description,
      pour_qui: sections.pourQui || null,
      etapes: etapes.length > 0 ? etapes : null,
      documents_necessaires: documents.slice(0, 10), // Limit to 10
      ou_faire: sections.ouFaire || null,
      delai: sections.delai || null,
      cout: sections.cout || null,
      source_url: sourceUrl,
      apply_url: applyUrl ? (applyUrl.startsWith('http') ? applyUrl : `https://www.service-public.fr${applyUrl}`) : null,
      organisme,
      canal,
      territoire_niveau: territoire.niveau,
      territoire_codes: territoire.codes,
      territoire_label: territoire.label,
      source_last_modified: rawData.lastModified,
      fetched_at: rawData.fetchedAt
    };
  }

  /**
   * Map parsed data to Demarche model
   */
  async mapToDemarche(parsedData) {
    // Map category
    const categorieKey = mapCategoryFromSource(parsedData.titre);

    // Map situation (if applicable)
    const situationKey = mapSituationFromSource(parsedData.pour_qui || '');

    // Generate slug
    const slug = this.generateSlug(parsedData.titre);

    // Compute content hash
    const contentHash = this.computeContentHash(parsedData);

    return {
      slug,
      titre: parsedData.titre,
      description_courte: parsedData.description_courte,
      categorie: categorieKey, // Legacy field
      // categoryId will be resolved in ingestion pipeline
      pour_qui: parsedData.pour_qui,
      documents_necessaires: parsedData.documents_necessaires,
      pieces_a_fournir: parsedData.documents_necessaires, // Duplicate for now
      etapes: parsedData.etapes,
      steps: parsedData.etapes, // Normalized field
      ou_faire: parsedData.ou_faire,
      location: parsedData.ou_faire,
      delai: parsedData.delai,
      processing_time: parsedData.delai,
      cout: parsedData.cout,
      cost: parsedData.cout,
      source_url: parsedData.source_url,
      source_url_exact: parsedData.source_url,
      apply_url: parsedData.apply_url || parsedData.source_url,
      source_domain: this.domain,
      organisme: parsedData.organisme,
      canal: parsedData.canal,
      territoire_niveau: parsedData.territoire_niveau,
      territoire_codes: parsedData.territoire_codes,
      territoire_label: parsedData.territoire_label,
      fetched_at: parsedData.fetched_at,
      source_last_modified: parsedData.source_last_modified,
      content_hash: contentHash,
      statut: 'publie', // Auto-publish Service-Public content
      quality_score: 90, // High quality official source
      mots_cles: this.extractKeywords(parsedData),
      // FALC fields (to be generated separately if needed)
      falc_summary: null,
      falc_steps: null,
      // Relations (to be linked in pipeline)
      _categoryKey: categorieKey,
      _situationKey: situationKey
    };
  }

  /**
   * Extract organisme from content
   */
  extractOrganisme(titre, sections) {
    const text = `${titre} ${JSON.stringify(sections)}`.toLowerCase();

    if (text.includes('ants') || text.includes('carte grise') || text.includes('permis')) return 'ANTS';
    if (text.includes('ameli') || text.includes('carte vitale') || text.includes('assurance maladie')) return 'Ameli';
    if (text.includes('caf') || text.includes('allocations familiales')) return 'CAF';
    if (text.includes('pole emploi') || text.includes('france travail')) return 'France Travail';
    if (text.includes('impot') || text.includes('fiscal')) return 'Impôts';
    if (text.includes('prefecture')) return 'Préfecture';
    if (text.includes('mairie') || text.includes('etat civil')) return 'Mairie';
    if (text.includes('mdph') || text.includes('handicap')) return 'MDPH';
    if (text.includes('cpam')) return 'CPAM';

    return 'Service-Public.fr';
  }

  /**
   * Extract canal from content
   */
  extractCanal($, sections) {
    const text = $.html().toLowerCase();

    if (text.includes('en ligne') || text.includes('téléservice') || text.includes('internet')) {
      return 'en_ligne';
    }
    if (text.includes('guichet') || text.includes('sur place') || text.includes('rendez-vous')) {
      return 'guichet';
    }
    if (text.includes('courrier') || text.includes('postal')) {
      return 'courrier';
    }
    if (text.includes('téléphone') || text.includes('appel')) {
      return 'telephone';
    }

    return 'en_ligne'; // Default for Service-Public
  }

  /**
   * Extract territoire info
   */
  extractTerritoire($, sections) {
    const text = $.html().toLowerCase();

    // Check if specific to departments
    if (text.includes('67') || text.includes('bas-rhin')) {
      return {
        niveau: 'departement',
        codes: ['67'],
        label: 'Bas-Rhin (67)'
      };
    }
    if (text.includes('68') || text.includes('haut-rhin')) {
      return {
        niveau: 'departement',
        codes: ['68'],
        label: 'Haut-Rhin (68)'
      };
    }
    if (text.includes('grand est')) {
      return {
        niveau: 'region',
        codes: ['44'], // Code région Grand Est
        label: 'Grand Est'
      };
    }

    // Default: national
    return {
      niveau: 'national',
      codes: [],
      label: 'France entière'
    };
  }

  /**
   * Generate slug from titre
   */
  generateSlug(titre) {
    return titre
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .substring(0, 100);
  }

  /**
   * Extract keywords for search
   */
  extractKeywords(parsedData) {
    const text = `${parsedData.titre} ${parsedData.description_courte}`.toLowerCase();
    const keywords = [];

    // Extract meaningful words (longer than 3 chars)
    const words = text.match(/\b\w{4,}\b/g) || [];
    const uniqueWords = [...new Set(words)];

    return uniqueWords.slice(0, 20);
  }
}
