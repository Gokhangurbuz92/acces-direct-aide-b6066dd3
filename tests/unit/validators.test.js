import { describe, it, expect } from 'vitest';
import { searchAidesSchema } from '../../api/_utils/validators.js';

describe('searchAidesSchema', () => {
  it('should handle empty string values', () => {
    const input = {
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

    const result = searchAidesSchema.safeParse(input);
    expect(result.success).toBe(true);
    expect(result.data.q).toBeUndefined();
    expect(result.data.theme).toBeUndefined();
    expect(result.data.situation).toBeUndefined();
    expect(result.data.territoire).toBeUndefined();
    expect(result.data.public).toBeUndefined();
    expect(result.data.organisme).toBeUndefined();
  });

  it('should handle sort=-created_date', () => {
    const input = {
      statut: 'publie',
      sort: '-created_date',
      limit: '6'
    };

    const result = searchAidesSchema.safeParse(input);
    expect(result.success).toBe(true);
    expect(result.data.sort).toBe('date');
  });

  it('should handle sort=created_date', () => {
    const input = {
      sort: 'created_date'
    };

    const result = searchAidesSchema.safeParse(input);
    expect(result.success).toBe(true);
    expect(result.data.sort).toBe('date');
  });

  it('should handle theme=aide-financiere with empty other params', () => {
    const input = {
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

    const result = searchAidesSchema.safeParse(input);
    expect(result.success).toBe(true);
    expect(result.data.theme).toBe('aide-financiere');
    expect(result.data.q).toBeUndefined();
    expect(result.data.situation).toBeUndefined();
  });

  it('should normalize category to theme', () => {
    const input = {
      category: 'emploi'
    };

    const result = searchAidesSchema.safeParse(input);
    expect(result.success).toBe(true);
    expect(result.data.theme).toBe('emploi');
  });

  it('should normalize audience to public', () => {
    const input = {
      audience: 'seniors'
    };

    const result = searchAidesSchema.safeParse(input);
    expect(result.success).toBe(true);
    expect(result.data.public).toBe('seniors');
  });

  it('should handle default values', () => {
    const input = {};

    const result = searchAidesSchema.safeParse(input);
    expect(result.success).toBe(true);
    expect(result.data.page).toBe(1);
    expect(result.data.pageSize).toBe(20);
    expect(result.data.statut).toBe('publie');
    expect(result.data.sort).toBe('pertinence');
  });

  it('should handle sort=alpha', () => {
    const input = {
      sort: 'alpha'
    };

    const result = searchAidesSchema.safeParse(input);
    expect(result.success).toBe(true);
    expect(result.data.sort).toBe('alpha');
  });

  it('should handle sort=pertinence', () => {
    const input = {
      sort: 'pertinence'
    };

    const result = searchAidesSchema.safeParse(input);
    expect(result.success).toBe(true);
    expect(result.data.sort).toBe('pertinence');
  });

  it('should default unknown sort values to pertinence', () => {
    const input = {
      sort: 'unknown-sort-value'
    };

    const result = searchAidesSchema.safeParse(input);
    expect(result.success).toBe(true);
    expect(result.data.sort).toBe('pertinence');
  });
});
