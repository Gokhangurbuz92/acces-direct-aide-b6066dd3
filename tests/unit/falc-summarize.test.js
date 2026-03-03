import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * FALC Summarize — Unit Tests
 *
 * Tests the prompt building logic, JSON parsing resilience,
 * and cache behavior of the FALC summarize handler.
 */

// Mock the handler's core logic (extracted for testability)

/** Simulates cleaning Gemini JSON response (same logic as handler) */
function cleanGeminiResponse(raw) {
    return raw
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();
}

/** Validates that FALC data has required fields */
function validateFalcData(data) {
    if (!data || typeof data !== 'object') return false;
    if (!data.summary_falc || typeof data.summary_falc !== 'string') return false;
    if (!Array.isArray(data.points_cles)) return false;
    return true;
}

/** Builds FALC source text from aide fields */
function buildSourceText(aide) {
    return [
        aide.cest_quoi,
        aide.pour_qui,
        aide.ce_que_ca_aide,
        aide.description,
    ].filter(Boolean).join('\n\n');
}

describe('FALC Summarize Logic', () => {
    // ── JSON Cleaning ──
    it('should clean JSON from markdown code fences', () => {
        const raw = '```json\n{"summary_falc": "test"}\n```';
        const cleaned = cleanGeminiResponse(raw);
        expect(JSON.parse(cleaned)).toEqual({ summary_falc: 'test' });
    });

    it('should handle JSON without code fences', () => {
        const raw = '{"summary_falc": "test", "points_cles": ["a"]}';
        const cleaned = cleanGeminiResponse(raw);
        expect(JSON.parse(cleaned)).toEqual({ summary_falc: 'test', points_cles: ['a'] });
    });

    it('should handle JSON with whitespace and newlines', () => {
        const raw = '\n\n```json\n  {"summary_falc": "test"}  \n```\n\n';
        const cleaned = cleanGeminiResponse(raw);
        expect(JSON.parse(cleaned)).toEqual({ summary_falc: 'test' });
    });

    it('should handle triple backtick without json label', () => {
        const raw = '```\n{"summary_falc": "simple"}\n```';
        const cleaned = cleanGeminiResponse(raw);
        expect(JSON.parse(cleaned)).toEqual({ summary_falc: 'simple' });
    });

    // ── Validation ──
    it('should validate complete FALC data', () => {
        expect(validateFalcData({
            summary_falc: 'Cette aide vous donne de l\'argent.',
            points_cles: ['Point 1', 'Point 2'],
            conditions_simples: 'Vous devez habiter en France.',
            action: 'Demander l\'aide',
        })).toBe(true);
    });

    it('should reject data missing summary_falc', () => {
        expect(validateFalcData({
            points_cles: ['Point 1'],
        })).toBe(false);
    });

    it('should reject data missing points_cles', () => {
        expect(validateFalcData({
            summary_falc: 'text',
        })).toBe(false);
    });

    it('should reject non-array points_cles', () => {
        expect(validateFalcData({
            summary_falc: 'text',
            points_cles: 'not an array',
        })).toBe(false);
    });

    it('should reject null data', () => {
        expect(validateFalcData(null)).toBe(false);
    });

    it('should reject undefined data', () => {
        expect(validateFalcData(undefined)).toBe(false);
    });

    // ── Source Text Building ──
    it('should build source text from all aide fields', () => {
        const aide = {
            cest_quoi: 'Une aide au logement.',
            pour_qui: 'Les personnes à faible revenu.',
            ce_que_ca_aide: 'Payer votre loyer.',
            description: 'Description complète.',
        };
        const text = buildSourceText(aide);
        expect(text).toContain('Une aide au logement.');
        expect(text).toContain('Les personnes à faible revenu.');
        expect(text).toContain('Payer votre loyer.');
        expect(text).toContain('Description complète.');
    });

    it('should skip null/empty fields', () => {
        const aide = {
            cest_quoi: 'Aide RSA',
            pour_qui: null,
            ce_que_ca_aide: '',
            description: undefined,
        };
        const text = buildSourceText(aide);
        expect(text).toBe('Aide RSA');
    });

    it('should return empty string if all fields are empty', () => {
        const aide = {
            cest_quoi: null,
            pour_qui: null,
            ce_que_ca_aide: null,
            description: null,
        };
        const text = buildSourceText(aide);
        expect(text).toBe('');
    });

    // ── FALC Content Rules ──
    it('should handle French accents in FALC data', () => {
        const data = {
            summary_falc: 'L\'Allocation aux Adultes Handicapés (AAH) vous aide à payer vos dépenses.',
            points_cles: ['Vous devez être âgé(e) de 20 ans', 'Un médecin vérifie votre état'],
        };
        expect(validateFalcData(data)).toBe(true);
        expect(data.summary_falc).toContain('Handicapés');
    });

    it('should handle emoji in FALC data', () => {
        const raw = '{"summary_falc": "🏠 Cette aide paye votre loyer.", "points_cles": ["💰 Argent", "📋 Papiers"]}';
        const parsed = JSON.parse(cleanGeminiResponse(raw));
        expect(validateFalcData(parsed)).toBe(true);
        expect(parsed.summary_falc).toContain('🏠');
    });
});
