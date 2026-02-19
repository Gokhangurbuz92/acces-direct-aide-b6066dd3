import prisma from '../../_utils/prisma.js';
import { requireProAuth, requireProStructureContext } from '../../_utils/auth.js';

/**
 * @param {unknown} value
 * @returns {Date | null}
 */
function toDate(value) {
  if (!value) return null;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * @param {any} item
 */
function serialize(item) {
  return {
    id: item.id,
    structureId: item.structureId,
    startAt: item.startAt,
    endAt: item.endAt,
    reason: item.reason || null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

/**
 * @param {Date | null} startAt
 * @param {Date | null} endAt
 * @returns {string | null}
 */
function validateRange(startAt, endAt) {
  if (!startAt) return 'startAt is required';
  if (!endAt) return 'endAt is required';
  if (endAt <= startAt) return 'endAt must be greater than startAt';
  return null;
}

/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */
async function handler(req, res) {
  const proCtx = requireProStructureContext(req, res);
  if (!proCtx) return;

  if (req.method === 'GET') {
    const from = toDate(req.query.from);
    const to = toDate(req.query.to);

    /** @type {Record<string, any>} */
    const where = { structureId: proCtx.structureId };
    if (from || to) {
      where.startAt = {
        ...(from ? { lt: to || new Date('2999-01-01T00:00:00.000Z') } : {}),
      };
      where.endAt = {
        ...(to ? { gt: from || new Date('1970-01-01T00:00:00.000Z') } : {}),
      };
    }

    const items = await prisma.proTimeOff.findMany({
      where,
      orderBy: [{ startAt: 'asc' }, { createdAt: 'asc' }],
    });

    return res.status(200).json({ items: items.map(serialize), total: items.length });
  }

  if (req.method === 'POST') {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const startAt = toDate(body.startAt);
    const endAt = toDate(body.endAt);
    const reason = typeof body.reason === 'string' ? body.reason.trim() : null;

    const rangeError = validateRange(startAt, endAt);
    if (rangeError) return res.status(400).json({ error: rangeError });

    const created = await prisma.proTimeOff.create({
      data: {
        structureId: proCtx.structureId,
        startAt: /** @type {Date} */ (startAt),
        endAt: /** @type {Date} */ (endAt),
        reason: reason || null,
      },
    });

    return res.status(201).json({ ok: true, item: serialize(created) });
  }

  if (req.method === 'PATCH' || req.method === 'PUT') {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const id = String(req.query.id || body.id || '').trim();
    if (!id) return res.status(400).json({ error: 'id is required' });

    const existing = await prisma.proTimeOff.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Time off not found' });
    if (existing.structureId !== proCtx.structureId) return res.status(403).json({ error: 'Forbidden' });

    const nextStartAt = typeof body.startAt === 'undefined' ? existing.startAt : toDate(body.startAt);
    const nextEndAt = typeof body.endAt === 'undefined' ? existing.endAt : toDate(body.endAt);
    const rangeError = validateRange(nextStartAt, nextEndAt);
    if (rangeError) return res.status(400).json({ error: rangeError });

    const nextReason =
      typeof body.reason === 'undefined'
        ? existing.reason
        : typeof body.reason === 'string'
          ? body.reason.trim() || null
          : null;

    const noChanges =
      /** @type {Date} */ (nextStartAt).toISOString() === existing.startAt.toISOString() &&
      /** @type {Date} */ (nextEndAt).toISOString() === existing.endAt.toISOString() &&
      (nextReason || null) === (existing.reason || null);

    if (noChanges) {
      return res.status(200).json({ ok: true, item: serialize(existing) });
    }

    const updated = await prisma.proTimeOff.update({
      where: { id },
      data: {
        startAt: /** @type {Date} */ (nextStartAt),
        endAt: /** @type {Date} */ (nextEndAt),
        reason: nextReason || null,
      },
    });

    return res.status(200).json({ ok: true, item: serialize(updated) });
  }

  if (req.method === 'DELETE') {
    const id = String(req.query.id || '').trim();
    if (!id) return res.status(400).json({ error: 'id is required' });

    const existing = await prisma.proTimeOff.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Time off not found' });
    if (existing.structureId !== proCtx.structureId) return res.status(403).json({ error: 'Forbidden' });

    await prisma.proTimeOff.delete({ where: { id } });
    return res.status(200).json({ ok: true, id });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default requireProAuth(handler);
