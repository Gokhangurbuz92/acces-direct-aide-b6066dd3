/**
 * TAXONOMIE CENTRALISÉE DES TOPICS ACTUALITÉS
 *
 * RÈGLES:
 * - Toute modification ici impacte automatiquement UI + classification + API
 * - key: identifiant unique (snake_case)
 * - label: affichage UI
 * - keywords: mots-clés pour classification auto
 * - synonyms: variantes pour matching
 * - sources_hint: sources prioritaires (optionnel)
 * - priority: ordre d'affichage (optionnel)
 */

export interface TopicDefinition {
  key: string;
  label: string;
  keywords: string[];
  synonyms: string[];
  sources_hint?: string[];
  priority?: number;
}

export const ACTUALITES_TOPICS: TopicDefinition[] = [
  {
    key: 'toutes',
    label: 'Toutes',
    keywords: [],
    synonyms: [],
    priority: 0,
  },
  {
    key: 'logement',
    label: 'Logement',
    keywords: ['logement', 'hlm', 'loyer', 'apl', 'bail', 'locataire', 'propriétaire', 'habitat', 'hébergement', 'squat', 'expulsion'],
    synonyms: ['habitation', 'résidence', 'appartement', 'maison', 'domicile'],
    sources_hint: ['action-logement.fr', 'anil.org'],
    priority: 1,
  },
  {
    key: 'sante',
    label: 'Santé',
    keywords: ['santé', 'assurance maladie', 'ameli', 'cpam', 'css', 'acs', 'mutuelle', 'soins', 'médecin', 'hôpital', 'médicament', 'vaccin', 'covid'],
    synonyms: ['médical', 'hospitalisation', 'consultation', 'soin'],
    sources_hint: ['ameli.fr', 'solidarites-sante.gouv.fr'],
    priority: 2,
  },
  {
    key: 'handicap',
    label: 'Handicap',
    keywords: ['handicap', 'aah', 'mdph', 'rqth', 'invalidité', 'pcH', 'aeeh', 'accessibilité', 'inclusion'],
    synonyms: ['handicapé', 'personne handicapée', 'autonomie', 'adaptation'],
    sources_hint: ['agefiph.fr', 'mdph.fr'],
    priority: 3,
  },
  {
    key: 'emploi',
    label: 'Emploi',
    keywords: ['emploi', 'chômage', 'pôle emploi', 'france travail', 'are', 'ass', 'formation', 'apprentissage', 'contrat', 'licenciement', 'démission', 'rupture conventionnelle'],
    synonyms: ['travail', 'job', 'activité professionnelle', 'insertion professionnelle'],
    sources_hint: ['francetravail.fr', 'pole-emploi.fr'],
    priority: 4,
  },
  {
    key: 'famille',
    label: 'Famille',
    keywords: ['famille', 'caf', 'allocations familiales', 'paje', 'rsa', 'parent isolé', 'garde enfant', 'crèche', 'naissance', 'adoption', 'parent', 'enfant'],
    synonyms: ['enfance', 'parentalité', 'familial'],
    sources_hint: ['caf.fr', 'mon-enfant.fr'],
    priority: 5,
  },
  {
    key: 'budget',
    label: 'Budget',
    keywords: ['budget', 'dettes', 'surendettement', 'microcrédit', 'banque', 'aide financière', 'prime', 'bon', 'tarif social', 'chèque énergie'],
    synonyms: ['argent', 'finance', 'économie', 'pouvoir achat'],
    sources_hint: ['economie.gouv.fr'],
    priority: 6,
  },
  {
    key: 'mobilite',
    label: 'Mobilité',
    keywords: ['mobilité', 'transport', 'permis', 'voiture', 'vélo', 'train', 'bus', 'métro', 'déplacement', 'sncf', 'ratp'],
    synonyms: ['déplacement', 'circulation', 'voyage'],
    sources_hint: ['service-public.fr'],
    priority: 7,
  },
  {
    key: 'justice',
    label: 'Justice',
    keywords: ['justice', 'droit', 'tribunal', 'avocat', 'aide juridictionnelle', 'contentieux', 'litige', 'procès', 'conciliation', 'médiation'],
    synonyms: ['juridique', 'légal', 'judiciaire'],
    sources_hint: ['justice.fr', 'service-public.fr'],
    priority: 8,
  },
  {
    key: 'numerique',
    label: 'Numérique',
    keywords: ['numérique', 'internet', 'ordinateur', 'smartphone', 'inclusion numérique', 'fracture numérique', 'aidants numériques', 'france connect', 'démarches en ligne'],
    synonyms: ['digital', 'informatique', 'cyber', 'technologie'],
    sources_hint: ['service-public.fr'],
    priority: 9,
  },
  {
    key: 'nouveaux_arrivants',
    label: 'Nouveaux arrivants',
    keywords: ['étranger', 'immigration', 'réfugié', 'asile', 'titre de séjour', 'naturalisation', 'ofii', 'ofpra', 'préfecture', 'regroupement familial', 'demandeur asile'],
    synonyms: ['migrant', 'primo-arrivant', 'expatrié', 'immigrant'],
    sources_hint: ['ofii.fr', 'ofpra.gouv.fr', 'immigration.interieur.gouv.fr'],
    priority: 10,
  },
  {
    key: 'education_formation',
    label: 'Éducation & Formation',
    keywords: ['éducation', 'formation', 'école', 'université', 'bourse', 'apprentissage', 'alternance', 'crous', 'enseignement', 'diplôme', 'validation acquis'],
    synonyms: ['scolarité', 'étudiant', 'apprenant', 'pédagogie'],
    sources_hint: ['education.gouv.fr', 'etudiant.gouv.fr'],
    priority: 11,
  },
  {
    key: 'retraite_dependance',
    label: 'Retraite & Dépendance',
    keywords: ['retraite', 'pension', 'aspa', 'dépendance', 'ehpad', 'apa', 'seniors', 'personnes âgées', 'carsat', 'cnav'],
    synonyms: ['retraité', 'âgé', 'vieillesse', 'senior'],
    sources_hint: ['lassuranceretraite.fr', 'pour-les-personnes-agees.gouv.fr'],
    priority: 12,
  },
  {
    key: 'energie_environnement',
    label: 'Énergie & Environnement',
    keywords: ['énergie', 'environnement', 'écologie', 'rénovation énergétique', 'chèque énergie', 'edf', 'gaz', 'électricité', 'isolation', 'climat', 'pollution'],
    synonyms: ['énergétique', 'écologique', 'vert', 'transition énergétique'],
    sources_hint: ['ademe.fr', 'ecologie.gouv.fr'],
    priority: 13,
  },
  {
    key: 'consommation_fraudes',
    label: 'Consommation & Fraudes',
    keywords: ['consommation', 'fraude', 'arnaque', 'litige', 'garantie', 'sav', 'dgccrf', 'signal conso', 'tromperie', 'escroquerie'],
    synonyms: ['consommateur', 'achat', 'commercial'],
    sources_hint: ['economie.gouv.fr', 'signal.conso.gouv.fr'],
    priority: 14,
  },
  {
    key: 'impots_finances_publiques',
    label: 'Impôts & Finances publiques',
    keywords: ['impôt', 'taxe', 'finances publiques', 'revenus', 'déclaration', 'prélèvement source', 'trésor public', 'fiscal'],
    synonyms: ['fiscalité', 'contribution', 'redevance'],
    sources_hint: ['impots.gouv.fr'],
    priority: 15,
  },
  {
    key: 'vie_associative',
    label: 'Vie associative',
    keywords: ['association', 'bénévolat', 'volontariat', 'don', 'subvention', 'asso', 'engagement citoyen', 'service civique'],
    synonyms: ['associatif', 'bénévole', 'militant'],
    sources_hint: ['associations.gouv.fr'],
    priority: 16,
  },
  {
    key: 'securite_civile',
    label: 'Sécurité civile',
    keywords: ['sécurité', 'urgence', 'catastrophe', 'incendie', 'inondation', 'alerte', 'pompiers', 'risque', 'protection civile'],
    synonyms: ['urgence', 'danger', 'alerte'],
    sources_hint: ['interieur.gouv.fr'],
    priority: 17,
  },
  {
    key: 'international',
    label: 'International',
    keywords: ['international', 'ue', 'union européenne', 'eee', 'suisse', 'transfrontalier', 'consulat', 'ambassade', 'expatrié', 'coordination européenne', 'schengen', 'détachement', 'travail étranger'],
    synonyms: ['européen', 'étranger', 'mondial', 'transnational'],
    sources_hint: ['diplomatie.gouv.fr', 'europa.eu'],
    priority: 18,
  },
  {
    key: 'general',
    label: 'Général',
    keywords: ['information', 'actualité', 'nouveau', 'mise à jour', 'annonce'],
    synonyms: ['info', 'news', 'divers'],
    priority: 999,
  },
];

/**
 * Récupère la définition d'un topic par sa clé
 */
export function getTopicByKey(key: string): TopicDefinition | undefined {
  return ACTUALITES_TOPICS.find(t => t.key === key);
}

/**
 * Récupère tous les topics sauf "toutes" (pour onglets)
 */
export function getTopicsForTabs(): TopicDefinition[] {
  return ACTUALITES_TOPICS.filter(t => t.key !== 'toutes').sort((a, b) => (a.priority || 999) - (b.priority || 999));
}

/**
 * Récupère tous les topics incluant "toutes" (pour filtres)
 */
export function getAllTopics(): TopicDefinition[] {
  return ACTUALITES_TOPICS.sort((a, b) => (a.priority || 999) - (b.priority || 999));
}

/**
 * Map topic key → label (pour affichage rapide)
 */
export const TOPICS_MAP: Record<string, string> = ACTUALITES_TOPICS.reduce((acc, topic) => {
  acc[topic.key] = topic.label;
  return acc;
}, {} as Record<string, string>);
