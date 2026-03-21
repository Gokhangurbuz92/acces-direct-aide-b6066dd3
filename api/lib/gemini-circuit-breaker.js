import CircuitBreaker from 'opossum';
import { logger } from './logger.js';

/**
 * Gemini Circuit Breaker
 *
 * Protects Gemini API calls from cascading failures.
 * When error rate exceeds 50% over 5+ calls, the circuit opens
 * and returns a fallback response for 60 seconds.
 */

const DEFAULT_OPTIONS = {
    timeout: 30_000,                // 30s per call
    errorThresholdPercentage: 50,   // open at 50% errors
    resetTimeout: 60_000,           // retry after 60s
    volumeThreshold: 5,             // minimum 5 calls before calculating
    rollingCountTimeout: 60_000,    // 60s rolling window
};

const FALLBACK_RESPONSE = {
    fallback: true,
    message: 'Service IA temporairement indisponible. Veuillez réessayer dans quelques instants.',
};

/**
 * Create a circuit breaker wrapping a Gemini call function.
 *
 * @param {Function} fn - Async function that calls Gemini (e.g. `(prompt) => model.generateContent(prompt)`)
 * @param {Partial<import('opossum').Options>} [options] - Override default options
 * @returns {CircuitBreaker}
 */
export function createGeminiBreaker(fn, options = {}) {
    const breaker = new CircuitBreaker(fn, { ...DEFAULT_OPTIONS, ...options });

    breaker.on('open', () => {
        logger.warn('[CIRCUIT-BREAKER] Gemini circuit OPEN — fallback actif');
    });

    breaker.on('halfOpen', () => {
        logger.info('[CIRCUIT-BREAKER] Gemini circuit HALF-OPEN — test en cours');
    });

    breaker.on('close', () => {
        logger.info('[CIRCUIT-BREAKER] Gemini circuit CLOSED — fonctionnement normal');
    });

    breaker.fallback(() => FALLBACK_RESPONSE);

    return breaker;
}

/**
 * Singleton breaker for the main chatbot (gemini.js).
 * Shared across requests to maintain circuit state.
 */
let _chatBreaker = null;

/**
 * Get or create the singleton chat circuit breaker.
 *
 * @param {Function} fn - Async function wrapping model.generateContent
 * @returns {CircuitBreaker}
 */
export function getChatBreaker(fn) {
    if (!_chatBreaker) {
        _chatBreaker = createGeminiBreaker(fn);
    }
    return _chatBreaker;
}

export { FALLBACK_RESPONSE };
