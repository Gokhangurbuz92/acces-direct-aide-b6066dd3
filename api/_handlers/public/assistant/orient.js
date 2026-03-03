import logger from '../../../_utils/logger.js';
import { randomUUID } from 'crypto';
import * as Sentry from '@sentry/node';
import { checkRateLimit, getClientIp, getRateLimitStatus } from '../../../_utils/rateLimit.js';
import { generateText } from '../../../lib/gemini.js';
import prisma from '../../../_utils/prisma.js';

/**
 * orient.js — Boussole Sociale (Compass Orientation Handler)
 *
 * POST /api/public/assistant/orient
 *
 * Performs territorial RAG search across Aides + Structures,
 * then sends contextual data to Gemini with the "Boussole Sociale" system prompt.
 * Returns answer + smart links + follow-up suggestions.
 */

// ── Sensitive Data Patterns (reused from assistant/chat) ──
const NIR_RE = /\b[12]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{3}\s?\d{3}\s?\d{2}\b/;
const IBAN_FR_RE = /\bFR\s?\d{2}\s?[\dA-Z]{4}\s?[\dA-Z]{4}\s?[\dA-Z]{4}\s?[\dA-Z]{4}\s?[\dA-Z]{4}\s?[\dA-Z]{3}\b/i;
const CB_RE = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/;
const SENSITIVE_PATTERNS = [NIR_RE, IBAN_FR_RE, CB_RE];

/** @param {string} text */
function containsSensitiveData(text) {
    return SENSITIVE_PATTERNS.some((re) => re.test(text));
}

/** @param {string} message */
function extractKeywords(message) {
    const stopwords = new Set([
        'je', 'suis', 'une', 'les', 'des', 'pour', 'dans', 'mon', 'mes', 'moi',
        'qui', 'que', 'quoi', 'est', 'sont', 'avec', 'par', 'sur', 'pas', 'plus',
        'tout', 'tous', 'quel', 'très', 'bien', 'fait', 'être', 'avoir', 'faire',
        'cette', 'chez', 'comment', 'aide', 'aider', 'besoin', 'cherche', 'trouver',
        'puis', 'aussi', 'mais', 'donc', 'car', 'comme', 'elle', 'nous', 'vous',
    ]);
    return message
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 2 && !stopwords.has(w));
}

/** @param {string} message */
function detectTerritory(message) {
    // Match 5-digit postal code
    const cp = message.match(/\b(\d{5})\b/);
    if (cp) return { code_postal: cp[1], departement: cp[1].slice(0, 2) };

    // Match 2-digit departement
    const dep = message.match(/\bdépartement\s*(\d{2})\b/i) || message.match(/\b(\d{2})\b/);
    if (dep && Number(dep[1]) >= 1 && Number(dep[1]) <= 95) return { departement: dep[1] };

    // Match known city names
    const cityMap = {
        strasbourg: '67', mulhouse: '68', colmar: '68', paris: '75',
        lyon: '69', marseille: '13', toulouse: '31', bordeaux: '33',
        lille: '59', nantes: '44', nice: '06', montpellier: '34',
        rennes: '35', grenoble: '38', dijon: '21', metz: '57',
    };
    const lower = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (const [city, dept] of Object.entries(cityMap)) {
        if (lower.includes(city)) return { departement: dept, ville: city };
    }
    return null;
}

const BOUSSOLE_SYSTEM_PROMPT = `Tu es la "Boussole Sociale" d'AccesDirectAide.
Ton rôle : Orienter avec empathie les citoyens français vers les bons droits et démarches.

RÈGLES CRITIQUES :
1. Utilise UNIQUEMENT les informations des Aides et Structures fournies dans le contexte ci-dessous.
2. Réponds en langage simple accessible (FALC — Facile À Lire et à Comprendre).
3. Sois chaleureux, encourageant et bienveillant. Évite le jargon administratif.
4. Si des structures locales sont disponibles dans le contexte, mentionne-les en priorité.
5. Ne fabrique JAMAIS d'informations. Si tu ne sais pas, dis-le honnêtement.
6. Propose toujours 2-3 questions de suivi pour guider la conversation.

FORMAT DE RÉPONSE (JSON STRICT) :
{
  "answer": "Ta réponse empathique et claire...",
  "suggestions": ["Question suivante 1", "Question suivante 2", "Question suivante 3"],
  "links": [
    { "title": "Nom de l'aide ou structure", "url": "/aides/slug-de-l-aide", "type": "aide" }
  ]
}

IMPORTANT : Retourne UNIQUEMENT du JSON valide, sans commentaires ni backticks.`;

/**
 * @param {import('../../../_utils/http-types').ApiRequest} req
 * @param {import('../../../_utils/http-types').ApiResponse} res
 */
export default async function handler(req, res) {
    const requestId = req.requestId || randomUUID();
    const log = logger.child({ handler: 'compass-orient', requestId });

    if (req.method !== 'POST') {
        return res.status(405).json({ ok: false, requestId, error: 'method_not_allowed' });
    }

    // ── Rate limit ──
    const ip = getClientIp(req);
    const limit = await checkRateLimit('ASSISTANT_CHAT', ip);
    if (!limit.allowed) {
        return res.status(getRateLimitStatus(limit)).json({
            ...(limit.error || { error: 'rate_limited' }),
            requestId,
        });
    }

    // ── Parse + validate ──
    const body = typeof req.body === 'string' ? (() => { try { return JSON.parse(req.body); } catch { return {}; } })() : (req.body || {});
    const { message, territory: inputTerritory, sessionId } = body;

    if (typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({
            ok: false, requestId,
            error: 'invalid_message',
            message: 'Le champ "message" est requis.',
        });
    }

    const trimmed = message.trim();
    if (trimmed.length > 800) {
        return res.status(400).json({
            ok: false, requestId,
            error: 'message_too_long',
            message: 'Le message ne peut pas dépasser 800 caractères.',
        });
    }

    if (containsSensitiveData(trimmed)) {
        log.warn({ msg: 'compass.sensitive_data_blocked', requestId });
        return res.status(400).json({
            ok: false, requestId,
            error: 'sensitive_data_detected',
            message: 'Veuillez ne pas envoyer d\'informations sensibles.',
        });
    }

    // ── Gemini API key check ──
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!geminiKey) {
        log.warn({ msg: 'compass.api_key_missing', requestId });
        return res.status(503).json({
            ok: false, requestId,
            error: 'service_unavailable',
            message: 'Le service Boussole est temporairement indisponible.',
        });
    }

    try {
        // ── 1. Extract keywords + detect territory ──
        const keywords = extractKeywords(trimmed);
        const detected = detectTerritory(trimmed);
        const territory = inputTerritory || detected?.departement || null;

        // ── 2. RAG: Search Aides + Structures in Prisma ──
        const aidesWhere = keywords.length > 0
            ? { OR: keywords.map((k) => ({ titre: { contains: k, mode: 'insensitive' } })) }
            : {};

        const structuresWhere = {
            ...(keywords.length > 0 ? { OR: keywords.map((k) => ({ nom: { contains: k, mode: 'insensitive' } })) } : {}),
            ...(territory ? { departement: territory } : {}),
        };

        const [aides, structures] = await Promise.all([
            prisma.aide.findMany({
                where: aidesWhere,
                select: { id: true, titre: true, slug: true, cest_quoi: true, categorie: true, summary_falc: true },
                take: 5,
            }),
            prisma.structure.findMany({
                where: Object.keys(structuresWhere).length > 0 ? structuresWhere : { status: 'actif' },
                select: { id: true, nom: true, slug: true, type_structure: true, departement: true, ville: true, telephone: true },
                take: 3,
            }),
        ]);

        // ── 3. Build RAG context for Gemini prompt ──
        const aidesContext = aides.length > 0
            ? `\n\nAIDES TROUVÉES (${aides.length}) :\n` + aides.map((a) =>
                `- "${a.titre}" (slug: ${a.slug || a.id})${a.summary_falc ? ` — ${a.summary_falc.slice(0, 150)}` : a.cest_quoi ? ` — ${a.cest_quoi.slice(0, 150)}` : ''}`
            ).join('\n')
            : '';

        const structuresContext = structures.length > 0
            ? `\n\nSTRUCTURES LOCALES (${structures.length}) :\n` + structures.map((s) =>
                `- "${s.nom}" (type: ${s.type_structure || 'N/A'}, ${s.ville || ''} ${s.departement || ''})${s.telephone ? ` — Tél: ${s.telephone}` : ''}`
            ).join('\n')
            : '';

        const territoryContext = territory
            ? `\n\nTERRITOIRE ACTIF : département ${territory}${detected?.ville ? `, ville: ${detected.ville}` : ''}`
            : '';

        const fullPrompt = `${BOUSSOLE_SYSTEM_PROMPT}${aidesContext}${structuresContext}${territoryContext}\n\nQuestion du citoyen : ${trimmed}`;

        // ── 4. Generate answer with Gemini ──
        let data;
        try {
            const raw = await generateText(fullPrompt, { temperature: 0.3 });
            const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
            data = JSON.parse(cleaned);
        } catch {
            // Fallback: Build structured response from RAG results
            data = {
                answer: aides.length > 0
                    ? `Je rencontre une difficulté technique, mais voici ce que j'ai trouvé pour vous :\n\n${aides.map((a) => `• "${a.titre}"`).join('\n')}\n\nConsultez les fiches pour plus de détails.`
                    : 'Je rencontre une difficulté technique. Pouvez-vous reformuler votre question ?',
                suggestions: ['Quelles sont les aides au logement ?', 'Où trouver un travailleur social ?', 'Comment faire une demande RSA ?'],
                links: aides.slice(0, 3).map((a) => ({
                    title: a.titre,
                    url: a.slug ? `/aides/${a.slug}` : `/aides/view?id=${a.id}`,
                    type: 'aide',
                })),
            };
        }

        // Enrich links from RAG if Gemini didn't provide them
        if ((!data.links || data.links.length === 0) && aides.length > 0) {
            data.links = aides.slice(0, 3).map((a) => ({
                title: a.titre,
                url: a.slug ? `/aides/${a.slug}` : `/aides/view?id=${a.id}`,
                type: 'aide',
            }));
        }

        // Add structure links
        if (structures.length > 0) {
            const structLinks = structures.slice(0, 2).map((s) => ({
                title: s.nom,
                url: s.slug ? `/structures/${s.slug}` : `/annuaire?q=${encodeURIComponent(s.nom)}`,
                type: 'structure',
            }));
            data.links = [...(data.links || []), ...structLinks];
        }

        // ── 5. Log conversation ──
        try {
            await prisma.conversationLog.create({
                data: {
                    message: trimmed.slice(0, 500),
                    intent: territory ? `compass:${territory}` : 'compass',
                    searchMode: 'compass',
                    sourceCount: aides.length + structures.length,
                    sessionId: sessionId || null,
                },
            });
        } catch (logErr) {
            log.warn({ msg: 'compass.log_write_failed', error: logErr.message, requestId });
        }

        log.info({ msg: 'compass.orient_success', territory, aidesCount: aides.length, structuresCount: structures.length, requestId });

        return res.status(200).json({
            ...data,
            meta: {
                model: 'gemini-2.0-flash',
                mode: 'compass',
                territory: territory || 'national',
                sourceCount: aides.length + structures.length,
                requestId,
            },
        });
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        log.error({ msg: 'compass.orient_failed', error: errorMsg, requestId });
        Sentry.captureException(error, { tags: { route: 'public/assistant/orient', requestId } });

        return res.status(500).json({
            answer: 'Je rencontre une difficulté technique, mais je reste à votre écoute. Pouvez-vous reformuler votre question ?',
            suggestions: ['Quelles sont les aides au logement ?', 'Où trouver une assistante sociale ?', 'Comment faire une demande de RSA ?'],
            links: [],
            meta: { model: 'fallback', mode: 'compass', requestId },
        });
    }
}
