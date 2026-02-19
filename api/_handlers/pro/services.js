
import prisma from '../../_utils/prisma.js';
import { AUTH_ROLE, requireProAuth, requireProStructureContext } from '../../_utils/auth.js';

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
    const services = await prisma.proRdvService.findMany({
      where: { structureId },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json(services.map(serialize));
  }

  if (!canWrite) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method === 'POST') {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const name = String(body.name || '').trim();
    const durationMinutes = toInt(body.durationMinutes ?? body.duration_minutes);
    const bufferBeforeMinutes = Math.max(
      0,
      toInt(body.bufferBeforeMinutes ?? body.buffer_before_minutes ?? 0),
    );
    const bufferAfterMinutes = Math.max(
      0,
      toInt(body.bufferAfterMinutes ?? body.buffer_after_minutes ?? 0),
    );
    const isActive = body.isActive ?? body.is_active ?? true;

    if (!name) return res.status(400).json({ error: 'Name is required' });
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      return res.status(400).json({ error: 'durationMinutes must be a positive number' });
    }

    const created = await prisma.proRdvService.create({
      data: {
        structureId,
        name,
        durationMinutes,
        bufferBeforeMinutes,
        bufferAfterMinutes,
        isActive: Boolean(isActive),
      },
    });
    return res.status(201).json(serialize(created));
  }

  if (req.method === 'PATCH' || req.method === 'PUT') {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const id = String(req.query.id || body.id || '').trim();
    if (!id) return res.status(400).json({ error: 'id is required' });

    const existing = await prisma.proRdvService.findUnique({
      where: { id },
    });
    if (!existing) {
      const legacy = await prisma.service.findUnique({ where: { id } });
      if (legacy && legacy.structureId !== structureId) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      return res.status(404).json({ error: 'Service not found' });
    }
    if (existing.structureId !== structureId) return res.status(403).json({ error: 'Forbidden' });

    /** @type {Record<string, any>} */
    const updates = {};
    if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim();

    if (typeof body.durationMinutes !== 'undefined' || typeof body.duration_minutes !== 'undefined') {
      const durationMinutes = toInt(body.durationMinutes ?? body.duration_minutes);
      if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
        return res.status(400).json({ error: 'durationMinutes must be a positive number' });
      }
      updates.durationMinutes = durationMinutes;
    }

    if (
      typeof body.bufferBeforeMinutes !== 'undefined' ||
      typeof body.buffer_before_minutes !== 'undefined'
    ) {
      const bufferBeforeMinutes = Math.max(
        0,
        toInt(body.bufferBeforeMinutes ?? body.buffer_before_minutes),
      );
      updates.bufferBeforeMinutes = bufferBeforeMinutes;
    }

    if (
      typeof body.bufferAfterMinutes !== 'undefined' ||
      typeof body.buffer_after_minutes !== 'undefined'
    ) {
      const bufferAfterMinutes = Math.max(0, toInt(body.bufferAfterMinutes ?? body.buffer_after_minutes));
      updates.bufferAfterMinutes = bufferAfterMinutes;
    }

    if (typeof body.isActive !== 'undefined' || typeof body.is_active !== 'undefined') {
      updates.isActive = Boolean(body.isActive ?? body.is_active);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(200).json(serialize(existing));
    }

    const updated = await prisma.proRdvService.update({
      where: { id: existing.id },
      data: updates,
    });
    return res.status(200).json(serialize(updated));
  }

  if (req.method === 'DELETE') {
    const id = String(req.query.id || '').trim();
    if (!id) return res.status(400).json({ error: 'id is required' });

    const existing = await prisma.proRdvService.findUnique({
      where: { id },
    });
    if (!existing) {
      const legacy = await prisma.service.findUnique({ where: { id } });
      if (legacy && legacy.structureId !== structureId) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      return res.status(404).json({ error: 'Service not found' });
    }
    if (existing.structureId !== structureId) return res.status(403).json({ error: 'Forbidden' });

    const activeAppointments = await prisma.proAppointment.count({
      where: {
        serviceId: id,
        status: { in: ['booked', 'requested', 'confirmed', 'locked'] },
      },
    });

    if (activeAppointments > 0) {
      const disabled = await prisma.proRdvService.update({
        where: { id },
        data: { isActive: false },
      });
      return res.status(200).json({ ...serialize(disabled), deleted: false, disabled: true });
    }

    await prisma.proRdvService.delete({ where: { id } });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default requireProAuth(handler);
