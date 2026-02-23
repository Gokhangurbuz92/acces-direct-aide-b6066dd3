import { randomUUID } from 'crypto';
import * as Sentry from '@sentry/node';

import logger from '../../_utils/logger.js';
import { checkRateLimit, getClientIp, getRateLimitStatus } from '../../_utils/rateLimit.js';
import { chatWithRulePack } from '../../lib/gemini.js';

// --- Sensitive Data Patterns ---
// NIR (numéro de sécurité sociale) : 13 digits + 2-digit key
const NIR_RE = /\b[12]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{3}\s?\d{3}\s?\d{2}\b/;
// IBAN FR : FR + 2 check digits + 23 alphanumeric
const IBAN_FR_RE = /\bFR\s?\d{2}\s?[\dA-Z]{4}\s?[\dA-Z]{4}\s?[\dA-Z]{4}\s?[\dA-Z]{4}\s?[\dA-Z]{4}\s?[\dA-Z]{3}\b/i;
// Credit card : 16 consecutive digits (with optional spaces/dashes)
const CB_RE = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/;

const SENSITIVE_PATTERNS = [NIR_RE, IBAN_FR_RE, CB_RE];

const SENSITIVE_RESPONSE = {
    ok: false,
    error: 'sensitive_data_detected',
    message: 'Veuillez ne pas envoyer d\'informations sensibles (numéro de sécurité sociale, RIB, numéro de carte bancaire).',
};

/**
 * @param {string} text
 * @returns {boolean}
 */
function containsSensitiveData(text) {
    return SENSITIVE_PATTERNS.some((re) => re.test(text));
}

/**
 * @param {unknown} body
 * @returns {Record<string, unknown>}
 */
function parseBody(body) {
    if (!body) return {};
    if (typeof body === 'string') {
        try {
            return JSON.parse(body);
        } catch {
            return {};
        }
    }
    if (typeof body === 'object') return /** @type {Record<string, unknown>} */ (body);
    return {};
}

/**
 * Validate the optional context object.
 * Returns null if valid (or absent), or an error string.
 *
 * @param {unknown} ctx
 * @returns {string | null}
 */
function validateContext(ctx) {
    if (ctx === undefined || ctx === null) return null;
    if (typeof ctx !== 'object' || Array.isArray(ctx)) return 'context must be an object';

    const c = /** @type {Record<string, unknown>} */ (ctx);

    if (c.territory !== undefined && typeof c.territory !== 'string') return 'context.territory must be a string';
    if (c.lang !== undefined && c.lang !== 'fr' && c.lang !== 'en') return 'context.lang must be "fr" or "en"';
    if (c.page !== undefined && typeof c.page !== 'string') return 'context.page must be a string';
    if (c.wizard !== undefined && (typeof c.wizard !== 'object' || c.wizard === null)) return 'context.wizard must be an object';

    return null;
}

/**
 * POST /api/assistant/chat
 *
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */
export default async function handler(req, res) {
    const requestId = req.requestId || randomUUID();
    const log = logger.child({ handler: 'assistant-chat', requestId });

    // --- Method gate ---
    if (req.method !== 'POST') {
        return res.status(405).json({
            ok: false,
            requestId,
            error: 'method_not_allowed',
        });
    }

    // --- Rate limit ---
    const ip = getClientIp(req);
    const limit = await checkRateLimit('ASSISTANT_CHAT', ip);
    if (!limit.allowed) {
        return res.status(getRateLimitStatus(limit)).json({
            ...(limit.error || { error: 'rate_limited' }),
            requestId,
        });
    }

    // --- Parse & validate input ---
    const payload = parseBody(req.body);
    const { message, context } = payload;

    if (typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({
            ok: false,
            requestId,
            error: 'invalid_message',
            message: 'Le champ "message" est requis (1-800 caractères).',
        });
    }

    const trimmedMessage = message.trim();

    if (trimmedMessage.length > 800) {
        return res.status(400).json({
            ok: false,
            requestId,
            error: 'message_too_long',
            message: 'Le message ne peut pas dépasser 800 caractères.',
        });
    }

    const ctxError = validateContext(context);
    if (ctxError) {
        return res.status(400).json({
            ok: false,
            requestId,
            error: 'invalid_context',
            message: ctxError,
        });
    }

    // --- Sensitive data blocking ---
    if (containsSensitiveData(trimmedMessage)) {
        log.warn({ msg: 'assistant.sensitive_data_blocked', requestId });
        return res.status(400).json({ ...SENSITIVE_RESPONSE, requestId });
    }

    // --- Call Gemini via chatWithRulePack ---
    try {
        const answer = await chatWithRulePack(trimmedMessage);

        log.info({ msg: 'assistant.chat_success', requestId });

        return res.status(200).json({
            answer,
            citations: [],
            meta: {
                model: 'gemini-1.5-flash',
                rulepack: 'apl_v1',
                requestId,
            },
        });
    } catch (error) {
        const errorName = error instanceof Error ? error.name : 'unknown';
        const errorMsg = error instanceof Error ? error.message : String(error);
        log.error({ msg: 'assistant.chat_failed', errorName, requestId });

        Sentry.captureException(error, {
            tags: {
                route: 'assistant/chat',
                requestId,
            },
        });

        // Surface missing API key as 503 rather than generic 500
        if (errorMsg.includes('Missing required environment variable')) {
            return res.status(503).json({
                ok: false,
                requestId,
                error: 'service_unavailable',
                message: 'Le service assistant est temporairement indisponible.',
            });
        }

        return res.status(500).json({
            ok: false,
            requestId,
            error: 'internal',
            message: 'Une erreur interne est survenue.',
        });
    }
}
