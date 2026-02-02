/**
 * Taxonomie des situations de vie pour démarches
 * Mapping depuis LifeSituation existant
 *
 * Usage:
 * - Normaliser les situations sources
 * - Affichage UI cohérent
 * - Filtrage + facettes
 */

export const SITUATIONS = [
  {
    key: 'je-cherche-un-logement',
    label: 'Je cherche un logement',
    aliases: ['logement', 'hlm', 'location', 'hebergement']
  },
  {
    key: 'je-suis-au-chomage',
    label: 'Je suis au chômage',
    aliases: ['chomage', 'pole-emploi', 'france-travail', 'sans-emploi']
  },
  {
    key: 'j-ai-des-difficultes-financieres',
    label: 'J\'ai des difficultés financières',
    aliases: ['difficultes', 'finances', 'budget', 'rsa', 'aide-financiere']
  },
  {
    key: 'je-suis-en-situation-de-handicap',
    label: 'Je suis en situation de handicap',
    aliases: ['handicap', 'mdph', 'aah', 'rqth']
  },
  {
    key: 'je-suis-parent',
    label: 'Je suis parent',
    aliases: ['parent', 'famille', 'enfant', 'caf', 'allocations-familiales']
  },
  {
    key: 'je-cherche-des-soins',
    label: 'Je cherche des soins',
    aliases: ['sante', 'soins', 'medecin', 'hopital', 'ameli']
  },
  {
    key: 'je-suis-senior',
    label: 'Je suis senior',
    aliases: ['senior', 'retraite', 'age', 'apa', 'personne-agee']
  },
  {
    key: 'je-suis-etranger',
    label: 'Je suis étranger / nouvel arrivant',
    aliases: ['etranger', 'immigration', 'titre-sejour', 'asile', 'refugie']
  },
  {
    key: 'je-suis-etudiant',
    label: 'Je suis étudiant',
    aliases: ['etudiant', 'etudes', 'crous', 'bourse', 'universite']
  },
  {
    key: 'je-cherche-un-emploi',
    label: 'Je cherche un emploi',
    aliases: ['emploi', 'travail', 'pole-emploi', 'france-travail', 'formation']
  },
  {
    key: 'je-suis-en-formation',
    label: 'Je suis en formation',
    aliases: ['formation', 'apprentissage', 'stage', 'qualification']
  },
  {
    key: 'toutes',
    label: 'Toutes les situations',
    aliases: ['toutes', 'tous', 'tout', 'general']
  }
];

/**
 * Get situation by key
 */
export function getSituationByKey(key) {
  return SITUATIONS.find(s => s.key === key);
}

/**
 * Map a source label to a situation key (fuzzy matching)
 * @param {string} sourceLabel - Label from source
 * @returns {string|null} - Situation key or null if no match
 */
export function mapSituationFromSource(sourceLabel) {
  if (!sourceLabel) return null;

  const normalized = sourceLabel.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim();

  // Exact match on key
  const exactMatch = SITUATIONS.find(s => s.key === normalized);
  if (exactMatch) return exactMatch.key;

  // Fuzzy match on aliases
  for (const situation of SITUATIONS) {
    for (const alias of situation.aliases) {
      if (normalized.includes(alias) || alias.includes(normalized)) {
        return situation.key;
      }
    }
  }

  // Keyword-based heuristics
  if (normalized.includes('logement') || normalized.includes('hebergement')) {
    return 'je-cherche-un-logement';
  }
  if (normalized.includes('chomage') || normalized.includes('sans-emploi')) {
    return 'je-suis-au-chomage';
  }
  if (normalized.includes('difficulte') || normalized.includes('finance') || normalized.includes('rsa')) {
    return 'j-ai-des-difficultes-financieres';
  }
  if (normalized.includes('handicap')) {
    return 'je-suis-en-situation-de-handicap';
  }
  if (normalized.includes('parent') || normalized.includes('enfant') || normalized.includes('famille')) {
    return 'je-suis-parent';
  }
  if (normalized.includes('sante') || normalized.includes('soins') || normalized.includes('medecin')) {
    return 'je-cherche-des-soins';
  }
  if (normalized.includes('senior') || normalized.includes('retraite') || normalized.includes('age')) {
    return 'je-suis-senior';
  }
  if (normalized.includes('etranger') || normalized.includes('immigration') || normalized.includes('titre-sejour')) {
    return 'je-suis-etranger';
  }
  if (normalized.includes('etudiant') || normalized.includes('crous') || normalized.includes('bourse')) {
    return 'je-suis-etudiant';
  }
  if (normalized.includes('emploi') && !normalized.includes('chomage')) {
    return 'je-cherche-un-emploi';
  }
  if (normalized.includes('formation') || normalized.includes('apprentissage')) {
    return 'je-suis-en-formation';
  }

  // Default: no specific situation
  return 'toutes';
}

/**
 * Get all situation keys
 */
export function getAllSituationKeys() {
  return SITUATIONS.map(s => s.key);
}

/**
 * Get situation label by key
 */
export function getSituationLabel(key) {
  const situation = getSituationByKey(key);
  return situation ? situation.label : key;
}
