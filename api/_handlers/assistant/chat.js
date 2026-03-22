import logger from '../../_utils/logger.js';
import { randomUUID } from 'crypto';
import * as Sentry from '@sentry/node';

import { checkRateLimit, getClientIp, getRateLimitStatus } from '../../_utils/rateLimit.js';
import { chatWithRulePack } from '../../lib/gemini.js';
import { recordMetric } from '../../lib/gemini-metrics.js';
import { storeLog } from '../../lib/log-store.js';
import { db } from '../../../src/db/index.js';
import { ConversationLog } from '../../../src/db/schema.js';

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
        return res.status(429).json({ 
            error: "Trop de requêtes.",
            message: "Pour garantir l'accès à tous, veuillez patienter une minute."
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

    // --- Early check: Gemini API key availability ---
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!geminiKey) {
        // 🧪 MOCK MODE — testable AI in local dev without API keys (Audit Item 7)
        if (process.env.NODE_ENV === 'development') {
            log.info({ msg: 'assistant.mock_mode', requestId });

            const MOCK_RESPONSES = [
                {
                    answer: `Voici ce que je peux vous dire sur votre demande :\n\n**D'après les informations disponibles**, plusieurs aides pourraient correspondre à votre situation. Je vous recommande de consulter [service-public.fr](https://www.service-public.fr) pour vérifier vos droits.\n\n*[Mode démo — en production, l'IA Gemini fournira une réponse personnalisée]*`,
                    intent: 'aide_info',
                },
                {
                    answer: `Bonne question ! Voici les étapes principales :\n\n1. **Vérifiez votre éligibilité** sur le site officiel de la CAF\n2. **Rassemblez les pièces justificatives** (avis d'imposition, justificatif de domicile)\n3. **Faites votre demande en ligne** sur [caf.fr](https://www.caf.fr)\n\nLe traitement prend généralement 2 à 4 semaines.\n\n*[Mode démo — réponse simulée]*`,
                    intent: 'demarche_howto',
                },
            ];
            const mock = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];

            return res.status(200).json({
                answer: mock.answer,
                citations: [],
                logId: null,
                verified: false,
                mock: true,
                meta: {
                    model: 'mock-dev',
                    rulepack: mock.intent,
                    searchMode: 'mock',
                    sourceCount: 0,
                    requestId,
                },
            });
        }

        log.warn({ msg: 'assistant.api_key_missing', requestId });
        return res.status(503).json({
            ok: false,
            requestId,
            error: 'service_unavailable',
            message: 'Le service assistant est temporairement indisponible.',
        });
    }

    // --- Call Gemini via chatWithRulePack ---
    try {
        const { answer, meta } = await chatWithRulePack(trimmedMessage);

        // --- OUTPUT SAFETY FILTER (SEC-04) ---
        // Check if the response references official French government sources.
        // If not, append a disclaimer to protect users from unverified advice.
        const OFFICIAL_DOMAINS = [
            'service-public.fr',
            '.gouv.fr',
            'caf.fr',
            'ameli.fr',
            'msa.fr',
            'pole-emploi.fr',
            'francetravail.fr',
            'legifrance.gouv.fr',
        ];
        const answerLower = (answer || '').toLowerCase();
        const hasOfficialSource = OFFICIAL_DOMAINS.some(domain => answerLower.includes(domain));
        const DISCLAIMER = '\n\n⚠️ *Cette réponse n\'a pas pu être vérifiée contre une source officielle. ' +
            'Consultez [service-public.fr](https://www.service-public.fr) pour confirmer vos droits.*';
        const filteredAnswer = hasOfficialSource ? answer : (answer + DISCLAIMER);

        // --- Log the conversation (await to get logId for feedback) ---
        let logId = null;
        try {
            const [logEntry] = await db.insert(ConversationLog).values({
                message: trimmedMessage.slice(0, 500),
                intent: meta.intent || null,
                searchMode: meta.searchMode,
                sourceCount: meta.sourceCount,
            }).returning();
            logId = logEntry.id;
        } catch (logErr) {
            log.warn({ msg: 'assistant.log_write_failed', error: logErr.message, requestId });
        }

        log.info({ msg: 'assistant.chat_success', searchMode: meta.searchMode, sourceCount: meta.sourceCount, hasOfficialSource, requestId });

        return res.status(200).json({
            answer: filteredAnswer,
            citations: [],
            logId,
            verified: hasOfficialSource,
            meta: {
                model: 'gemini-2.0-flash',
                rulepack: meta.intent || 'apl_v1',
                searchMode: meta.searchMode,
                sourceCount: meta.sourceCount,
                requestId,
            },
        });
    } catch (error) {
        const errorName = error instanceof Error ? error.name : 'unknown';
        const errorMsg = error instanceof Error ? error.message : String(error);
        log.error({ msg: 'assistant.chat_failed', errorName, errorMsg, requestId });
        storeLog('error', 'Chat failed', { error: errorMsg, requestId }).catch(() => {});

        Sentry.captureException(error, {
            tags: {
                route: 'assistant/chat',
                requestId,
            },
        });

        // Classify Gemini / Google AI errors as 503 (service unavailable)
        // This includes: missing key, invalid key, quota exceeded, model errors, API failures.
        const isGeminiError =
            errorMsg.includes('Missing required environment variable') ||
            errorMsg.includes('API_KEY') ||
            errorMsg.includes('GoogleGenerativeAI') ||
            errorMsg.includes('PERMISSION_DENIED') ||
            errorMsg.includes('RESOURCE_EXHAUSTED') ||
            errorMsg.includes('quota') ||
            errorMsg.includes('models/') ||
            errorName === 'GoogleGenerativeAIError' ||
            errorName === 'GoogleGenerativeAIFetchError' ||
            errorName === 'GoogleGenerativeAIRequestInputError' ||
            errorName === 'GoogleGenerativeAIResponseError';

        if (isGeminiError) {
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
