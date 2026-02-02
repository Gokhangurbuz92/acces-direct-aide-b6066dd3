/**
 * @fileoverview Taxonomy mapping for standardizing themes/sous-themes/public/territoire
 * This file serves as the single source of truth for categorization
 */

/**
 * Theme taxonomy with sous-themes
 */
const THEMES = {
  EMPLOI: {
    label: 'Emploi et Formation',
    souThemes: [
      'Formation professionnelle',
      'Insertion professionnelle',
      'Création d\'entreprise',
      'Aide à l\'embauche',
      'Reconversion',
      'Apprentissage',
    ],
  },
  LOGEMENT: {
    label: 'Logement',
    souThemes: [
      'Accès au logement',
      'Aide au loyer',
      'Rénovation énergétique',
      'Adaptation du logement',
      'Propriétaire',
      'Locataire',
    ],
  },
  SANTE: {
    label: 'Santé',
    souThemes: [
      'Couverture santé',
      'Handicap',
      'Dépendance',
      'Prévention',
      'Soins',
    ],
  },
  FAMILLE: {
    label: 'Famille et Enfance',
    souThemes: [
      'Petite enfance',
      'Aide familiale',
      'Parentalité',
      'Scolarité',
      'Loisirs',
    ],
  },
  SOCIAL: {
    label: 'Solidarité et Inclusion',
    souThemes: [
      'Minima sociaux',
      'Urgence sociale',
      'Inclusion numérique',
      'Lutte contre la précarité',
    ],
  },
  MOBILITE: {
    label: 'Mobilité et Transport',
    souThemes: [
      'Transport en commun',
      'Aide au permis',
      'Véhicule adapté',
      'Déplacements',
    ],
  },
  CULTURE: {
    label: 'Culture et Loisirs',
    souThemes: [
      'Accès à la culture',
      'Sport',
      'Vacances',
      'Activités',
    ],
  },
  SENIORS: {
    label: 'Seniors',
    souThemes: [
      'Maintien à domicile',
      'Hébergement',
      'Aide à l\'autonomie',
      'Loisirs seniors',
    ],
  },
  JEUNESSE: {
    label: 'Jeunesse',
    souThemes: [
      'Études',
      'Premier emploi',
      'Logement jeunes',
      'Engagement citoyen',
    ],
  },
  HANDICAP: {
    label: 'Handicap',
    souThemes: [
      'Allocation handicap',
      'Emploi handicap',
      'Aménagement',
      'Accompagnement',
    ],
  },
};

/**
 * Public (target audience) categories
 */
const PUBLICS = [
  'Tous publics',
  'Personnes en situation de handicap',
  'Seniors',
  'Jeunes (16-25 ans)',
  'Familles',
  'Demandeurs d\'emploi',
  'Créateurs d\'entreprise',
  'Salariés',
  'Étudiants',
  'Retraités',
  'Personnes en précarité',
  'Aidants',
];

/**
 * Territoire levels
 */
const TERRITOIRES = {
  NATIONAL: 'national',
  REGION: 'region',
  DEPARTEMENT: 'departement',
  COMMUNE: 'commune',
};

/**
 * Organisme (source organizations) - non-exhaustive, extend as needed
 */
const ORGANISMES = [
  'Région Grand Est',
  'AGEFIPH',
  'CAF',
  'MSA',
  'Département Bas-Rhin',
  'Département Haut-Rhin',
  'Pôle Emploi',
  'Service-Public.fr',
  'MDPH',
  'CPAM',
  'Autre',
];

/**
 * Map raw keywords to normalized theme
 * @param {string} rawKeyword - Raw keyword from source
 * @returns {string|null} Normalized theme key (e.g., 'EMPLOI')
 */
function mapKeywordToTheme(rawKeyword) {
  if (!rawKeyword) return null;
  const normalized = rawKeyword.toLowerCase().trim();

  const mappings = {
    emploi: 'EMPLOI',
    formation: 'EMPLOI',
    travail: 'EMPLOI',
    'création entreprise': 'EMPLOI',
    'aide embauche': 'EMPLOI',
    insertion: 'EMPLOI',
    apprentissage: 'EMPLOI',

    logement: 'LOGEMENT',
    loyer: 'LOGEMENT',
    habitat: 'LOGEMENT',
    'rénovation énergétique': 'LOGEMENT',

    santé: 'SANTE',
    soin: 'SANTE',
    handicap: 'HANDICAP',
    dépendance: 'SANTE',

    famille: 'FAMILLE',
    enfance: 'FAMILLE',
    'petite enfance': 'FAMILLE',
    parentalité: 'FAMILLE',

    social: 'SOCIAL',
    solidarité: 'SOCIAL',
    précarité: 'SOCIAL',
    'inclusion numérique': 'SOCIAL',

    mobilité: 'MOBILITE',
    transport: 'MOBILITE',
    permis: 'MOBILITE',
    déplacement: 'MOBILITE',

    culture: 'CULTURE',
    loisirs: 'CULTURE',
    sport: 'CULTURE',
    vacances: 'CULTURE',

    seniors: 'SENIORS',
    'personnes âgées': 'SENIORS',
    retraite: 'SENIORS',

    jeunesse: 'JEUNESSE',
    jeunes: 'JEUNESSE',
    étudiant: 'JEUNESSE',
  };

  for (const [keyword, theme] of Object.entries(mappings)) {
    if (normalized.includes(keyword)) {
      return theme;
    }
  }

  return null;
}

/**
 * Map raw keywords to sous-theme
 * @param {string} theme - Normalized theme key
 * @param {string} rawKeyword - Raw keyword from source
 * @returns {string|null} Sous-theme label
 */
function mapKeywordToSousTheme(theme, rawKeyword) {
  if (!theme || !rawKeyword || !THEMES[theme]) return null;
  const normalized = rawKeyword.toLowerCase().trim();
  const souThemes = THEMES[theme].souThemes;

  for (const st of souThemes) {
    if (normalized.includes(st.toLowerCase())) {
      return st;
    }
  }

  return null;
}

/**
 * Map raw public to normalized public
 * @param {string} rawPublic
 * @returns {string|null}
 */
function mapKeywordToPublic(rawPublic) {
  if (!rawPublic) return null;
  const normalized = rawPublic.toLowerCase().trim();

  const mappings = {
    'personnes en situation de handicap': /handicap/i,
    'Seniors': /senior|personnes âgées|retraité/i,
    'Jeunes (16-25 ans)': /jeune|16-25|étudiant/i,
    'Familles': /famille|parent/i,
    'Demandeurs d\'emploi': /demandeur.?emploi|chômeur/i,
    'Créateurs d\'entreprise': /créateur|entrepreneur/i,
    'Salariés': /salarié/i,
    'Étudiants': /étudiant/i,
    'Retraités': /retraité/i,
    'Personnes en précarité': /précarité|rsa|pauvreté/i,
    'Aidants': /aidant/i,
  };

  for (const [publicLabel, regex] of Object.entries(mappings)) {
    if (regex.test(normalized)) {
      return publicLabel;
    }
  }

  return 'Tous publics';
}

/**
 * Extract territoire from raw data
 * @param {Object} options
 * @param {string} [options.rawTerritoire]
 * @param {string} [options.organisme]
 * @returns {Object} { niveau, codes, label }
 */
function extractTerritoire({ rawTerritoire, organisme }) {
  // Default national
  let niveau = TERRITOIRES.NATIONAL;
  let codes = [];
  let label = 'National';

  if (organisme && organisme.toLowerCase().includes('grand est')) {
    niveau = TERRITOIRES.REGION;
    codes = ['44']; // Code région Grand Est
    label = 'Grand Est';
  }

  if (organisme && (organisme.toLowerCase().includes('bas-rhin') || organisme.toLowerCase().includes('67'))) {
    niveau = TERRITOIRES.DEPARTEMENT;
    codes = ['67'];
    label = 'Bas-Rhin';
  }

  if (organisme && (organisme.toLowerCase().includes('haut-rhin') || organisme.toLowerCase().includes('68'))) {
    niveau = TERRITOIRES.DEPARTEMENT;
    codes = ['68'];
    label = 'Haut-Rhin';
  }

  if (rawTerritoire) {
    const normalized = rawTerritoire.toLowerCase();
    if (normalized.includes('grand est')) {
      niveau = TERRITOIRES.REGION;
      codes = ['44'];
      label = 'Grand Est';
    } else if (normalized.includes('67') || normalized.includes('bas-rhin')) {
      niveau = TERRITOIRES.DEPARTEMENT;
      codes = ['67'];
      label = 'Bas-Rhin';
    } else if (normalized.includes('68') || normalized.includes('haut-rhin')) {
      niveau = TERRITOIRES.DEPARTEMENT;
      codes = ['68'];
      label = 'Haut-Rhin';
    }
  }

  return { niveau, codes, label };
}

module.exports = {
  THEMES,
  PUBLICS,
  TERRITOIRES,
  ORGANISMES,
  mapKeywordToTheme,
  mapKeywordToSousTheme,
  mapKeywordToPublic,
  extractTerritoire,
};
