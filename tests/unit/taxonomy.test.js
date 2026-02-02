import { describe, it, expect } from 'vitest';
import { mapTheme, mapPublic, mapTerritoire, THEMES, PUBLICS, TERRITOIRES } from '../../api/lib/ingestion/taxonomy.js';

describe('Taxonomy Mapping', () => {
    describe('mapTheme', () => {
        it('should map exact match (case insensitive)', () => {
            expect(mapTheme('emploi')).toBe('emploi');
            expect(mapTheme('EMPLOI')).toBe('emploi');
            expect(mapTheme('Emploi')).toBe('emploi');
        });

        it('should map partial match (employment -> emploi)', () => {
            expect(mapTheme('employment')).toBe('emploi');
            expect(mapTheme('travail')).toBe('emploi');
        });

        it('should map housing keywords to logement', () => {
            expect(mapTheme('housing')).toBe('logement');
            expect(mapTheme('logement')).toBe('logement');
            expect(mapTheme('habitation')).toBe('logement');
        });

        it('should map health keywords to sante', () => {
            expect(mapTheme('health')).toBe('sante');
            expect(mapTheme('santé')).toBe('sante');
            expect(mapTheme('medical')).toBe('sante');
        });

        it('should map mobility keywords to mobilite', () => {
            expect(mapTheme('mobility')).toBe('mobilite');
            expect(mapTheme('mobilité')).toBe('mobilite');
            expect(mapTheme('transport')).toBe('mobilite');
        });

        it('should map formation keywords to formation', () => {
            expect(mapTheme('formation')).toBe('formation');
            expect(mapTheme('training')).toBe('formation');
        });

        it('should map social keywords to social', () => {
            expect(mapTheme('social')).toBe('social');
            expect(mapTheme('aide sociale')).toBe('social');
        });

        it('should return first theme as default for unknown input', () => {
            const result = mapTheme('unknown-category-xyz');
            expect(THEMES).toContain(result);
        });

        it('should return first theme for empty input', () => {
            const result = mapTheme('');
            expect(THEMES).toContain(result);
        });

        it('should return first theme for null/undefined', () => {
            const result1 = mapTheme(null);
            const result2 = mapTheme(undefined);
            expect(THEMES).toContain(result1);
            expect(THEMES).toContain(result2);
        });
    });

    describe('mapPublic', () => {
        it('should map handicap keywords', () => {
            expect(mapPublic('handicap')).toBe('handicap');
            expect(mapPublic('disability')).toBe('handicap');
            expect(mapPublic('personnes handicapées')).toBe('handicap');
        });

        it('should map seniors keywords', () => {
            expect(mapPublic('seniors')).toBe('seniors');
            expect(mapPublic('personnes âgées')).toBe('seniors');
            expect(mapPublic('retraités')).toBe('seniors');
        });

        it('should map jeunes keywords', () => {
            expect(mapPublic('jeunes')).toBe('jeunes');
            expect(mapPublic('youth')).toBe('jeunes');
            expect(mapPublic('moins de 26 ans')).toBe('jeunes');
        });

        it('should map famille keywords', () => {
            expect(mapPublic('famille')).toBe('famille');
            expect(mapPublic('familles')).toBe('famille');
            expect(mapPublic('parents')).toBe('famille');
        });

        it('should map demandeurs emploi keywords', () => {
            expect(mapPublic('demandeurs d\\'emploi')).toBe('demandeurs_emploi');
            expect(mapPublic('chômeurs')).toBe('demandeurs_emploi');
            expect(mapPublic('jobseekers')).toBe('demandeurs_emploi');
        });

        it('should map travailleurs keywords', () => {
            expect(mapPublic('travailleurs')).toBe('travailleurs');
            expect(mapPublic('salariés')).toBe('travailleurs');
            expect(mapPublic('workers')).toBe('travailleurs');
        });

        it('should map etudiants keywords', () => {
            expect(mapPublic('étudiants')).toBe('etudiants');
            expect(mapPublic('students')).toBe('etudiants');
        });

        it('should return first public as default for unknown input', () => {
            const result = mapPublic('unknown-public-xyz');
            expect(PUBLICS).toContain(result);
        });

        it('should handle null/undefined gracefully', () => {
            const result1 = mapPublic(null);
            const result2 = mapPublic(undefined);
            expect(PUBLICS).toContain(result1);
            expect(PUBLICS).toContain(result2);
        });
    });

    describe('mapTerritoire', () => {
        it('should map Grand Est keywords', () => {
            expect(mapTerritoire('Grand Est')).toBe('Grand Est');
            expect(mapTerritoire('région grand est')).toBe('Grand Est');
        });

        it('should map Bas-Rhin keywords', () => {
            expect(mapTerritoire('Bas-Rhin')).toBe('Bas-Rhin');
            expect(mapTerritoire('67')).toBe('Bas-Rhin');
            expect(mapTerritoire('strasbourg')).toBe('Bas-Rhin');
        });

        it('should map Haut-Rhin keywords', () => {
            expect(mapTerritoire('Haut-Rhin')).toBe('Haut-Rhin');
            expect(mapTerritoire('68')).toBe('Haut-Rhin');
            expect(mapTerritoire('mulhouse')).toBe('Haut-Rhin');
        });

        it('should map national keywords', () => {
            expect(mapTerritoire('national')).toBe('national');
            expect(mapTerritoire('france')).toBe('national');
            expect(mapTerritoire('toute la france')).toBe('national');
        });

        it('should return first territoire as default for unknown input', () => {
            const result = mapTerritoire('unknown-place-xyz');
            expect(TERRITOIRES).toContain(result);
        });

        it('should handle null/undefined gracefully', () => {
            const result1 = mapTerritoire(null);
            const result2 = mapTerritoire(undefined);
            expect(TERRITOIRES).toContain(result1);
            expect(TERRITOIRES).toContain(result2);
        });
    });

    describe('Taxonomy Constants', () => {
        it('should have defined THEMES', () => {
            expect(Array.isArray(THEMES)).toBe(true);
            expect(THEMES.length).toBeGreaterThan(0);
            expect(THEMES).toContain('emploi');
            expect(THEMES).toContain('logement');
            expect(THEMES).toContain('sante');
            expect(THEMES).toContain('mobilite');
        });

        it('should have defined PUBLICS', () => {
            expect(Array.isArray(PUBLICS)).toBe(true);
            expect(PUBLICS.length).toBeGreaterThan(0);
            expect(PUBLICS).toContain('handicap');
            expect(PUBLICS).toContain('seniors');
            expect(PUBLICS).toContain('jeunes');
        });

        it('should have defined TERRITOIRES', () => {
            expect(Array.isArray(TERRITOIRES)).toBe(true);
            expect(TERRITOIRES.length).toBeGreaterThan(0);
            expect(TERRITOIRES).toContain('national');
            expect(TERRITOIRES).toContain('Grand Est');
            expect(TERRITOIRES).toContain('Bas-Rhin');
            expect(TERRITOIRES).toContain('Haut-Rhin');
        });
    });
});
