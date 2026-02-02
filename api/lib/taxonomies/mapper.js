/**
 * Taxonomy Mapper - Centralized mapping logic
 * Maps source data to stable taxonomy keys
 */

import { mapCategoryFromSource, getCategoryByKey } from './demarches.categories.js';
import { mapSituationFromSource, getSituationByKey } from './demarches.situations.js';

/**
 * Map a démarche title/description to category + situations
 * @param {Object} rawData - { titre, description, keywords, organisme, ... }
 * @returns {Object} - { categorie, situations[] }
 */
export function mapDemarcheToTaxonomy(rawData) {
  const { titre, description, keywords = [], organisme } = rawData;

  // Build combined text for analysis
  const combinedText = [
    titre || '',
    description || '',
    keywords.join(' '),
    organisme || ''
  ].join(' ').toLowerCase();

  // 1. Map category
  let categorie = null;

  // Try organisme-based mapping first (most reliable)
  if (organisme) {
    categorie = mapCategoryFromOrganisme(organisme);
  }

  // Try title/description if no match
  if (!categorie) {
    categorie = mapCategoryFromSource(titre);
  }

  // Fallback to combined text
  if (!categorie) {
    categorie = mapCategoryFromSource(combinedText);
  }

  // Default
  if (!categorie) {
    categorie = 'autre';
  }

  // 2. Map situations (multi-select)
  const situations = [];

  // Analyze combined text for situation keywords
  const situationCandidates = [
    { key: 'je-cherche-un-logement', keywords: ['logement', 'hlm', 'als', 'apl'] },
    { key: 'je-suis-au-chomage', keywords: ['chomage', 'pole-emploi', 'are'] },
    { key: 'j-ai-des-difficultes-financieres', keywords: ['rsa', 'prime-activite', 'aide-financiere'] },
    { key: 'je-suis-en-situation-de-handicap', keywords: ['handicap', 'aah', 'mdph', 'rqth'] },
    { key: 'je-suis-parent', keywords: ['enfant', 'famille', 'caf', 'allocations-familiales', 'creche'] },
    { key: 'je-cherche-des-soins', keywords: ['sante', 'carte-vitale', 'ameli', 'cpam', 'css'] },
    { key: 'je-suis-senior', keywords: ['retraite', 'apa', 'aspa', 'senior', 'age'] },
    { key: 'je-suis-etranger', keywords: ['titre-sejour', 'asile', 'naturalisation', 'visa', 'prefecture'] },
    { key: 'je-suis-etudiant', keywords: ['crous', 'bourse', 'etudiant', 'universite'] },
    { key: 'je-cherche-un-emploi', keywords: ['emploi', 'travail', 'pole-emploi'] },
    { key: 'je-suis-en-formation', keywords: ['formation', 'apprentissage'] }
  ];

  for (const candidate of situationCandidates) {
    for (const keyword of candidate.keywords) {
      if (combinedText.includes(keyword)) {
        if (!situations.includes(candidate.key)) {
          situations.push(candidate.key);
        }
        break;
      }
    }
  }

  // If no situation detected, default to "toutes"
  if (situations.length === 0) {
    situations.push('toutes');
  }

  return {
    categorie,
    situations
  };
}

/**
 * Map organisme to category (heuristic)
 */
function mapCategoryFromOrganisme(organisme) {
  const normalized = organisme.toLowerCase();

  if (normalized.includes('ants')) return 'mobilite-transport';
  if (normalized.includes('ameli') || normalized.includes('cpam') || normalized.includes('assurance-maladie')) return 'sante';
  if (normalized.includes('caf')) return 'famille';
  if (normalized.includes('impot') || normalized.includes('dgfip')) return 'budget-impots';
  if (normalized.includes('pole-emploi') || normalized.includes('france-travail')) return 'emploi';
  if (normalized.includes('prefecture')) return 'immigration-integration';
  if (normalized.includes('mdph')) return 'handicap';
  if (normalized.includes('crous')) return 'etudes-formation';
  if (normalized.includes('justice') || normalized.includes('tribunal')) return 'justice-droit';
  if (normalized.includes('service-public')) return null; // Generic, need content-based

  return null;
}

/**
 * Sync category with database AidCategory
 * (Ensures category exists in DB or creates it)
 * @param {Object} prisma - Prisma client
 * @param {string} categoryKey - Category key
 * @returns {Promise<string>} - Category ID
 */
export async function ensureCategoryExists(prisma, categoryKey) {
  const categoryData = getCategoryByKey(categoryKey);
  if (!categoryData) {
    throw new Error(`Unknown category key: ${categoryKey}`);
  }

  const category = await prisma.aidCategory.upsert({
    where: { slug: categoryData.key },
    update: { label: categoryData.label },
    create: {
      slug: categoryData.key,
      label: categoryData.label
    }
  });

  return category.id;
}

/**
 * Sync situations with database LifeSituation
 * @param {Object} prisma - Prisma client
 * @param {string[]} situationKeys - Situation keys
 * @returns {Promise<string[]>} - Situation IDs
 */
export async function ensureSituationsExist(prisma, situationKeys) {
  const situationIds = [];

  for (const key of situationKeys) {
    const situationData = getSituationByKey(key);
    if (!situationData) {
      console.warn(`Unknown situation key: ${key}`);
      continue;
    }

    const situation = await prisma.lifeSituation.upsert({
      where: { slug: situationData.key },
      update: { label: situationData.label },
      create: {
        slug: situationData.key,
        label: situationData.label
      }
    });

    situationIds.push(situation.id);
  }

  return situationIds;
}

export default {
  mapDemarcheToTaxonomy,
  ensureCategoryExists,
  ensureSituationsExist
};
