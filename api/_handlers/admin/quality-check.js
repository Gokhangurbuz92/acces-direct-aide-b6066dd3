import prisma from '../../_utils/prisma.js';
import { verifyAdmin } from '../../_utils/auth.js';
import { validateForPublication } from '../../lib/quality-gate.js';

/**
 * GET /api/admin/quality-check?entityType=aide&id=xxx
 * Returns quality gate validation result for a single entity.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!verifyAdmin(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { entityType, id } = req.query;

  if (!entityType || !id) {
    return res.status(400).json({ error: 'Missing entityType or id' });
  }

  try {
    let entity = null;

    switch (entityType) {
      case 'aide':
        entity = await prisma.aide.findUnique({ where: { id } });
        break;
      case 'demarche':
        entity = await prisma.demarche.findUnique({ where: { id } });
        break;
      case 'structure':
        entity = await prisma.structure.findUnique({ where: { id } });
        break;
      default:
        return res.status(400).json({ error: 'Unknown entityType' });
    }

    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    const result = validateForPublication(entityType, entity);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Quality check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
