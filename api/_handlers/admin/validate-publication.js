import prisma from '../../_utils/prisma.js';
import { validateForPublication, generateValidationReport } from '../../lib/publication-validator.js';
import logger from '../../_utils/logger.js';
import Sentry from '../../_utils/sentry.js';
import { env } from '../../_utils/env.js';

const ENTITY_MODELS = {
  aide: prisma.aide,
  demarche: prisma.demarche,
  structure: prisma.structure,
  actualite: prisma.actualite,
};

/**
 * POST /api/admin/validate-publication
 *
 * Validates if content can be published
 *
 * Body:
 * {
 *   entityType: 'aide' | 'demarche' | 'structure' | 'actualite',
 *   entityId: string
 * }
 *
 * Returns validation result with errors and warnings
 */
/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */
export default async function handler(req, res) {
  const log = logger.child({ handler: 'validate-publication' });

  try {
    // Check authentication
    if (!req.user || req.user.role !== 'admin') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { entityType, entityId } = req.body || {};

    // Validation
    if (!entityType || !ENTITY_MODELS[entityType]) {
      return res.status(400).json({
        error: 'Invalid entity type',
        validTypes: Object.keys(ENTITY_MODELS),
      });
    }

    if (!entityId) {
      return res.status(400).json({ error: 'Entity ID is required' });
    }

    // Fetch the entity
    const model = ENTITY_MODELS[entityType];
    const entity = await model.findUnique({
      where: { id: entityId },
    });

    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    // Run validation
    const validationResult = validateForPublication(entity, entityType);
    const report = generateValidationReport(validationResult);

    log.info({
      msg: 'Publication validation performed',
      entityType,
      entityId,
      canPublish: validationResult.canPublish,
      errorCount: validationResult.errors.length,
      warningCount: validationResult.warnings.length,
    });

    return res.status(200).json({
      canPublish: validationResult.canPublish,
      errors: validationResult.errors,
      warnings: validationResult.warnings,
      report,
    });
  } catch (error) {
    log.error({
      msg: 'Validation error',
      error: error.message,
      stack: error.stack,
    });
    Sentry.captureException(error);

    return res.status(500).json({
      error: 'Internal server error',
      message: env.runtime.nodeEnv === 'production' ? 'An error occurred' : error.message,
    });
  }
}
