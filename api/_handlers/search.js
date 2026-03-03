import logger from '../_utils/logger.js';
import prisma from '../_utils/prisma.js';
import { checkRateLimit, getClientIp } from '../_utils/rateLimit.js';
import { hybridSearchSchema } from '../_utils/validators.js';
import { searchAidesHybrid } from '../lib/hybrid-search.js';
import { generateEmbedding } from '../lib/gemini-embedding.js';
/**
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
      return res.status(rateLimit.status || 429).json(rateLimit.error);
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

    const { items, total, weakResult } = await searchAidesHybrid(prisma, {
      query: payload.query,
      category: payload.category,
      situations: payload.situations,
      geoScope: payload.geoScope,
      limit: payload.limit,
      embedding,
    });

    if (total === 0 || weakResult) {
      return res.status(200).json({
        items: [],
        total: 0,
        message: 'not found',
      });
    }

    return res.status(200).json({
      items,
      total,
      message: null,
    });
  } catch (error) {
    logger.error('Search handler error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}
