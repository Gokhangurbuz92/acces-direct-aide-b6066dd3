import BaseConnector from './BaseConnector.js';
import { IngestionMode } from '../Policy.js';

/**
 * Pilot Connector 1: National Aides (Mock)
 * Simulates fetching from a National API.
 */
export default class NationalAidesConnector extends BaseConnector {
    constructor() {
        super({
            name: 'NATIONAL_AIDES_API',
            mode: IngestionMode.API
        });
    }

    async fetchItems() {
        // In a real scenario, this would be fetch('https://api.aides-territoires.beta.gouv.fr/...')
        // For the pilot, we return mock data that matches schema.

        return [
            {
                entityType: 'Aide',
                data: {
                    slug: 'aide-nationale-test-1',
                    titre: 'Aide Nationale Test 1',
                    cest_quoi: 'Ceci est une aide nationale de test ingérée par le connecteur.',
                    categorie: 'logement',
                    territoires: ['national'],
                    source_url_exact: 'https://aides-territoires.beta.gouv.fr/aides/1234',
                    territory_scope: 'NATIONAL',
                    statut: 'publie'
                },
                rawContent: JSON.stringify({ id: 1234, title: 'Aide Nationale Test 1', body: '...' })
            },
            {
                entityType: 'Aide',
                data: {
                    slug: 'aide-nationale-test-2',
                    titre: 'Aide Nationale Test 2',
                    cest_quoi: 'Une autre aide nationale.',
                    categorie: 'emploi',
                    territoires: ['national'],
                    source_url_exact: 'https://aides-territoires.beta.gouv.fr/aides/5678',
                    territory_scope: 'NATIONAL',
                    statut: 'publie'
                },
                rawContent: JSON.stringify({ id: 5678, title: 'Aide Nationale Test 2', body: '...' })
            }
        ];
    }
}
