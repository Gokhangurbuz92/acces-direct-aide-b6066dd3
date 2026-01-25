import BaseConnector from './BaseConnector.js';
import { IngestionMode } from '../Policy.js';

/**
 * Pilot Connector 2: Alsace Structures (Mock)
 * Simulates fetching from a local CSV or API for Alsace (67/68).
 */
export default class AlsaceStructuresConnector extends BaseConnector {
    constructor() {
        super({
            name: 'ALSACE_STRUCTURES_LOCAL',
            mode: IngestionMode.SCRAPE // Simulating we might be reading from a "lesser" source or direct file
        });
    }

    async fetchItems() {
        // Simulating data for Alsace
        return [
            {
                entityType: 'Structure',
                data: {
                    slug: 'structure-alsace-test-1',
                    nom: 'Maison de la Région Alsace',
                    type_structure: 'service_public',
                    description_courte: 'Antenne régionale en Alsace.',
                    adresse: '1 Place du Wacken',
                    ville: 'Strasbourg',
                    code_postal: '67000',
                    departement: '67',
                    source_url_exact: 'https://www.grandest.fr/alsace',
                    territory_scope: 'DEP_67',
                    statut: 'publie'
                },
                rawContent: 'Maison de la Région Alsace, Strasbourg...'
            }
        ];
    }
}
