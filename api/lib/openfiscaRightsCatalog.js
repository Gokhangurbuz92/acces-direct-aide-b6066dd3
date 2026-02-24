/**
 * Rights catalog — defines which OpenFisca output variables we track,
 * with labels, explanations, FALC texts, and CTA links.
 *
 * Variable names verified via GET https://api.fr.openfisca.org/latest/variable/{name}:
 *   rsa      → famille / MONTH / Float  — "Revenu de solidarité active"
 *   ppa      → famille / MONTH / Float  — "Prime d'activité" (NOT "prime_activite")
 *   apl      → famille / MONTH / Float  — "Aide personnalisée au logement"
 *   aide_logement → famille / MONTH / Float — "Aide au logement (tout type)"
 */

export const RIGHTS_CATALOG = [
    {
        code: 'rsa',
        variable: 'rsa',
        label: 'RSA (Revenu de solidarité active)',
        category: 'minimum_social',
        explainEligible:
            "D'après votre situation, vous pourriez bénéficier du RSA. " +
            "Ce revenu minimum est versé mensuellement par la CAF ou la MSA. " +
            "Le montant dépend de votre composition familiale et de vos revenus.",
        explainNotEligible:
            'Vos revenus actuels dépassent le plafond du RSA, ou votre situation ' +
            'ne correspond pas aux critères (âge, résidence, etc.).',
        explainFalcEligible:
            'Vous pouvez peut-être recevoir le RSA. ' +
            "C'est de l'argent versé chaque mois pour vous aider à vivre. " +
            'Vous devez faire une demande à la CAF.',
        explainFalcNotEligible:
            'Vous ne pouvez probablement pas recevoir le RSA. ' +
            'Vous gagnez trop ou vous ne remplissez pas les conditions.',
        nextSteps: [
            { type: 'aide', slug: 'rsa' },
            { type: 'demarche', slug: 'demande-rsa' },
        ],
    },
    {
        code: 'prime_activite',
        variable: 'ppa',
        label: "Prime d'activité",
        category: 'complement_revenus',
        explainEligible:
            "Vous pourriez bénéficier de la Prime d'activité. " +
            "Ce complément de revenus est versé par la CAF aux travailleurs aux revenus modestes. " +
            'Son montant dépend de vos revenus professionnels et de votre situation familiale.',
        explainNotEligible:
            "Vos revenus sont en dehors de la fourchette d'éligibilité à la Prime d'activité, " +
            'ou votre statut ne correspond pas (ex. étudiant sans activité suffisante).',
        explainFalcEligible:
            "Vous pouvez peut-être recevoir la Prime d'activité. " +
            "C'est de l'argent en plus pour les personnes qui travaillent " +
            'mais qui ne gagnent pas beaucoup. Demandez à la CAF.',
        explainFalcNotEligible:
            "Vous ne pouvez probablement pas recevoir la Prime d'activité. " +
            "Vos revenus sont trop hauts ou trop bas, ou vous n'avez pas d'activité.",
        nextSteps: [
            { type: 'aide', slug: 'prime-activite' },
            { type: 'demarche', slug: 'demande-prime-activite' },
        ],
    },
    {
        code: 'apl',
        variable: 'apl',
        label: 'APL (Aide personnalisée au logement)',
        category: 'logement',
        explainEligible:
            "Vous pourriez bénéficier de l'APL. Cette aide réduit le montant de votre loyer. " +
            'Elle est versée directement à votre bailleur ou sur votre compte par la CAF.',
        explainNotEligible:
            "L'APL ne semble pas applicable à votre situation. " +
            'Cela peut dépendre du type de logement, de vos revenus ou de votre statut.',
        explainFalcEligible:
            "Vous pouvez peut-être recevoir l'APL. " +
            "C'est une aide pour payer moins cher votre loyer. " +
            'Demandez à la CAF.',
        explainFalcNotEligible:
            "Vous ne pouvez probablement pas recevoir l'APL. " +
            'Votre logement ou vos revenus ne correspondent pas.',
        nextSteps: [
            { type: 'aide', slug: 'apl' },
            { type: 'demarche', slug: 'demande-aide-logement' },
        ],
    },
    {
        code: 'aide_logement',
        variable: 'aide_logement',
        label: 'Aide au logement (tous types)',
        category: 'logement',
        explainEligible:
            "Vous pourriez bénéficier d'une aide au logement (APL, ALS ou ALF selon votre situation). " +
            'Cette aide réduit votre charge de loyer.',
        explainNotEligible:
            "Aucune aide au logement ne semble applicable à votre situation actuelle.",
        explainFalcEligible:
            "Vous pouvez peut-être recevoir une aide pour votre logement. " +
            "Cela peut payer une partie de votre loyer. Demandez à la CAF.",
        explainFalcNotEligible:
            "Vous ne pouvez probablement pas recevoir d'aide pour votre logement.",
        nextSteps: [
            { type: 'aide', slug: 'aide-logement' },
        ],
    },
];

/** Get variables list for OpenFisca output */
export function getOutputVariables() {
    return RIGHTS_CATALOG.map((r) => r.variable);
}

export default { RIGHTS_CATALOG, getOutputVariables };
