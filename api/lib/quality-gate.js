/**
 * P0-5: Publication Quality Gate
 *
 * Validates that content meets minimum quality requirements before publishing.
 * Returns { valid: boolean, errors: string[], warnings: string[] }
 */

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;
const TWELVE_MONTHS_MS = 12 * 30 * 24 * 60 * 60 * 1000;

/**
 * Validate an Aide for publication readiness.
 */
export function validateAideForPublication(aide) {
  const errors = [];
  const warnings = [];

  // Hard blocks (cannot publish)
  if (!aide.source_url && !aide.source_url_exact && !aide.lien_demande && !aide.apply_url) {
    errors.push('Source URL manquante : impossible de publier sans lien source ou lien de demande.');
  }

  if (!aide.summary_falc) {
    errors.push('Résumé FALC manquant : un résumé en langage simplifié est obligatoire.');
  }

  if (!aide.titre) {
    errors.push('Titre manquant.');
  }

  // Soft warnings
  const lastVerified = aide.date_verification || aide.last_checked_at;
  if (lastVerified) {
    const age = Date.now() - new Date(lastVerified).getTime();
    if (age > TWELVE_MONTHS_MS) {
      warnings.push('Dernière vérification il y a plus de 12 mois — fiche potentiellement obsolète.');
    } else if (age > SIX_MONTHS_MS) {
      warnings.push('Dernière vérification il y a plus de 6 mois — une revérification est recommandée.');
    }
  } else {
    warnings.push('Aucune date de vérification renseignée.');
  }

  if (!aide.cest_quoi && !aide.pour_qui) {
    warnings.push('Contenu principal vide (\"C\'est quoi ?\" et \"Pour qui ?\" manquants).');
  }

  if (!aide.territoires || aide.territoires.length === 0) {
    warnings.push('Aucun territoire renseigné.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate a Demarche for publication readiness.
 */
export function validateDemarcheForPublication(demarche) {
  const errors = [];
  const warnings = [];

  if (!demarche.source_url && !demarche.source_url_exact && !demarche.lien_officiel) {
    errors.push('Source URL manquante : impossible de publier sans lien source ou lien officiel.');
  }

  if (!demarche.summary_falc) {
    errors.push('Résumé FALC manquant : un résumé en langage simplifié est obligatoire.');
  }

  if (!demarche.titre) {
    errors.push('Titre manquant.');
  }

  const lastVerified = demarche.date_verification || demarche.last_checked_at;
  if (lastVerified) {
    const age = Date.now() - new Date(lastVerified).getTime();
    if (age > TWELVE_MONTHS_MS) {
      warnings.push('Dernière vérification il y a plus de 12 mois.');
    } else if (age > SIX_MONTHS_MS) {
      warnings.push('Dernière vérification il y a plus de 6 mois.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate a Structure for publication readiness.
 */
export function validateStructureForPublication(structure) {
  const errors = [];
  const warnings = [];

  if (!structure.nom) {
    errors.push('Nom manquant.');
  }

  if (!structure.summary_falc) {
    warnings.push('Résumé FALC manquant — recommandé pour l\'accessibilité.');
  }

  if (!structure.adresse && !structure.ville) {
    warnings.push('Adresse ou ville manquante.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Generic validation dispatcher based on entity type.
 */
export function validateForPublication(entityType, entity) {
  switch (entityType) {
    case 'aide':
    case 'Aide':
      return validateAideForPublication(entity);
    case 'demarche':
    case 'Demarche':
      return validateDemarcheForPublication(entity);
    case 'structure':
    case 'Structure':
      return validateStructureForPublication(entity);
    default:
      return { valid: true, errors: [], warnings: [] };
  }
}

export default {
  validateAideForPublication,
  validateDemarcheForPublication,
  validateStructureForPublication,
  validateForPublication,
};
