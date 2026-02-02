/**
 * CLASSIFICATION ENGINE FOR ACTUALITES
 *
 * Classifie automatiquement les actualités par:
 * - Topics (multi-topics autorisés)
 * - Impact (alerte, important, info)
 * - Reliability score (0-100)
 */

import { ACTUALITES_TOPICS } from '../../../taxonomy/actualites.topics.js';

/**
 * Normalise le texte pour la classification
 * @param {string} text
 * @returns {string}
 */
function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .trim();
}

/**
 * Classifie les topics d'une actualité
 *
 * @param {Object} params
 * @param {string} params.title - Titre
 * @param {string} params.excerpt - Extrait/résumé
 * @param {string} params.content - Contenu complet (optionnel)
 * @param {string[]} params.tags - Tags existants (optionnel)
 * @param {string} params.source_domain - Domaine source (optionnel)
 * @returns {Object} { topics: string[], topic_primary: string, scores: Object }
 */
export function classifyTopics({ title = '', excerpt = '', content = '', tags = [], source_domain = '' }) {
  const fullText = normalizeText(`${title} ${excerpt} ${content} ${tags.join(' ')}`);

  if (!fullText) {
    return {
      topics: ['general'],
      topic_primary: 'general',
      scores: { general: 1 }
    };
  }

  const scores = {};

  // Score chaque topic
  for (const topic of ACTUALITES_TOPICS) {
    if (topic.key === 'toutes') continue;

    let score = 0;

    // Keywords matching
    for (const keyword of topic.keywords) {
      const normalizedKeyword = normalizeText(keyword);
      if (fullText.includes(normalizedKeyword)) {
        score += 3; // Keyword match = high weight
      }
    }

    // Synonyms matching
    for (const synonym of topic.synonyms) {
      const normalizedSynonym = normalizeText(synonym);
      if (fullText.includes(normalizedSynonym)) {
        score += 2; // Synonym match = medium weight
      }
    }

    // Source domain hint bonus
    if (topic.sources_hint && source_domain) {
      for (const hint of topic.sources_hint) {
        if (source_domain.includes(hint)) {
          score += 5; // Source hint = very high weight
        }
      }
    }

    if (score > 0) {
      scores[topic.key] = score;
    }
  }

  // Si aucun match, fallback sur "general"
  if (Object.keys(scores).length === 0) {
    return {
      topics: ['general'],
      topic_primary: 'general',
      scores: { general: 1 }
    };
  }

  // Sélectionner les topics avec score >= seuil (3+)
  const threshold = 3;
  const matchedTopics = Object.entries(scores)
    .filter(([_, score]) => score >= threshold)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key);

  // Limiter à 3 topics max pour lisibilité
  const topics = matchedTopics.slice(0, 3);

  // topic_primary = topic avec le meilleur score
  const topic_primary = topics[0] || 'general';

  return {
    topics,
    topic_primary,
    scores
  };
}

/**
 * Classifie l'impact d'une actualité
 *
 * Règles:
 * - ALERTE: échéance courte, risque perte droit, fraude massive, crise, réforme effective immédiate
 * - IMPORTANT: nouvelle aide, revalorisation, changement procédure, extension conditions
 * - INFO: rappel, publication générale, MAJ mineure
 *
 * @param {Object} params
 * @param {string} params.title
 * @param {string} params.excerpt
 * @param {string} params.content
 * @param {string[]} params.tags
 * @returns {string} - "alerte" | "important" | "info"
 */
export function classifyImpact({ title = '', excerpt = '', content = '', tags = [] }) {
  const fullText = normalizeText(`${title} ${excerpt} ${content} ${tags.join(' ')}`);

  if (!fullText) {
    return 'info';
  }

  // ALERTE keywords
  const alerteKeywords = [
    'urgent', 'alerte', 'attention', 'risque', 'fraude', 'arnaque', 'escroquerie',
    'derniers jours', 'expire', 'expiration', 'echéance', 'date limite',
    'suppression', 'fin de', 'derniere chance', 'crise', 'danger',
    'perte de droit', 'non reconduit', 'arrete', 'suspendu'
  ];

  for (const keyword of alerteKeywords) {
    if (fullText.includes(normalizeText(keyword))) {
      return 'alerte';
    }
  }

  // IMPORTANT keywords
  const importantKeywords = [
    'nouvelle aide', 'nouveau dispositif', 'revalorisation', 'augmentation',
    'changement', 'reforme', 'modification', 'evolution', 'extension',
    'elargissement', 'hausse', 'baisse', 'conditions assouplies',
    'nouvellement eligible', 'desormais', 'a partir du', 'a compter du',
    'entre en vigueur', 'applicable'
  ];

  for (const keyword of importantKeywords) {
    if (fullText.includes(normalizeText(keyword))) {
      return 'important';
    }
  }

  // Default: INFO
  return 'info';
}

/**
 * Calcule le score de fiabilité d'une source
 *
 * Règles:
 * - official/institution: base haute (80-95)
 * - association experte reconnue: moyenne/haute (60-75)
 * - media: plus bas (40-60)
 *
 * @param {Object} params
 * @param {string} params.source_type - "official" | "institution" | "association" | "media"
 * @param {string} params.source_domain - Domaine source
 * @param {boolean} params.has_exact_url - L'URL exacte de la page est-elle disponible ?
 * @returns {number} - Score 0-100
 */
export function calculateReliabilityScore({ source_type = '', source_domain = '', has_exact_url = false }) {
  let baseScore = 50; // Default

  // Score par type de source
  if (source_type === 'official') {
    baseScore = 90;
  } else if (source_type === 'institution') {
    baseScore = 85;
  } else if (source_type === 'association') {
    baseScore = 65;
  } else if (source_type === 'media') {
    baseScore = 45;
  }

  // Bonus pour domaines officiels reconnus
  const officialDomains = [
    'gouv.fr', 'service-public.fr', 'ameli.fr', 'caf.fr', 'francetravail.fr',
    'pole-emploi.fr', 'agefiph.fr', 'legifrance.gouv.fr', 'impots.gouv.fr',
    'education.gouv.fr', 'justice.fr', 'europa.eu'
  ];

  for (const domain of officialDomains) {
    if (source_domain && source_domain.includes(domain)) {
      baseScore = Math.max(baseScore, 90);
      break;
    }
  }

  // Bonus pour URL exacte (traçabilité)
  if (has_exact_url) {
    baseScore += 5;
  }

  // Cap à 100
  return Math.min(baseScore, 100);
}

/**
 * Classifie l'audience cible d'une actualité
 *
 * @param {Object} params
 * @param {string} params.title
 * @param {string} params.excerpt
 * @param {string} params.content
 * @param {string[]} params.topics
 * @returns {string[]} - Audiences cibles
 */
export function classifyAudience({ title = '', excerpt = '', content = '', topics = [] }) {
  const fullText = normalizeText(`${title} ${excerpt} ${content}`);
  const audiences = [];

  const audienceRules = {
    handicap: ['handicap', 'aah', 'mdph', 'rqth', 'invalidité', 'pcH', 'aeeh'],
    seniors: ['retraite', 'senior', 'personnes agees', 'ehpad', 'apa', 'aspa'],
    jeunes: ['jeune', 'etudiant', 'apprenti', 'alternance', 'bourse', '18-25', 'moins de 25'],
    etrangers: ['etranger', 'immigration', 'refugie', 'asile', 'titre de sejour', 'ofii', 'ofpra'],
    famille: ['famille', 'parent', 'enfant', 'caf', 'allocations familiales', 'naissance', 'garde enfant'],
    chomeurs: ['chomage', 'demandeur emploi', 'pole emploi', 'france travail', 'are', 'ass'],
    travailleurs: ['salarie', 'travailleur', 'emploi', 'contrat', 'licenciement'],
    precaires: ['rsa', 'precarite', 'bas revenus', 'pauvrete', 'exclusion', 'sdf']
  };

  for (const [audience, keywords] of Object.entries(audienceRules)) {
    for (const keyword of keywords) {
      if (fullText.includes(normalizeText(keyword))) {
        if (!audiences.includes(audience)) {
          audiences.push(audience);
        }
        break;
      }
    }
  }

  // Inférence depuis topics
  if (topics.includes('handicap') && !audiences.includes('handicap')) {
    audiences.push('handicap');
  }
  if (topics.includes('retraite_dependance') && !audiences.includes('seniors')) {
    audiences.push('seniors');
  }
  if (topics.includes('famille') && !audiences.includes('famille')) {
    audiences.push('famille');
  }
  if (topics.includes('nouveaux_arrivants') && !audiences.includes('etrangers')) {
    audiences.push('etrangers');
  }

  return audiences;
}
