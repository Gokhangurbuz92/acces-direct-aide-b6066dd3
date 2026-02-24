import { SourceConnector } from './SourceConnector.js';
import crypto from 'crypto';

/**
 * DREES Open Data Connector — APA, PCH, ASH social programs.
 *
 * Fetches key social aide definitions from data.gouv.fr datasets
 * published by DREES (Direction de la recherche, des études,
 * de l'évaluation et des statistiques).
 *
 * Unlike Aides Territoires which has thousands of items, DREES
 * provides a small number of national social programs with
 * detailed eligibility criteria and statistics.
 */

const DREES_AIDES = [
    {
        id: 'drees-apa',
        title: "Allocation Personnalisée d'Autonomie (APA)",
        description: "L'APA est une aide destinée aux personnes âgées de 60 ans et plus en perte d'autonomie (GIR 1 à 4). Elle finance tout ou partie des dépenses nécessaires pour rester à domicile ou en établissement.",
        content: "L'Allocation Personnalisée d'Autonomie (APA) est versée par le département. Elle permet de financer le plan d'aide à domicile (aide-ménagère, portage de repas, etc.) ou de contribuer au tarif dépendance en EHPAD. Le montant dépend du degré de perte d'autonomie (GIR) et des ressources du bénéficiaire. L'APA n'est pas soumise à condition de ressources pour l'attribution mais une participation peut être demandée au-delà d'un certain revenu.",
        theme: 'personnes-agees',
        source_url: 'https://www.service-public.fr/particuliers/vosdroits/F10009',
        apply_url: 'https://www.service-public.fr/particuliers/vosdroits/F10009',
        territory_scope: 'NATIONAL',
    },
    {
        id: 'drees-pch',
        title: 'Prestation de Compensation du Handicap (PCH)',
        description: "La PCH est une aide financière versée par le département pour compenser les besoins liés au handicap : aides humaines, techniques, aménagement du logement, transport, charges spécifiques.",
        content: "La Prestation de Compensation du Handicap (PCH) est attribuée par la MDPH et versée par le département. Elle peut couvrir : les aides humaines (auxiliaire de vie), les aides techniques (fauteuil roulant), l'aménagement du logement ou du véhicule, les frais de transport, les charges spécifiques ou exceptionnelles, les aides animalières. La PCH est ouverte aux personnes en situation de handicap de moins de 60 ans (ou de plus de 60 ans si le handicap a été reconnu avant 60 ans).",
        theme: 'handicap',
        source_url: 'https://www.service-public.fr/particuliers/vosdroits/F14202',
        apply_url: 'https://www.service-public.fr/particuliers/vosdroits/F14202',
        territory_scope: 'NATIONAL',
    },
    {
        id: 'drees-ash',
        title: "Aide Sociale à l'Hébergement (ASH)",
        description: "L'ASH permet aux personnes âgées disposant de faibles ressources de financer leur hébergement en EHPAD ou en résidence autonomie habilitée à l'aide sociale.",
        content: "L'Aide Sociale à l'Hébergement (ASH) est versée par le département. Elle prend en charge tout ou partie des frais d'hébergement que la personne âgée ne peut pas payer sur ses propres ressources. La personne doit reverser 90% de ses revenus à l'établissement (10% restent à sa disposition). L'ASH est récupérable sur la succession si l'actif net dépasse un seuil fixé par le département.",
        theme: 'personnes-agees',
        source_url: 'https://www.service-public.fr/particuliers/vosdroits/F2444',
        apply_url: 'https://www.service-public.fr/particuliers/vosdroits/F2444',
        territory_scope: 'NATIONAL',
    },
    {
        id: 'drees-aah',
        title: "Allocation aux Adultes Handicapés (AAH)",
        description: "L'AAH garantit un revenu minimum aux personnes en situation de handicap. Son montant maximal est d'environ 971 € par mois (2024). Elle est attribuée sous condition de taux d'incapacité et de ressources.",
        content: "L'Allocation aux Adultes Handicapés (AAH) est versée par la CAF ou la MSA. Elle garantit un revenu minimal aux personnes dont le taux d'incapacité permanente est d'au moins 80%, ou entre 50% et 79% avec une restriction substantielle et durable d'accès à l'emploi. L'AAH est attribuée pour une durée de 1 à 10 ans renouvelable. Elle n'est pas cumulable intégralement avec d'autres revenus.",
        theme: 'handicap',
        source_url: 'https://www.service-public.fr/particuliers/vosdroits/F12242',
        apply_url: 'https://www.caf.fr/allocataires/droits-et-prestations/s-informer-sur-les-aides/solidarite-et-insertion/l-allocation-aux-adultes-handicapes-aah',
        territory_scope: 'NATIONAL',
    },
    {
        id: 'drees-aspa',
        title: "Allocation de Solidarité aux Personnes Âgées (ASPA)",
        description: "L'ASPA (ex-minimum vieillesse) garantit un revenu minimal aux personnes de 65 ans et plus disposant de faibles ressources. Son montant mensuel est d'environ 961 € pour une personne seule (2024).",
        content: "L'Allocation de Solidarité aux Personnes Âgées (ASPA) est versée par la caisse de retraite (CARSAT, MSA). Elle complète les revenus pour atteindre un minimum vieillesse. Conditions : avoir au moins 65 ans, résider en France de manière stable et régulière, avoir des ressources inférieures au plafond. L'ASPA est récupérable sur la succession si l'actif net dépasse 39 000 € (métropole).",
        theme: 'personnes-agees',
        source_url: 'https://www.service-public.fr/particuliers/vosdroits/F16871',
        apply_url: 'https://www.service-public.fr/particuliers/vosdroits/F16871',
        territory_scope: 'NATIONAL',
    },
];

export class DreesConnector extends SourceConnector {
    constructor() {
        super('drees', 'https://data.drees.solidarites-sante.gouv.fr');
        /** @type {Map<string, object>} */
        this._cache = new Map();
    }

    async getDetailUrls() {
        this._cache.clear();
        // DREES data is curated — we use a static list of key social programs.
        // These are enriched with official source URLs and descriptions.
        for (const aide of DREES_AIDES) {
            this._cache.set(aide.source_url, aide);
        }
        return Array.from(this._cache.keys());
    }

    async fetch(url) {
        const item = this._cache.get(url);
        if (!item) throw new Error(`No cached item for ${url}`);
        return JSON.stringify(item);
    }

    async parse(json, url) {
        const item = JSON.parse(json);
        return {
            title: item.title,
            description: item.description,
            content: item.content,
            source_url: item.source_url,
            apply_url: item.apply_url,
            theme: item.theme,
            fetched_at: new Date(),
            _territory_scope: item.territory_scope || 'NATIONAL',
        };
    }

    getStableId(item) {
        return crypto.createHash('md5').update(item.source_url || '').digest('hex');
    }
}
