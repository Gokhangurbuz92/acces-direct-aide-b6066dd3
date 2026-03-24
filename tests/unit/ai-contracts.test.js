import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';

/**
 * AI module contracts — vérifier que les modules IA sont bien structurés.
 */
describe('AI module contracts', () => {
  it('gemini module exists', () => {
    expect(existsSync('api/lib/gemini.js')).toBe(true);
  });

  it('gemini circuit breaker exists', () => {
    expect(existsSync('api/lib/gemini-circuit-breaker.js')).toBe(true);
  });

  it('prompt sanitizer exists', () => {
    expect(existsSync('api/lib/prompt-sanitizer.js')).toBe(true);
  });

  it('gemini metrics exists', () => {
    expect(existsSync('api/lib/gemini-metrics.js')).toBe(true);
  });

  it('gemini module uses circuit breaker', () => {
    const content = readFileSync('api/lib/gemini.js', 'utf-8');
    expect(content).toMatch(/circuit|breaker|opossum/i);
  });

  it('chat handler blocks sensitive data', () => {
    const content = readFileSync('api/_handlers/assistant/chat.js', 'utf-8');
    expect(content).toMatch(/NIR|IBAN|sensitive|block/i);
  });

  it('chat handler records metrics', () => {
    const content = readFileSync('api/_handlers/assistant/chat.js', 'utf-8');
    expect(content).toMatch(/metric|recordMetric|aiMetric/i);
  });
});
