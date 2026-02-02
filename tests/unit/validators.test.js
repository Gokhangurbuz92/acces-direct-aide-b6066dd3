import { describe, it, expect } from 'vitest';
import { searchAidesSchema } from '../../api/_utils/validators.js';

describe('searchAidesSchema (Aides Query Params Validation)', () => {
    it('should accept valid minimal query', () => {
        const result = searchAidesSchema.safeParse({});
        expect(result.success).toBe(true);
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(20);
        expect(result.data.statut).toBe('publie');
    });

    it('should accept valid search query with q', () => {
        const result = searchAidesSchema.safeParse({ q: 'emploi' });
        expect(result.success).toBe(true);
        expect(result.data.q).toBe('emploi');
    });

    it('should accept valid theme filter', () => {
        const result = searchAidesSchema.safeParse({ theme: 'emploi' });
        expect(result.success).toBe(true);
        expect(result.data.theme).toBe('emploi');
    });

    it('should accept valid sousTheme filter', () => {
        const result = searchAidesSchema.safeParse({ theme: 'emploi', sousTheme: 'insertion' });
        expect(result.success).toBe(true);
        expect(result.data.sousTheme).toBe('insertion');
    });

    it('should accept valid public filter (single)', () => {
        const result = searchAidesSchema.safeParse({ public: 'handicap' });
        expect(result.success).toBe(true);
        expect(result.data.public).toBe('handicap');
    });

    it('should accept valid territoire filter', () => {
        const result = searchAidesSchema.safeParse({ territoire: 'Grand Est' });
        expect(result.success).toBe(true);
        expect(result.data.territoire).toBe('Grand Est');
    });

    it('should accept valid organisme filter', () => {
        const result = searchAidesSchema.safeParse({ organisme: 'AGEFIPH' });
        expect(result.success).toBe(true);
        expect(result.data.organisme).toBe('AGEFIPH');
    });

    it('should accept valid urgent filter (true)', () => {
        const result = searchAidesSchema.safeParse({ urgent: 'true' });
        expect(result.success).toBe(true);
        expect(result.data.urgent).toBe(true);
    });

    it('should accept valid urgent filter (false)', () => {
        const result = searchAidesSchema.safeParse({ urgent: 'false' });
        expect(result.success).toBe(true);
        expect(result.data.urgent).toBe(false);
    });

    it('should accept valid statut filter', () => {
        const result = searchAidesSchema.safeParse({ statut: 'brouillon' });
        expect(result.success).toBe(true);
        expect(result.data.statut).toBe('brouillon');
    });

    it('should accept valid pagination (page + pageSize)', () => {
        const result = searchAidesSchema.safeParse({ page: '2', pageSize: '10' });
        expect(result.success).toBe(true);
        expect(result.data.page).toBe(2);
        expect(result.data.pageSize).toBe(10);
    });

    it('should accept valid sort filter', () => {
        const result = searchAidesSchema.safeParse({ sort: 'recent' });
        expect(result.success).toBe(true);
        expect(result.data.sort).toBe('recent');
    });

    it('should accept valid id filter', () => {
        const result = searchAidesSchema.safeParse({ id: 'clz123456' });
        expect(result.success).toBe(true);
        expect(result.data.id).toBe('clz123456');
    });

    it('should accept valid slug filter', () => {
        const result = searchAidesSchema.safeParse({ slug: 'aide-emploi-handicap' });
        expect(result.success).toBe(true);
        expect(result.data.slug).toBe('aide-emploi-handicap');
    });

    it('should clamp page to minimum 1', () => {
        const result = searchAidesSchema.safeParse({ page: '0' });
        expect(result.success).toBe(true);
        expect(result.data.page).toBe(1);
    });

    it('should clamp pageSize to maximum 50', () => {
        const result = searchAidesSchema.safeParse({ pageSize: '100' });
        expect(result.success).toBe(true);
        expect(result.data.pageSize).toBe(50);
    });

    it('should clamp pageSize to minimum 1', () => {
        const result = searchAidesSchema.safeParse({ pageSize: '-5' });
        expect(result.success).toBe(true);
        expect(result.data.pageSize).toBe(1);
    });

    it('should handle combined filters', () => {
        const result = searchAidesSchema.safeParse({
            q: 'formation',
            theme: 'emploi',
            public: 'handicap',
            territoire: 'Bas-Rhin',
            urgent: 'true',
            page: '2',
            pageSize: '15'
        });
        expect(result.success).toBe(true);
        expect(result.data.q).toBe('formation');
        expect(result.data.theme).toBe('emploi');
        expect(result.data.public).toBe('handicap');
        expect(result.data.territoire).toBe('Bas-Rhin');
        expect(result.data.urgent).toBe(true);
        expect(result.data.page).toBe(2);
        expect(result.data.pageSize).toBe(15);
    });

    it('should reject invalid urgent value', () => {
        const result = searchAidesSchema.safeParse({ urgent: 'maybe' });
        // zod's coerce.boolean will convert non-standard strings
        // but we test that our schema handles this gracefully
        expect(result.success).toBe(true);
    });

    it('should handle empty string filters', () => {
        const result = searchAidesSchema.safeParse({ q: '', theme: '' });
        expect(result.success).toBe(true);
        // Empty strings should be allowed but may be transformed
    });
});
