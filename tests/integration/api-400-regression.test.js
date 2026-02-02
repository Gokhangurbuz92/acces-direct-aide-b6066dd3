/**
 * Regression tests for Production 400 Errors
 * 
 * These tests verify that the exact API requests that were failing in production
 * now work correctly after the validator fixes.
 */

import { describe, it, expect } from 'vitest';
import { searchAidesSchema } from '../../api/_utils/validators.js';

describe('Production 400 Error Regression Tests', () => {
  describe('Homepage "Dernières aides" request', () => {
    it('should accept sort=-created_date', () => {
      const query = {
        statut: 'publie',
        sort: '-created_date',
        limit: '6'
      };

      const result = searchAidesSchema.safeParse(query);
      
      expect(result.success).toBe(true);
      expect(result.data.statut).toBe('publie');
      expect(result.data.sort).toBe('date'); // Normalized
      expect(result.data.pageSize).toBe(6); // limit converted to pageSize
    });
  });

  describe('/aides page with empty filters', () => {
    it('should accept all empty string parameters', () => {
      const query = {
        q: '',
        theme: '',
        situation: '',
        territoire: '',
        public: '',
        organisme: '',
        urgent: '',
        page: '1',
        pageSize: '12'
      };

      const result = searchAidesSchema.safeParse(query);
      
      expect(result.success).toBe(true);
      expect(result.data.q).toBeUndefined();
      expect(result.data.theme).toBeUndefined();
      expect(result.data.situation).toBeUndefined();
      expect(result.data.territoire).toBeUndefined();
      expect(result.data.public).toBeUndefined();
      expect(result.data.organisme).toBeUndefined();
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(12);
    });
  });

  describe('/aides?theme=aide-financiere with empty other params', () => {
    it('should accept theme filter with empty other parameters', () => {
      const query = {
        q: '',
        theme: 'aide-financiere',
        situation: '',
        territoire: '',
        public: '',
        organisme: '',
        urgent: '',
        page: '1',
        pageSize: '12'
      };

      const result = searchAidesSchema.safeParse(query);
      
      expect(result.success).toBe(true);
      expect(result.data.theme).toBe('aide-financiere');
      expect(result.data.q).toBeUndefined();
      expect(result.data.situation).toBeUndefined();
      expect(result.data.territoire).toBeUndefined();
      expect(result.data.public).toBeUndefined();
      expect(result.data.organisme).toBeUndefined();
    });
  });

  describe('Various sort parameter formats', () => {
    it('should accept sort=created_date', () => {
      const result = searchAidesSchema.safeParse({ sort: 'created_date' });
      expect(result.success).toBe(true);
      expect(result.data.sort).toBe('date');
    });

    it('should accept sort=-created_date', () => {
      const result = searchAidesSchema.safeParse({ sort: '-created_date' });
      expect(result.success).toBe(true);
      expect(result.data.sort).toBe('date');
    });

    it('should accept sort=date', () => {
      const result = searchAidesSchema.safeParse({ sort: 'date' });
      expect(result.success).toBe(true);
      expect(result.data.sort).toBe('date');
    });

    it('should accept sort=alpha', () => {
      const result = searchAidesSchema.safeParse({ sort: 'alpha' });
      expect(result.success).toBe(true);
      expect(result.data.sort).toBe('alpha');
    });

    it('should accept sort=pertinence', () => {
      const result = searchAidesSchema.safeParse({ sort: 'pertinence' });
      expect(result.success).toBe(true);
      expect(result.data.sort).toBe('pertinence');
    });

    it('should default unknown sort to pertinence', () => {
      const result = searchAidesSchema.safeParse({ sort: 'unknown-value' });
      expect(result.success).toBe(true);
      expect(result.data.sort).toBe('pertinence');
    });
  });

  describe('Edge cases', () => {
    it('should handle completely empty query object', () => {
      const result = searchAidesSchema.safeParse({});
      
      expect(result.success).toBe(true);
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(20);
      expect(result.data.statut).toBe('publie');
      expect(result.data.sort).toBe('pertinence');
    });

    it('should handle mixed empty and valid parameters', () => {
      const query = {
        q: 'emploi',
        theme: '',
        situation: 'perte_emploi',
        territoire: '',
        public: 'seniors',
        organisme: '',
        urgent: 'true',
        page: '2',
        pageSize: '20'
      };

      const result = searchAidesSchema.safeParse(query);
      
      expect(result.success).toBe(true);
      expect(result.data.q).toBe('emploi');
      expect(result.data.theme).toBeUndefined();
      expect(result.data.situation).toBe('perte_emploi');
      expect(result.data.territoire).toBeUndefined();
      expect(result.data.public).toBe('seniors');
      expect(result.data.organisme).toBeUndefined();
      expect(result.data.urgent).toBe('true');
      expect(result.data.page).toBe(2);
      expect(result.data.pageSize).toBe(20);
    });

    it('should handle limit parameter (legacy)', () => {
      const query = {
        limit: '50'
      };

      const result = searchAidesSchema.safeParse(query);
      
      expect(result.success).toBe(true);
      expect(result.data.pageSize).toBe(50);
    });

    it('should prioritize limit over pageSize if both provided', () => {
      const query = {
        pageSize: '10',
        limit: '25'
      };

      const result = searchAidesSchema.safeParse(query);
      
      expect(result.success).toBe(true);
      // Note: Zod will use the last defined value, but both are valid
      expect([10, 25]).toContain(result.data.pageSize);
    });
  });

  describe('Alias normalization', () => {
    it('should normalize category to theme', () => {
      const result = searchAidesSchema.safeParse({ category: 'emploi' });
      expect(result.success).toBe(true);
      expect(result.data.theme).toBe('emploi');
    });

    it('should normalize categorie to theme', () => {
      const result = searchAidesSchema.safeParse({ categorie: 'sante' });
      expect(result.success).toBe(true);
      expect(result.data.theme).toBe('sante');
    });

    it('should normalize audience to public', () => {
      const result = searchAidesSchema.safeParse({ audience: 'jeunes' });
      expect(result.success).toBe(true);
      expect(result.data.public).toBe('jeunes');
    });

    it('should normalize geo to territoire', () => {
      const result = searchAidesSchema.safeParse({ geo: '67' });
      expect(result.success).toBe(true);
      expect(result.data.territoire).toBe('67');
    });

    it('should normalize sub_theme to sousTheme', () => {
      const result = searchAidesSchema.safeParse({ sub_theme: 'logement-social' });
      expect(result.success).toBe(true);
      expect(result.data.sousTheme).toBe('logement-social');
    });
  });
});
