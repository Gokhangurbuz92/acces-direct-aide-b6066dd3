import logger from '../_utils/logger.js';
import { db } from '../../src/db/index.js';
import { checkRateLimit, getClientIp } from '../_utils/rateLimit.js';
import { hybridSearchSchema } from '../_utils/validators.js';
import { searchAidesHybrid } from '../lib/hybrid-search.js';
import { generateEmbedding } from '../lib/gemini-embedding.js';

/**
 * Universal search handler — searches Aides, Démarches, Structures, Actualités.
 * Returns results grouped by type.
 *
 * @param {import('../_utils/http-types').ApiRequest} req
 * @param {import('../_utils/http-types').ApiResponse} res
 */
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit('SEARCH_AIDES', ip);
    if (!rateLimit.allowed) {
      return res.status(429).json({ 
        error: "Trop de requêtes.",
        message: "Pour garantir l'accès à tous, veuillez patienter une minute."
      });
    }

    const validation = hybridSearchSchema.safeParse(req.body || {});
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid payload',
        details: validation.error.format(),
      });
    }

    const payload = validation.data;
    let embedding = null;

    try {
      embedding = await generateEmbedding(payload.query);
    } catch (embeddingError) {
      logger.warn('[search] embedding generation failed, continuing lexical-only', embeddingError.message);
    }

    // 1. Search Aides (existing hybrid search)
    const { items: aideItems, total: aideTotal, weakResult } = await searchAidesHybrid({
      query: payload.query,
      category: payload.category,
      situations: payload.situations,
      geoScope: payload.geoScope,
      limit: payload.limit,
      embedding,
    });

    // 2. Search Démarches (simple text search)
    const queryLike = `%${payload.query}%`;
    let demarches = [];
    try {
      demarches = await db.query.Demarche.findMany({
        where: (d, { or, ilike }) => or(
          ilike(d.titre, queryLike),
          ilike(d.description_courte, queryLike),
          ilike(d.contenu_detaille, queryLike)
        ),
        columns: {
          id: true,
          slug: true,
          titre: true,
          description_courte: true,
          categorie: true,
          summary_falc: true,
        },
        limit: 5,
      });
    } catch (e) {
      logger.warn('[search] demarches search failed:', e.message);
    }

    // 3. Search Structures (simple text search)
    let structures = [];
    try {
      structures = await db.query.Structure.findMany({
        where: (s, { or, ilike }) => or(
          ilike(s.nom, queryLike),
          ilike(s.description_courte, queryLike),
          ilike(s.ville, queryLike)
        ),
        columns: {
          id: true,
          slug: true,
          nom: true,
          description_courte: true,
          type_structure: true,
          ville: true,
          code_postal: true,
        },
        limit: 5,
      });
    } catch (e) {
      logger.warn('[search] structures search failed:', e.message);
    }

    // 4. Search Actualités (simple text search)
    let actualites = [];
    try {
      actualites = await db.query.Actualite.findMany({
        where: (a, { and, or, ilike, eq }) => and(
          eq(a.statut, 'publie'),
          or(
            ilike(a.titre, queryLike),
            ilike(a.resume, queryLike)
          )
        ),
        columns: {
          id: true,
          slug: true,
          titre: true,
          resume: true,
          categorie: true,
          date_publication: true,
          summary_falc: true,
        },
        limit: 5,
        orderBy: (a, { desc }) => [desc(a.date_publication)],
      });
    } catch (e) {
      logger.warn('[search] actualites search failed:', e.message);
    }

    const totalResults = aideTotal + demarches.length + structures.length + actualites.length;

    if (totalResults === 0 || (weakResult && demarches.length === 0 && structures.length === 0 && actualites.length === 0)) {
      return res.status(200).json({
        items: [],
        total: 0,
        demarches: [],
        structures: [],
        actualites: [],
        message: 'not found',
      });
    }

    return res.status(200).json({
      items: aideItems,
      total: aideTotal,
      demarches: demarches.map(d => ({
        id: d.id,
        slug: d.slug,
        title: d.titre,
        description: d.description_courte,
        category: d.categorie,
        type: 'demarche',
      })),
      structures: structures.map(s => ({
        id: s.id,
        slug: s.slug,
        title: s.nom,
        description: s.description_courte,
        category: s.type_structure,
        ville: s.ville,
        type: 'structure',
      })),
      actualites: actualites.map(a => ({
        id: a.id,
        slug: a.slug,
        title: a.titre,
        description: a.resume,
        category: a.categorie,
        date: a.date_publication,
        type: 'actualite',
      })),
      message: null,
    });
  } catch (error) {
    logger.error('Search handler error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}
