import crypto from 'node:crypto';
import { db } from '../../../src/db/index.js';
import { ProRdvService, ProAppointment } from '../../../src/db/schema.js';
import { eq, desc, and, inArray, sql } from 'drizzle-orm';
import { AUTH_ROLE, requireProStructureContext } from '../../_utils/auth.js';
import { withProRdvHandler } from '../../_utils/with-pro-rdv-handler.js';
import { createServiceSchema, updateServiceSchema } from '../../../src/db/drizzle-schemas.js';

/**
 * @param {unknown} value
 * @returns {number}
 */
function toInt(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : NaN;
}

/**
 * @param {any} service
 * @returns {Record<string, any>}
 */
function serialize(service) {
  return {
    id: service.id,
    structureId: service.structureId,
    name: service.name,
    durationMinutes: service.durationMinutes,
    duration_minutes: service.durationMinutes,
    bufferBeforeMinutes: service.bufferBeforeMinutes,
    buffer_before_minutes: service.bufferBeforeMinutes,
    bufferAfterMinutes: service.bufferAfterMinutes,
    buffer_after_minutes: service.bufferAfterMinutes,
    isActive: service.isActive,
    is_active: service.isActive,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
    description_falc: null,
    modes: [],
    audiences: [],
  };
}

/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */
async function handler(req, res) {
  const proCtx = requireProStructureContext(req, res);
  if (!proCtx) return;

  const { structureId, role } = proCtx;
  const canWrite = role === AUTH_ROLE.STRUCTURE_ADMIN || role === AUTH_ROLE.SUPERADMIN;

  if (req.method === 'GET') {
    const services = await db.query.ProRdvService.findMany({
      where: eq(ProRdvService.structureId, structureId),
      orderBy: [desc(ProRdvService.createdAt)],
    });
    return res.status(200).json(services.map(serialize));
  }

  if (!canWrite) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method === 'POST') {
    const parsed = createServiceSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || 'Invalid input';
      return res.status(400).json({ error: firstError });
    }
    const data = parsed.data;
    const name = data.name;
    const durationMinutes = data.durationMinutes ?? data.duration_minutes;
    const bufferBeforeMinutes = Math.max(0, data.bufferBeforeMinutes ?? data.buffer_before_minutes ?? 0);
    const bufferAfterMinutes = Math.max(0, data.bufferAfterMinutes ?? data.buffer_after_minutes ?? 0);
    const isActive = data.isActive ?? data.is_active ?? true;

    const [created] = await db.insert(ProRdvService).values({
        id: crypto.randomUUID(),
        structureId,
        name,
        durationMinutes,
        bufferBeforeMinutes,
        bufferAfterMinutes,
        isActive: Boolean(isActive),
        createdAt: new Date(),
        updatedAt: new Date(),
    }).returning();
    return res.status(201).json(serialize(created));
  }

  if (req.method === 'PATCH' || req.method === 'PUT') {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const id = String(req.query.id || body.id || '').trim();
    if (!id) return res.status(400).json({ error: 'id is required' });

    const existing = await db.query.ProRdvService.findFirst({
      where: eq(ProRdvService.id, id),
    });
    if (!existing) {
      const legacy = await db.query.Service.findFirst({ where: eq(Service.id, id) });
      if (legacy && legacy.structureId !== structureId) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      return res.status(404).json({ error: 'Service not found' });
    }
    if (existing.structureId !== structureId) return res.status(403).json({ error: 'Forbidden' });

    const parsed = updateServiceSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || 'Invalid input';
      return res.status(400).json({ error: firstError });
    }
    const data = parsed.data;

    /** @type {Record<string, any>} */
    const updates = {};
    if (data.name) updates.name = data.name;

    const durationMinutes = data.durationMinutes ?? data.duration_minutes;
    if (typeof durationMinutes === 'number') updates.durationMinutes = durationMinutes;

    const bufferBefore = data.bufferBeforeMinutes ?? data.buffer_before_minutes;
    if (typeof bufferBefore === 'number') updates.bufferBeforeMinutes = Math.max(0, bufferBefore);

    const bufferAfter = data.bufferAfterMinutes ?? data.buffer_after_minutes;
    if (typeof bufferAfter === 'number') updates.bufferAfterMinutes = Math.max(0, bufferAfter);

    const isActive = data.isActive ?? data.is_active;
    if (typeof isActive === 'boolean') updates.isActive = isActive;

    updates.updatedAt = new Date();

    if (Object.keys(updates).length <= 1) {
      return res.status(200).json(serialize(existing));
    }

    const [updated] = await db.update(ProRdvService).set(updates).where(eq(ProRdvService.id, existing.id)).returning();
    return res.status(200).json(serialize(updated));
  }

  if (req.method === 'DELETE') {
    const id = String(req.query.id || '').trim();
    if (!id) return res.status(400).json({ error: 'id is required' });

    const existing = await db.query.ProRdvService.findFirst({
      where: eq(ProRdvService.id, id),
    });
    if (!existing) {
      const legacy = await db.query.Service.findFirst({ where: eq(Service.id, id) });
      if (legacy && legacy.structureId !== structureId) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      return res.status(404).json({ error: 'Service not found' });
    }
    if (existing.structureId !== structureId) return res.status(403).json({ error: 'Forbidden' });

    const activeAppointmentsRes = await db.select({ count: sql`count(*)` })
      .from(ProAppointment)
      .where(and(
        eq(ProAppointment.serviceId, id),
        inArray(ProAppointment.status, ['booked', 'requested', 'confirmed', 'locked'])
      ));
    const activeAppointments = Number(activeAppointmentsRes[0].count);

    if (activeAppointments > 0) {
      const [disabled] = await db.update(ProRdvService).set({ isActive: false }).where(eq(ProRdvService.id, id)).returning();
      return res.status(200).json({ ...serialize(disabled), deleted: false, disabled: true });
    }

    await db.delete(ProRdvService).where(eq(ProRdvService.id, id));
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withProRdvHandler('pro.services', handler);
