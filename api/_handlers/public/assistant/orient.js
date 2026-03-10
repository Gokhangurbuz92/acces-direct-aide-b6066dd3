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
 * Phase 3 — Intelligence Souveraine
 * Performs territorial RAG search via PostgreSQL Full-Text Search (GIN),
 * then sends contextual data to Gemini 2.0 Flash with the "Boussole Sociale" system prompt.
 * Returns answer + smart links + follow-up suggestions.
 */

const GEMINI_MODEL = 'gemini-2.0-flash';

// ── Sensitive Data Patterns ──
const NIR_RE = /\b[12]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{3}\s?\d{3}\s?\d{2}\b/;
const IBAN_FR_RE = /\bFR\s?\d{2}\s?[\dA-Z]{4}\s?[\dA-Z]{4}\s?[\dA-Z]{4}\s?[\dA-Z]{4}\s?[\dA-Z]{4}\s?[\dA-Z]{3}\b/i;
const CB_RE = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/;
const SENSITIVE_PATTERNS = [NIR_RE, IBAN_FR_RE, CB_RE];

/** @param {string} text */
function containsSensitiveData(text) {
    return SENSITIVE_PATTERNS.some((re) => re.test(text));
}

/** @param {string} message */
export function extractKeywords(message) {
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
export function detectTerritory(message) {
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

/**
 * Build a PostgreSQL tsquery string from keywords.
 * Uses '|' (OR) operator for broad matching with French stemming.
 * @param {string[]} keywords
 * @returns {string}
 */
export function buildTsQuery(keywords) {
    if (!keywords || keywords.length === 0) return '';
    return keywords
        .map((k) => k.replace(/[^\w\u00C0-\u024F]/g, '')) // Strip non-alphanumeric
        .filter((k) => k.length > 0)
        .join(' | ');
}

const BOUSSOLE_SYSTEM_PROMPT = `Tu es la "Boussole Sociale" d'AccesDirectAide.
Ton rôle : Orienter avec empathie les citoyens français vers les bons droits et démarches.

RÈGLES CRITIQUES :
1. Utilise UNIQUEMENT les informations des Aides, Structures et Démarches fournies dans le contexte ci-dessous.
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
 * FTS search for Aides via $queryRaw with ts_rank ranking.
 * Falls back to Prisma contains if FTS fails (e.g. missing index).
 */
async function searchAidesFTS(keywords, territory, limit = 5) {
    const tsQuery = buildTsQuery(keywords);
    if (!tsQuery) {
        // No keywords — return recent published aides (optionally filtered by territory)
        return prisma.aide.findMany({
            where: {
                statut: 'publie',
                ...(territory ? { departements: { has: territory } } : {}),
            },
            select: { id: true, titre: true, slug: true, cest_quoi: true, categorie: true, summary_falc: true },
            take: limit,
            orderBy: { published_at: 'desc' },
        });
    }

    try {
        const aides = await prisma.$queryRaw`
            SELECT id, titre, slug, cest_quoi, categorie, summary_falc,
                   ts_rank(to_tsvector('french', coalesce(titre,'') || ' ' || coalesce(cest_quoi,'')),
                           to_tsquery('french', ${tsQuery})) AS rank
            FROM "Aide"
            WHERE to_tsvector('french', coalesce(titre,'') || ' ' || coalesce(cest_quoi,''))
                  @@ to_tsquery('french', ${tsQuery})
            ${territory ? prisma.$queryRaw`AND ${territory} = ANY("departements")` : prisma.$queryRaw``}
            ORDER BY rank DESC
            LIMIT ${limit}
        `;
        return aides;
    } catch (ftsErr) {
        // Fallback to Prisma contains (if GIN index not yet deployed)
        logger.warn({ msg: 'compass.fts_fallback', error: ftsErr.message });
        return prisma.aide.findMany({
            where: {
                OR: keywords.map((k) => ({ titre: { contains: k, mode: 'insensitive' } })),
                ...(territory ? { departements: { has: territory } } : {}),
            },
            select: { id: true, titre: true, slug: true, cest_quoi: true, categorie: true, summary_falc: true },
            take: limit,
        });
    }
}

/**
 * FTS search for Structures via $queryRaw with territorial filter.
 */
async function searchStructuresFTS(keywords, territory, limit = 3) {
    const tsQuery = buildTsQuery(keywords);

    // If we have territory but no keywords, just filter by territory
    if (!tsQuery && territory) {
        return prisma.structure.findMany({
            where: { departement: territory, status: 'actif' },
            select: { id: true, nom: true, slug: true, type_structure: true, departement: true, ville: true, telephone: true },
            take: limit,
        });
    }
    if (!tsQuery) {
        return prisma.structure.findMany({
            where: { status: 'actif' },
            select: { id: true, nom: true, slug: true, type_structure: true, departement: true, ville: true, telephone: true },
            take: limit,
        });
    }

    try {
        const structures = await prisma.$queryRaw`
            SELECT id, nom, slug, type_structure, departement, ville, telephone,
                   ts_rank(to_tsvector('french', coalesce(nom,'') || ' ' || coalesce(ville,'')),
                           to_tsquery('french', ${tsQuery})) AS rank
            FROM "Structure"
            WHERE to_tsvector('french', coalesce(nom,'') || ' ' || coalesce(ville,''))
                  @@ to_tsquery('french', ${tsQuery})
            ${territory ? prisma.$queryRaw`AND departement = ${territory}` : prisma.$queryRaw``}
            AND status = 'actif'
            ORDER BY rank DESC
            LIMIT ${limit}
        `;
        return structures;
    } catch (ftsErr) {
        logger.warn({ msg: 'compass.fts_structures_fallback', error: ftsErr.message });
        return prisma.structure.findMany({
            where: {
                ...(keywords.length > 0 ? { OR: keywords.map((k) => ({ nom: { contains: k, mode: 'insensitive' } })) } : {}),
                ...(territory ? { departement: territory } : {}),
                status: 'actif',
            },
            select: { id: true, nom: true, slug: true, type_structure: true, departement: true, ville: true, telephone: true },
            take: limit,
        });
    }
}

/**
 * FTS search for Démarches (new in Phase 3).
 */
async function searchDemarchesFTS(keywords, limit = 3) {
    const tsQuery = buildTsQuery(keywords);
    if (!tsQuery) return [];

    try {
        const demarches = await prisma.$queryRaw`
            SELECT id, titre, slug, description_courte, summary_falc,
                   ts_rank(to_tsvector('french', coalesce(titre,'') || ' ' || coalesce(description_courte,'')),
                           to_tsquery('french', ${tsQuery})) AS rank
            FROM "Demarche"
            WHERE to_tsvector('french', coalesce(titre,'') || ' ' || coalesce(description_courte,''))
                  @@ to_tsquery('french', ${tsQuery})
            ORDER BY rank DESC
            LIMIT ${limit}
        `;
        return demarches;
    } catch (ftsErr) {
        logger.warn({ msg: 'compass.fts_demarches_fallback', error: ftsErr.message });
        return prisma.demarche.findMany({
            where: { OR: keywords.map((k) => ({ titre: { contains: k, mode: 'insensitive' } })) },
            select: { id: true, titre: true, slug: true, description_courte: true, summary_falc: true },
            take: limit,
        });
    }
}

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

        // ── 2. RAG: FTS Search Aides + Structures + Démarches ──
        const [aides, structures, demarches] = await Promise.all([
            searchAidesFTS(keywords, territory),
            searchStructuresFTS(keywords, territory),
            searchDemarchesFTS(keywords),
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

        const demarchesContext = demarches.length > 0
            ? `\n\nDÉMARCHES ADMINISTRATIVES (${demarches.length}) :\n` + demarches.map((d) =>
                `- "${d.titre}" (slug: ${d.slug || d.id})${d.summary_falc ? ` — ${d.summary_falc.slice(0, 150)}` : d.description_courte ? ` — ${d.description_courte.slice(0, 150)}` : ''}`
            ).join('\n')
            : '';

        const territoryContext = territory
            ? `\n\nTERRITOIRE ACTIF : département ${territory}${detected?.ville ? `, ville: ${detected.ville}` : ''}`
            : '';

        const fullPrompt = `${BOUSSOLE_SYSTEM_PROMPT}${aidesContext}${structuresContext}${demarchesContext}${territoryContext}\n\nQuestion du citoyen : ${trimmed}`;

        // ── 4. Generate answer with Gemini 2.5 Flash ──
        let data;
        try {
            const raw = await generateText(fullPrompt, { temperature: 0.3, model: GEMINI_MODEL });
            const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
            data = JSON.parse(cleaned);
        } catch {
            // Fallback: Build structured response from RAG results
            const allSources = [...aides.map((a) => `• "${a.titre}"`), ...demarches.map((d) => `• "${d.titre}"`)];
            data = {
                answer: allSources.length > 0
                    ? `Je rencontre une difficulté technique, mais voici ce que j'ai trouvé pour vous :\n\n${allSources.join('\n')}\n\nConsultez les fiches pour plus de détails.`
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

        // Add démarche links (Phase 3)
        if (demarches.length > 0) {
            const demarcheLinks = demarches.slice(0, 2).map((d) => ({
                title: d.titre,
                url: d.slug ? `/demarches/${d.slug}` : `/demarches/view?id=${d.id}`,
                type: 'demarche',
            }));
            data.links = [...(data.links || []), ...demarcheLinks];
        }

        const totalSources = aides.length + structures.length + demarches.length;

        // ── 5. Log conversation with enriched metadata ──
        try {
            await prisma.conversationLog.create({
                data: {
                    message: trimmed.slice(0, 500),
                    intent: territory ? `compass:${territory}` : 'compass',
                    searchMode: 'compass',
                    sourceCount: totalSources,
                    sessionId: sessionId || null,
                    metadata: {
                        links_count: (data.links || []).length,
                        territory: territory || 'national',
                        keywords: keywords.slice(0, 10),
                        model: GEMINI_MODEL,
                        aides_count: aides.length,
                        structures_count: structures.length,
                        demarches_count: demarches.length,
                    },
                },
            });
        } catch (logErr) {
            log.warn({ msg: 'compass.log_write_failed', error: logErr.message, requestId });
        }

        log.info({
            msg: 'compass.orient_success',
            territory,
            aidesCount: aides.length,
            structuresCount: structures.length,
            demarchesCount: demarches.length,
            model: GEMINI_MODEL,
            requestId,
        });

        return res.status(200).json({
            ...data,
            meta: {
                model: GEMINI_MODEL,
                mode: 'compass',
                territory: territory || 'national',
                sourceCount: totalSources,
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
