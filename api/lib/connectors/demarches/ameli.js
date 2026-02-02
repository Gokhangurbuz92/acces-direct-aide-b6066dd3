/**
 * Ameli (Assurance Maladie) Connector
 *
 * Source: https://www.ameli.fr
 * Scope: Carte Vitale, remboursements, droits santé, CSS, etc.
 */

import { SourceConnector } from './base.js';
import { mapCategoryFromSource } from '../../taxonomies/demarches.categories.js';
import * as cheerio from 'cheerio';

export class AmeliConnector extends SourceConnector {
  constructor() {
    super('Ameli', 'ameli.fr', {
      rateLimit: 2500,
      baseUrl: 'https://www.ameli.fr'
    });
  }

  async fetch() {
    this.log('info', 'Starting fetch from Ameli');

    const ameliUrls = [
      'https://www.ameli.fr/assure/droits-demarches/carte-vitale/obtenir-carte-vitale',
      'https://www.ameli.fr/assure/droits-demarches/carte-vitale/commander-carte-vitale',
      'https://www.ameli.fr/assure/droits-demarches/situations-particulieres/complementaire-sante-solidaire',
      'https://www.ameli.fr/assure/remboursements/rembourse/soins-ville/consultation-medecin',
      'https://www.ameli.fr/assure/droits-demarches/europe-international/partir-etranger',
      'https://www.ameli.fr/assure/droits-demarches/principes/changement-situation/changement-adresse'
    ];

    const rawItems = [];

    for (const url of ameliUrls) {
      try {
        this.log('info', 'Fetching Ameli page', { url });
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

    this.log('info', 'Ameli fetch completed', { total: rawItems.length });
    return rawItems;
  }

  async parse(rawData) {
    const $ = cheerio.load(rawData.html);

    const titre = $('h1').first().text().trim() ||
                  $('meta[property="og:title"]').attr('content') ||
                  'Démarche Ameli';

    const description = $('meta[name="description"]').attr('content') ||
                       $('meta[property="og:description"]').attr('content') ||
                       '';

    // Extract content sections
    const sections = {};
    $('h2, h3').each((i, elem) => {
      const heading = $(elem).text().trim();
      const content = $(elem).nextUntil('h2, h3').text().trim();

      if (heading.match(/conditions|bénéficiaire|qui/i)) {
        sections.pourQui = content;
      } else if (heading.match(/démarche|comment|procédure/i)) {
        sections.demarche = content;
      } else if (heading.match(/documents|pièces/i)) {
        sections.documents = content;
      } else if (heading.match(/délai|durée/i)) {
        sections.delai = content;
      }
    });

    // Extract steps
    const etapes = [];
    $('.step, .etape, ol li').each((i, elem) => {
      const text = $(elem).text().trim();
      if (text && text.length > 10) {
        etapes.push({
          numero: i + 1,
          titre: `Étape ${i + 1}`,
          description: text
        });
      }
    });

    // Extract documents
    const documents = [];
    $('ul li').each((i, elem) => {
      const text = $(elem).text().trim();
      if (text.match(/justificatif|document|pièce|attestation|certificat/i)) {
        documents.push(text);
      }
    });

    // Apply URL
    const applyUrl = $('a[href*="compte.ameli.fr"], a[href*="demarches"]').first().attr('href') || null;

    return {
      titre,
      description_courte: description.substring(0, 300),
      description: sections.demarche || description,
      pour_qui: sections.pourQui || 'Assurés du régime général de la Sécurité sociale',
      etapes: etapes.length > 0 ? etapes : null,
      documents_necessaires: documents.slice(0, 10),
      ou_faire: 'En ligne sur votre compte Ameli ou auprès de votre CPAM',
      delai: sections.delai || null,
      cout: 'Gratuit',
      source_url: rawData.url,
      apply_url: applyUrl ? (applyUrl.startsWith('http') ? applyUrl : `https://www.ameli.fr${applyUrl}`) : 'https://www.ameli.fr',
      organisme: 'Ameli',
      canal: 'en_ligne',
      territoire_niveau: 'national',
      territoire_codes: [],
      territoire_label: 'France entière',
      source_last_modified: rawData.lastModified,
      fetched_at: rawData.fetchedAt
    };
  }

  async mapToDemarche(parsedData) {
    const categorieKey = mapCategoryFromSource(parsedData.titre);
    const slug = this.generateSlug(parsedData.titre);
    const contentHash = this.computeContentHash(parsedData);

    return {
      slug,
      titre: parsedData.titre,
      description_courte: parsedData.description_courte,
      categorie: categorieKey,
      pour_qui: parsedData.pour_qui,
      documents_necessaires: parsedData.documents_necessaires,
      pieces_a_fournir: parsedData.documents_necessaires,
      etapes: parsedData.etapes,
      steps: parsedData.etapes,
      ou_faire: parsedData.ou_faire,
      location: parsedData.ou_faire,
      delai: parsedData.delai,
      processing_time: parsedData.delai,
      cout: parsedData.cout,
      cost: parsedData.cout,
      source_url: parsedData.source_url,
      source_url_exact: parsedData.source_url,
      apply_url: parsedData.apply_url,
      source_domain: this.domain,
      organisme: parsedData.organisme,
      canal: parsedData.canal,
      territoire_niveau: parsedData.territoire_niveau,
      territoire_codes: parsedData.territoire_codes,
      territoire_label: parsedData.territoire_label,
      fetched_at: parsedData.fetched_at,
      source_last_modified: parsedData.source_last_modified,
      content_hash: contentHash,
      statut: 'publie',
      quality_score: 90,
      mots_cles: this.extractKeywords(parsedData),
      _categoryKey: categorieKey,
      _situationKey: null
    };
  }

  generateSlug(titre) {
    return titre
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .substring(0, 100);
  }

  extractKeywords(parsedData) {
    const text = `${parsedData.titre} ${parsedData.description_courte}`.toLowerCase();
    const words = text.match(/\b\w{4,}\b/g) || [];
    return [...new Set(words)].slice(0, 20);
  }
}
