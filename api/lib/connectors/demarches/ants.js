/**
 * ANTS (Agence Nationale des Titres Sécurisés) Connector
 *
 * Source: https://ants.gouv.fr
 * Scope: Carte d'identité, Passeport, Permis de conduire, Carte grise, etc.
 *
 * Note: ANTS pages are primarily application forms, not info pages.
 * For info, we rely on Service-Public.fr cross-references.
 * This connector focuses on extracting apply URLs and procedural details.
 */

import { SourceConnector } from './base.js';
import { mapCategoryFromSource } from '../../taxonomies/demarches.categories.js';
import * as cheerio from 'cheerio';

export class ANTSConnector extends SourceConnector {
  constructor() {
    super('ANTS', 'ants.gouv.fr', {
      rateLimit: 3000, // 3s between requests
      baseUrl: 'https://ants.gouv.fr'
    });
  }

  async fetch() {
    this.log('info', 'Starting fetch from ANTS');

    // ANTS key services URLs
    const antsUrls = [
      {
        url: 'https://ants.gouv.fr/monespace/s-inscrire',
        titre: 'Créer un compte ANTS',
        type: 'compte'
      },
      {
        url: 'https://permisdeconduire.ants.gouv.fr',
        titre: 'Permis de conduire - Démarches en ligne',
        type: 'permis'
      },
      {
        url: 'https://immatriculation.ants.gouv.fr',
        titre: 'Carte grise (Certificat d\'immatriculation)',
        type: 'carte-grise'
      },
      // Note: For CNI/Passport, ANTS only provides pre-demande online
      // Full process must be done at Mairie - info on Service-Public
      {
        url: 'https://passeport.ants.gouv.fr/services/geolocaliser-une-mairie',
        titre: 'Passeport - Trouver une mairie',
        type: 'passeport'
      }
    ];

    const rawItems = [];

    for (const item of antsUrls) {
      try {
        this.log('info', 'Fetching ANTS page', { url: item.url });
        const response = await this.httpFetch(item.url);
        const html = await response.text();
        const lastModified = this.extractLastModified(response);

        rawItems.push({
          url: item.url,
          titre: item.titre,
          type: item.type,
          html,
          lastModified,
          fetchedAt: new Date()
        });

        this.log('info', 'Fetched successfully', { url: item.url });
      } catch (error) {
        this.log('error', 'Fetch failed', { url: item.url, error: error.message });
      }
    }

    this.log('info', 'ANTS fetch completed', { total: rawItems.length });
    return rawItems;
  }

  async parse(rawData) {
    const $ = cheerio.load(rawData.html);

    // ANTS pages are application portals, so content is minimal
    // We construct démarche from known structure

    const titre = rawData.titre;
    const type = rawData.type;

    // Build description based on type
    const descriptions = {
      'permis': 'Effectuez vos démarches en ligne pour obtenir, renouveler ou modifier votre permis de conduire.',
      'carte-grise': 'Demandez votre certificat d\'immatriculation (carte grise) en ligne : véhicule neuf, occasion, changement de propriétaire, etc.',
      'passeport': 'Préparez votre demande de passeport en ligne et prenez rendez-vous dans une mairie équipée.',
      'compte': 'Créez votre compte ANTS pour accéder à tous les téléservices de l\'Agence Nationale des Titres Sécurisés.'
    };

    const etapesMap = {
      'permis': [
        { numero: 1, titre: 'Créer un compte ANTS', description: 'Si vous n\'en avez pas déjà un, créez votre compte sur le site ANTS.' },
        { numero: 2, titre: 'Rassembler les documents', description: 'Préparez vos justificatifs : photo d\'identité, justificatif de domicile, etc.' },
        { numero: 3, titre: 'Faire la demande en ligne', description: 'Remplissez le formulaire en ligne sur permisdeconduire.ants.gouv.fr' },
        { numero: 4, titre: 'Payer en ligne', description: 'Réglez les frais de dossier par carte bancaire.' },
        { numero: 5, titre: 'Réception du permis', description: 'Votre permis vous sera envoyé par courrier sécurisé à votre domicile.' }
      ],
      'carte-grise': [
        { numero: 1, titre: 'Créer un compte ANTS', description: 'Si nécessaire, créez votre compte ANTS.' },
        { numero: 2, titre: 'Rassembler les documents', description: 'Certificat de cession, justificatif de domicile, contrôle technique si applicable, etc.' },
        { numero: 3, titre: 'Faire la demande en ligne', description: 'Sur immatriculation.ants.gouv.fr, sélectionnez votre démarche et remplissez le formulaire.' },
        { numero: 4, titre: 'Payer les taxes', description: 'Réglez la taxe régionale et les frais de dossier.' },
        { numero: 5, titre: 'Réception de la carte grise', description: 'Vous recevrez un certificat provisoire immédiatement, puis la carte grise définitive par courrier.' }
      ],
      'passeport': [
        { numero: 1, titre: 'Pré-demande en ligne', description: 'Remplissez le formulaire de pré-demande sur le site ANTS.' },
        { numero: 2, titre: 'Imprimer le récépissé', description: 'Imprimez le numéro de pré-demande et le récépissé.' },
        { numero: 3, titre: 'Prendre rendez-vous en mairie', description: 'Prenez rendez-vous dans une mairie équipée d\'une station biométrique.' },
        { numero: 4, titre: 'Se présenter avec les pièces', description: 'Apportez photos, justificatifs, ancien passeport/CNI, timbre fiscal.' },
        { numero: 5, titre: 'Retrait du passeport', description: 'Retirez votre passeport en mairie (délai variable selon communes).' }
      ],
      'compte': [
        { numero: 1, titre: 'Créer votre compte', description: 'Rendez-vous sur ants.gouv.fr et cliquez sur "Créer un compte".' },
        { numero: 2, titre: 'Renseigner vos informations', description: 'Saisissez nom, prénom, email, et créez un mot de passe.' },
        { numero: 3, titre: 'Valider votre email', description: 'Cliquez sur le lien reçu par email pour activer votre compte.' },
        { numero: 4, titre: 'Accéder aux téléservices', description: 'Connectez-vous et accédez à tous les services ANTS.' }
      ]
    };

    const documentsMap = {
      'permis': [
        'Photo d\'identité conforme aux normes',
        'Justificatif de domicile de moins de 6 mois',
        'Pièce d\'identité (CNI ou passeport)',
        'Ancien permis (si renouvellement)'
      ],
      'carte-grise': [
        'Certificat de cession (si occasion)',
        'Certificat de conformité (si véhicule neuf)',
        'Justificatif de domicile de moins de 6 mois',
        'Pièce d\'identité',
        'Contrôle technique de moins de 6 mois (si applicable)'
      ],
      'passeport': [
        '2 photos d\'identité conformes',
        'Timbre fiscal (86€ adulte, tarifs réduits enfants)',
        'Justificatif de domicile de moins d\'un an',
        'Pièce d\'identité ou ancien passeport',
        'Numéro de pré-demande en ligne'
      ],
      'compte': []
    };

    return {
      titre,
      description_courte: descriptions[type] || '',
      description: descriptions[type] || '',
      pour_qui: 'Toute personne résidant en France',
      etapes: etapesMap[type] || [],
      documents_necessaires: documentsMap[type] || [],
      ou_faire: 'En ligne sur le site ANTS (ou en mairie pour le passeport)',
      delai: type === 'permis' ? 'Environ 3 semaines' : (type === 'carte-grise' ? 'Certificat provisoire immédiat, carte définitive sous 1 semaine' : (type === 'passeport' ? 'Variable selon mairie (2 à 6 semaines)' : null)),
      cout: type === 'permis' ? '25€' : (type === 'carte-grise' ? 'Variable selon véhicule et région' : (type === 'passeport' ? '86€ (adulte), 17-42€ (enfants)' : 'Gratuit')),
      source_url: rawData.url,
      apply_url: rawData.url,
      organisme: 'ANTS',
      canal: type === 'passeport' ? 'guichet' : 'en_ligne',
      territoire_niveau: 'national',
      territoire_codes: [],
      territoire_label: 'France entière',
      source_last_modified: rawData.lastModified,
      fetched_at: rawData.fetchedAt,
      _type: type
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
      quality_score: 95,
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
