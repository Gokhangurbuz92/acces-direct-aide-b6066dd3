/**
 * Unit tests for taxonomy mapping
 */

import { describe, it, expect } from 'vitest';
import { mapCategoryFromSource, getCategoryByKey } from './demarches.categories.js';
import { mapSituationFromSource, getSituationByKey } from './demarches.situations.js';

describe('Taxonomy Mapping - Categories', () => {
  it('should map exact category key', () => {
    expect(mapCategoryFromSource('identite')).toBe('identite');
    expect(mapCategoryFromSource('logement')).toBe('logement');
  });

  it('should map category from alias', () => {
    expect(mapCategoryFromSource('carte-identite')).toBe('identite');
    expect(mapCategoryFromSource('passeport')).toBe('identite');
    expect(mapCategoryFromSource('carte vitale')).toBe('sante');
    expect(mapCategoryFromSource('permis')).toBe('mobilite-transport');
    expect(mapCategoryFromSource('carte grise')).toBe('mobilite-transport');
  });

  it('should handle fuzzy matching for common terms', () => {
    expect(mapCategoryFromSource('Demande de carte d\'identité')).toBe('identite');
    expect(mapCategoryFromSource('Allocation logement APL')).toBe('logement');
    expect(mapCategoryFromSource('Inscription Pôle Emploi')).toBe('emploi');
    expect(mapCategoryFromSource('Aide CAF allocations familiales')).toBe('famille');
  });

  it('should normalize accents and special chars', () => {
    expect(mapCategoryFromSource('Impôts et fiscalité')).toBe('budget-impots');
    expect(mapCategoryFromSource('Sécurité sociale santé')).toBe('sante');
  });

  it('should return "autre" for unmapped categories', () => {
    expect(mapCategoryFromSource('Unknown category xyz')).toBe('autre');
    expect(mapCategoryFromSource('')).toBe('autre');
  });

  it('should get category by key', () => {
    const cat = getCategoryByKey('identite');
    expect(cat).toBeDefined();
    expect(cat.key).toBe('identite');
    expect(cat.label).toBe('Identité & État Civil');
  });
});

describe('Taxonomy Mapping - Situations', () => {
  it('should map exact situation key', () => {
    expect(mapSituationFromSource('demenagement')).toBe('demenagement');
    expect(mapSituationFromSource('nouveau-emploi')).toBe('nouveau-emploi');
  });

  it('should map situation from alias', () => {
    expect(mapSituationFromSource('changement adresse')).toBe('demenagement');
    expect(mapSituationFromSource('naissance enfant')).toBe('naissance');
    expect(mapSituationFromSource('perte emploi')).toBe('perte-emploi');
  });

  it('should handle fuzzy matching', () => {
    expect(mapSituationFromSource('Je viens de perdre mon emploi')).toBe('perte-emploi');
    expect(mapSituationFromSource('Naissance de mon bébé')).toBe('naissance');
  });

  it('should return null for unmapped situations', () => {
    expect(mapSituationFromSource('Unknown situation')).toBeNull();
    expect(mapSituationFromSource('')).toBeNull();
  });

  it('should get situation by key', () => {
    const sit = getSituationByKey('demenagement');
    expect(sit).toBeDefined();
    expect(sit.key).toBe('demenagement');
    expect(sit.label).toBe('Déménagement');
  });
});
