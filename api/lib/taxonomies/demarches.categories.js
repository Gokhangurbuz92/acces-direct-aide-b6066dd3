/**
 * Taxonomie des catégories de démarches
 * Stable taxonomy keys + display labels + mapping aliases
 *
 * Usage:
 * - Normaliser les libellés sources vers des clés stables
 * - Affichage UI cohérent
 * - Filtrage + facettes
 */

export const CATEGORIES = [
  {
    key: 'identite',
    label: 'Identité & État Civil',
    description: 'Papiers d\'identité, état civil, changement de nom',
    aliases: ['identite', 'etat-civil', 'papiers', 'carte-identite', 'passeport', 'actes', 'naissance', 'mariage']
  },
  {
    key: 'logement',
    label: 'Logement',
    description: 'Allocation logement, HLM, bail, déménagement',
    aliases: ['logement', 'hlm', 'bail', 'location', 'demenagement', 'als', 'apl']
  },
  {
    key: 'sante',
    label: 'Santé & Assurance Maladie',
    description: 'Carte vitale, Ameli, remboursements, CMU-C, CSS',
    aliases: ['sante', 'ameli', 'carte-vitale', 'cmu', 'css', 'securite-sociale', 'cpam']
  },
  {
    key: 'emploi',
    label: 'Emploi & Chômage',
    description: 'Inscription Pôle Emploi, ARE, formation',
    aliases: ['emploi', 'chomage', 'pole-emploi', 'france-travail', 'are', 'formation']
  },
  {
    key: 'famille',
    label: 'Famille & Enfance',
    description: 'CAF, allocations familiales, garde d\'enfants, scolarité',
    aliases: ['famille', 'caf', 'allocations-familiales', 'enfance', 'creche', 'scolarite', 'inscription-scolaire']
  },
  {
    key: 'budget-impots',
    label: 'Budget & Impôts',
    description: 'Déclaration impôts, RSA, Prime d\'activité, aides financières',
    aliases: ['budget', 'impots', 'fiscalite', 'rsa', 'prime-activite', 'declaration', 'finances']
  },
  {
    key: 'mobilite-transport',
    label: 'Mobilité & Transports',
    description: 'Permis, carte grise, certificat non-gage, véhicule',
    aliases: ['mobilite', 'transport', 'permis', 'carte-grise', 'ants', 'vehicule', 'immatriculation']
  },
  {
    key: 'justice-droit',
    label: 'Justice & Droit',
    description: 'Aide juridictionnelle, tribunal, contentieux',
    aliases: ['justice', 'droit', 'tribunal', 'aide-juridictionnelle', 'contentieux', 'juridique']
  },
  {
    key: 'handicap',
    label: 'Handicap',
    description: 'AAH, MDPH, reconnaissance handicap, PCH',
    aliases: ['handicap', 'aah', 'mdph', 'pch', 'rqth']
  },
  {
    key: 'retraite-seniors',
    label: 'Retraite & Autonomie',
    description: 'Demande retraite, APA, ASPA, personnes âgées',
    aliases: ['retraite', 'seniors', 'apa', 'aspa', 'autonomie', 'vieillissement', 'personnes-agees']
  },
  {
    key: 'immigration-integration',
    label: 'Immigration & Intégration',
    description: 'Titre de séjour, asile, naturalisation, visa',
    aliases: ['immigration', 'etrangers', 'titre-sejour', 'asile', 'naturalisation', 'visa', 'prefecture']
  },
  {
    key: 'etudes-formation',
    label: 'Études & Formation',
    description: 'Bourse Crous, inscription université, formation professionnelle',
    aliases: ['etudes', 'formation', 'crous', 'bourse', 'universite', 'etudiant', 'apprentissage']
  },
  {
    key: 'energie-environnement',
    label: 'Énergie & Environnement',
    description: 'Chèque énergie, transition écologique',
    aliases: ['energie', 'environnement', 'cheque-energie', 'ecologie']
  },
  {
    key: 'numerique',
    label: 'Numérique & Services en Ligne',
    description: 'France Connect, identité numérique, e-administration',
    aliases: ['numerique', 'digital', 'france-connect', 'e-administration', 'services-en-ligne']
  },
  {
    key: 'autre',
    label: 'Autre',
    description: 'Autres démarches non classées',
    aliases: ['autre', 'divers']
  }
];

/**
 * Get category by key
 */
export function getCategoryByKey(key) {
  return CATEGORIES.find(c => c.key === key);
}

/**
 * Map a source label to a category key (fuzzy matching)
 * @param {string} sourceLabel - Label from source (e.g., "Carte d'identité", "Passeport")
 * @returns {string|null} - Category key or null if no match
 */
export function mapCategoryFromSource(sourceLabel) {
  if (!sourceLabel) return null;

  const normalized = sourceLabel.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .trim();

  // Exact match on key
  const exactMatch = CATEGORIES.find(c => c.key === normalized);
  if (exactMatch) return exactMatch.key;

  // Fuzzy match on aliases
  for (const category of CATEGORIES) {
    for (const alias of category.aliases) {
      if (normalized.includes(alias) || alias.includes(normalized)) {
        return category.key;
      }
    }
  }

  // Keyword-based heuristics
  if (normalized.includes('identite') || normalized.includes('passeport') || normalized.includes('carte')) {
    return 'identite';
  }
  if (normalized.includes('logement') || normalized.includes('hlm') || normalized.includes('als')) {
    return 'logement';
  }
  if (normalized.includes('sante') || normalized.includes('ameli') || normalized.includes('vitale')) {
    return 'sante';
  }
  if (normalized.includes('emploi') || normalized.includes('chomage') || normalized.includes('pole')) {
    return 'emploi';
  }
  if (normalized.includes('famille') || normalized.includes('caf') || normalized.includes('enfant')) {
    return 'famille';
  }
  if (normalized.includes('impot') || normalized.includes('rsa') || normalized.includes('fiscal')) {
    return 'budget-impots';
  }
  if (normalized.includes('permis') || normalized.includes('carte-grise') || normalized.includes('vehicule')) {
    return 'mobilite-transport';
  }
  if (normalized.includes('justice') || normalized.includes('tribunal') || normalized.includes('juridique')) {
    return 'justice-droit';
  }
  if (normalized.includes('handicap') || normalized.includes('aah') || normalized.includes('mdph')) {
    return 'handicap';
  }
  if (normalized.includes('retraite') || normalized.includes('apa') || normalized.includes('senior')) {
    return 'retraite-seniors';
  }
  if (normalized.includes('etranger') || normalized.includes('titre-sejour') || normalized.includes('asile')) {
    return 'immigration-integration';
  }
  if (normalized.includes('etude') || normalized.includes('crous') || normalized.includes('bourse')) {
    return 'etudes-formation';
  }
  if (normalized.includes('energie') || normalized.includes('cheque-energie')) {
    return 'energie-environnement';
  }
  if (normalized.includes('numerique') || normalized.includes('france-connect')) {
    return 'numerique';
  }

  // Default fallback
  return 'autre';
}

/**
 * Get all category keys
 */
export function getAllCategoryKeys() {
  return CATEGORIES.map(c => c.key);
}

/**
 * Get category label by key
 */
export function getCategoryLabel(key) {
  const category = getCategoryByKey(key);
  return category ? category.label : key;
}
