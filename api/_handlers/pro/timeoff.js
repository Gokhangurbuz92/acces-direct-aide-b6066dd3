import crypto from 'node:crypto';
import { db } from '../../../src/db/index.js';
import { ProTimeOff } from '../../../src/db/schema.js';
import { eq, and, gt, lt, gte, lte, asc } from 'drizzle-orm';
import { requireProStructureContext } from '../../_utils/auth.js';
import { withProRdvHandler } from '../../_utils/with-pro-rdv-handler.js';
import { createTimeOffSchema } from '../../../src/db/drizzle-schemas.js';

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

    const conditions = [eq(ProTimeOff.structureId, proCtx.structureId)];
    if (from || to) {
      if (from) conditions.push(gt(ProTimeOff.endAt, from));
      if (to) conditions.push(lt(ProTimeOff.startAt, to));
    }

    const items = await db.query.ProTimeOff.findMany({
      where: and(...conditions),
      orderBy: [asc(ProTimeOff.startAt), asc(ProTimeOff.createdAt)],
    });

    return res.status(200).json({ items: items.map(serialize), total: items.length });
  }

  if (req.method === 'POST') {
    const parsed = createTimeOffSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || 'Invalid input';
      return res.status(400).json({ error: firstError });
    }
    const { startAt, endAt, reason: rawReason } = parsed.data;
    const reason = typeof rawReason === 'string' ? rawReason.trim() || null : null;

    const [created] = await db.insert(ProTimeOff).values({
        id: crypto.randomUUID(),
        structureId: proCtx.structureId,
        startAt,
        endAt,
        reason,
        createdAt: new Date(),
        updatedAt: new Date(),
    }).returning();

    return res.status(201).json({ ok: true, item: serialize(created) });
  }

  if (req.method === 'PATCH' || req.method === 'PUT') {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const id = String(req.query.id || body.id || '').trim();
    if (!id) return res.status(400).json({ error: 'id is required' });

    const existing = await db.query.ProTimeOff.findFirst({ where: eq(ProTimeOff.id, id) });
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

    const [updated] = await db.update(ProTimeOff).set({
        startAt: /** @type {Date} */ (nextStartAt),
        endAt: /** @type {Date} */ (nextEndAt),
        reason: nextReason || null,
        updatedAt: new Date(),
    }).where(eq(ProTimeOff.id, id)).returning();

    return res.status(200).json({ ok: true, item: serialize(updated) });
  }

  if (req.method === 'DELETE') {
    const id = String(req.query.id || '').trim();
    if (!id) return res.status(400).json({ error: 'id is required' });

    const existing = await db.query.ProTimeOff.findFirst({ where: eq(ProTimeOff.id, id) });
    if (!existing) return res.status(404).json({ error: 'Time off not found' });
    if (existing.structureId !== proCtx.structureId) return res.status(403).json({ error: 'Forbidden' });

    await db.delete(ProTimeOff).where(eq(ProTimeOff.id, id));
    return res.status(200).json({ ok: true, id });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withProRdvHandler('pro.timeoff', handler);
