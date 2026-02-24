/**
 * OpenFisca Mapping — transforms wizard answers into OpenFisca test_case format.
 *
 * All variable names verified via GET https://api.fr.openfisca.org/latest/variable/{name}
 * on 2026-02-24.
 */

import { RIGHTS_CATALOG } from './openfiscaRightsCatalog.js';

// --- Enum mappings (wizard values → OpenFisca enum values) ---

/** Maps wizard statut → OpenFisca `activite` enum */
const ACTIVITE_MAP = {
    emploi: 'actif',
    chomage: 'chomeur',
    etudiant: 'etudiant',
    retraite: 'retraite',
    hebergement: 'inactif',
};

/** Maps wizard housing.status → OpenFisca `statut_occupation_logement` enum */
const LOGEMENT_MAP = {
    tenant: 'locataire_vide',
    tenant_hlm: 'locataire_hlm',
    tenant_furnished: 'locataire_meuble',
    owner: 'proprietaire',
    free: 'loge_gratuitement',
    homeless: 'sans_domicile',
};

/**
 * Get current period in YYYY-MM format.
 * @returns {string}
 */
export function getCurrentPeriod() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
}

/**
 * Build OpenFisca test_case from wizard answers.
 *
 * V1: supports single adult household.
 * Future: couple + children via household.adults / household.children.
 *
 * @param {object} answers - Wizard answers
 * @param {string} [period] - YYYY-MM period (defaults to current month)
 * @returns {object} OpenFisca situation JSON
 */
export function buildTestCase(answers, period) {
    const p = period || getCurrentPeriod();

    // --- Individual ---
    const individu = {};

    // Birth date (required)
    if (answers.birthDate) {
        individu.date_naissance = { ETERNITY: answers.birthDate };
    }

    // Activity status
    if (answers.statut) {
        individu.activite = { [p]: ACTIVITE_MAP[answers.statut] || 'inactif' };
    }

    // Income
    const income = answers.income || {};
    individu.salaire_net = { [p]: Number(income.salary) || 0 };
    individu.chomage_net = { [p]: Number(income.unemployment) || 0 };

    // --- Housing / Ménage ---
    const housing = answers.housing || {};
    const menage = {
        personne_de_reference: ['ind_1'],
        conjoint: [],
        enfants: [],
        loyer: { [p]: Number(housing.rent) || 0 },
        charges_locatives: { [p]: Number(housing.charges) || 0 },
        statut_occupation_logement: {
            [p]: LOGEMENT_MAP[housing.status] || 'non_renseigne',
        },
    };

    // depcom: code INSEE commune (prefer depcom, fallback to postalCode with warning)
    if (answers.depcom) {
        menage.depcom = { [p]: String(answers.depcom) };
    } else if (answers.territory) {
        // Use territory as approximate depcom — ideally resolved via geo API
        menage.depcom = { [p]: String(answers.territory) };
    }

    // --- Output variables (what we want OpenFisca to compute) ---
    const outputVariables = RIGHTS_CATALOG.map((r) => r.variable);

    // Build famille with output variable slots
    const famille = {
        parents: ['ind_1'],
        enfants: [],
    };
    for (const v of outputVariables) {
        famille[v] = { [p]: null }; // null = "please compute"
    }

    // --- Assemble situation ---
    return {
        individus: { ind_1: individu },
        familles: { fam_1: famille },
        menages: { men_1: menage },
        foyers_fiscaux: {
            foy_1: {
                declarants: ['ind_1'],
                personnes_a_charge: [],
            },
        },
    };
}

/**
 * Parse OpenFisca calculation response into normalized rights array.
 *
 * @param {object} response - OpenFisca /calculate response
 * @param {string} period - YYYY-MM period
 * @returns {Array<object>} Normalized rights array
 */
export function parseResults(response, period) {
    const p = period || getCurrentPeriod();
    const famille = response?.familles?.fam_1 || {};

    return RIGHTS_CATALOG.map((right) => {
        const variableData = famille[right.variable];
        const amount = variableData?.[p] ?? 0;
        const eligible = amount > 0;

        return {
            code: right.code,
            label: right.label,
            eligible,
            amount: Math.round(amount * 100) / 100,
            explain: eligible ? right.explainEligible : right.explainNotEligible,
            explain_falc: eligible
                ? right.explainFalcEligible
                : right.explainFalcNotEligible,
            next_steps: eligible ? right.nextSteps : [],
            category: right.category,
        };
    });
}

export default { buildTestCase, parseResults, getCurrentPeriod };
