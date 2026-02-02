import { describe, it, expect } from 'vitest';

/**
 * Simplified Parser Tests (Structural Validation)
 *
 * Since connectors use CommonJS and complex network dependencies,
 * we validate the expected behavior at a structural level.
 * Full integration tests will verify actual parsing behavior.
 */

describe('Connector Parser Interface', () => {
    it('should enforce that SourceConnector exists and exports expected methods', async () => {
        // Dynamic import of CommonJS module
        const { default: SourceConnector } = await import('../../api/lib/ingestion/SourceConnector.js');

        const connector = new SourceConnector({ name: 'test', domain: 'test.com' });

        expect(connector.name).toBe('test');
        expect(connector.domain).toBe('test.com');
        expect(typeof connector.fetch).toBe('function');
        expect(typeof connector.parse).toBe('function');
        expect(typeof connector.mapToAide).toBe('function');
        expect(typeof connector.getStableId).toBe('function');
        expect(typeof connector.ingest).toBe('function');
    });

    it('should throw error for unimplemented base class methods', async () => {
        const { default: SourceConnector } = await import('../../api/lib/ingestion/SourceConnector.js');
        const connector = new SourceConnector({ name: 'test', domain: 'test.com' });

        // Base class methods should throw when not overridden
        await expect(connector.fetch()).rejects.toThrow();
        expect(() => connector.parse([])).toThrow();
        expect(() => connector.mapToAide({})).toThrow();
    });
});

describe('GrandEst Connector Structure', () => {
    it('should have GrandEstConnector class with correct properties', async () => {
        const GrandEstConnector = (await import('../../api/lib/ingestion/connectors/grandest.js')).default;
        const connector = new GrandEstConnector();

        expect(connector.name).toBe('grandest');
        expect(connector.domain).toBe('grandest.fr');
        expect(typeof connector.fetch).toBe('function');
        expect(typeof connector.parse).toBe('function');
        expect(typeof connector.mapToAide).toBe('function');
        expect(typeof connector.getStableId).toBe('function');
    });
});

describe('AGEFIPH Connector Structure', () => {
    it('should have AgefiphConnector class with correct properties', async () => {
        const AgefiphConnector = (await import('../../api/lib/ingestion/connectors/agefiph.js')).default;
        const connector = new AgefiphConnector();

        expect(connector.name).toBe('agefiph');
        expect(connector.domain).toBe('agefiph.fr');
        expect(typeof connector.fetch).toBe('function');
        expect(typeof connector.parse).toBe('function');
        expect(typeof connector.mapToAide).toBe('function');
        expect(typeof connector.getStableId).toBe('function');
    });
});

/**
 * Structural validation for parsed output
 */
describe('Parser Output Structure', () => {
    it('should enforce required fields in mapToAide output', async () => {
        const GrandEstConnector = (await import('../../api/lib/ingestion/connectors/grandest.js')).default;
        const connector = new GrandEstConnector();

        // Mock input that simulates what parse() would return
        const mockRawItem = {
            title: 'Test Aide',
            url: 'https://www.grandest.fr/aides/test-aide',
            description: 'Description de test',
            organisme: 'Région Grand Est',
            beneficiaires: 'Tous publics',
            montant: '1000€',
            steps: 'Étape 1, Étape 2',
            pieces: 'Pièce 1, Pièce 2',
            applyUrl: 'https://www.grandest.fr/aides/test-aide/demande'
        };

        const parsed = connector.mapToAide(mockRawItem);

        // Verify required fields exist and are non-empty
        expect(parsed.slug).toBeTruthy();
        expect(typeof parsed.slug).toBe('string');
        expect(parsed.title).toBeTruthy();
        expect(parsed.source_url).toBeTruthy();
        expect(parsed.source_url).toContain('grandest.fr');
        expect(parsed.organisme).toBeTruthy();
        expect(parsed.source_domain).toBe('grandest.fr');
        expect(parsed.theme).toBeTruthy();
        expect(parsed.public).toBeTruthy();
        expect(parsed.statut).toBe('publie');
        expect(parsed.fetched_at).toBeInstanceOf(Date);

        // If apply_url was provided, it should be present
        if (mockRawItem.applyUrl) {
            expect(parsed.apply_url).toBeTruthy();
        }
    });

    it('should generate stable IDs consistently', async () => {
        const GrandEstConnector = (await import('../../api/lib/ingestion/connectors/grandest.js')).default;
        const connector = new GrandEstConnector();

        const mockRawItem = {
            url: 'https://www.grandest.fr/aides/test-aide',
            title: 'Test Aide'
        };

        const stableId1 = connector.getStableId(mockRawItem);
        const stableId2 = connector.getStableId(mockRawItem);

        expect(stableId1).toBeTruthy();
        expect(typeof stableId1).toBe('string');
        expect(stableId1).toBe(stableId2); // Must be idempotent
    });
});
