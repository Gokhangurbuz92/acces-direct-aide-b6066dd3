import { db } from '../../../../src/db/index.js';
import { ProAppointment, ProRdvService, ProAvailabilityRule } from '../../../../src/db/schema.js';
import { eq, inArray, lt, gt, and, gte, lte, count, desc, asc } from 'drizzle-orm';
import { requireProStructureContext } from '../../../_utils/auth.js';
import {
  ACTIVE_APPOINTMENT_STATUSES,
  isSlotWithinRules,
  toBusyWindows,
} from '../../../_utils/pro-rdv.js';
import { withProRdvHandler } from '../../../_utils/with-pro-rdv-handler.js';

/**
 * @param {unknown} value
 * @returns {number}
 */
function toInt(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : NaN;
}

/**
 * @param {Date} date
 * @returns {Date}
 */
function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
}

/**
 * @param {Date} date
 * @returns {Date}
 */
function endOfUtcDay(date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999),
  );
}

/**
 * @param {string | null | undefined} value
 * @returns {string}
 */
function maskContact(value) {
  const text = String(value || '').trim();
  if (!text) return 'Bénéficiaire';
  if (text.length <= 4) return '***';
  return `${text.slice(0, 2)}***${text.slice(-2)}`;
}

/**
 * @param {any} appointment
 * @returns {Record<string, any>}
 */
function serialize(appointment) {
  return {
    id: appointment.id,
    serviceId: appointment.serviceId,
    serviceName: appointment.service?.name || null,
    startAt: appointment.startAt,
    endAt: appointment.endAt,
    start_at: appointment.startAt,
    end_at: appointment.endAt,
    status: appointment.status,
    beneficiaryName: appointment.beneficiaryName,
    beneficiaryPhone: appointment.beneficiaryPhone || null,
    notes: appointment.notes || null,
    visioRoomId: appointment.visioRoomId || null,
    visioEnabled: appointment.visioEnabled || false,
    beneficiary: {
      id: appointment.id,
      contactMasked: maskContact(appointment.beneficiaryPhone || appointment.beneficiaryName),
      firstName: appointment.beneficiaryName || '',
    },
  };
}

/**
 * @param {import('../../../_utils/http-types').ApiRequest} req
 * @param {import('../../../_utils/http-types').ApiResponse} res
 */
async function handler(req, res) {
  const proCtx = requireProStructureContext(req, res);
  if (!proCtx) return;

  if (req.method === 'GET') {
    const page = Math.max(1, toInt(req.query.page || 1) || 1);
    const pageSize = Math.min(50, Math.max(1, toInt(req.query.pageSize || req.query.limit || 20) || 20));
    const skip = (page - 1) * pageSize;
    const id = String(req.query.id || '').trim();
    const status = String(req.query.status || '').trim();

    const from = req.query.from ? new Date(String(req.query.from)) : null;
    const to = req.query.to ? new Date(String(req.query.to)) : null;

    const conditions = [eq(ProAppointment.structureId, proCtx.structureId)];
    if (id) conditions.push(eq(ProAppointment.id, id));
    if (status) conditions.push(eq(ProAppointment.status, status));
    if (from && !Number.isNaN(from.getTime())) conditions.push(gte(ProAppointment.startAt, from));
    if (to && !Number.isNaN(to.getTime())) conditions.push(lte(ProAppointment.startAt, to));
    const whereFilter = and(...conditions);

    const [totalRes, appointments] = await Promise.all([
      db.select({ value: count() }).from(ProAppointment).where(whereFilter),
      db.query.ProAppointment.findMany({
        where: whereFilter,
        offset: skip,
        limit: pageSize,
        orderBy: (pa, { asc }) => [asc(pa.startAt)],
        with: {
          service: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);
    const total = totalRes[0]?.value || 0;

    return res.status(200).json({
      items: appointments.map(serialize),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  }

  if (req.method === 'POST') {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const serviceId = String(body.serviceId || '').trim();
    const startAtRaw = String(body.startAt || '').trim();
    const beneficiaryName = String(body.beneficiaryName || '').trim();
    const beneficiaryPhone = typeof body.beneficiaryPhone === 'string' ? body.beneficiaryPhone.trim() : null;
    const notes = typeof body.notes === 'string' ? body.notes.trim() : null;

    if (!serviceId) return res.status(400).json({ error: 'serviceId is required' });
    if (!startAtRaw) return res.status(400).json({ error: 'startAt is required' });
    if (!beneficiaryName) return res.status(400).json({ error: 'beneficiaryName is required' });

    const startAt = new Date(startAtRaw);
    if (Number.isNaN(startAt.getTime())) {
      return res.status(400).json({ error: 'Invalid startAt' });
    }

    const service = await db.query.ProRdvService.findFirst({
      where: (s, { eq }) => eq(s.id, serviceId),
    });
    if (!service) return res.status(404).json({ error: 'Service not found' });
    if (service.structureId !== proCtx.structureId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (!service.isActive) return res.status(409).json({ error: 'Service is inactive' });

    const endAt = new Date(startAt.getTime() + service.durationMinutes * 60_000);
    const rangeStart = startOfUtcDay(startAt);
    const rangeEnd = endOfUtcDay(startAt);

    const rules = await db.query.ProAvailabilityRule.findMany({
      where: (r, { and, eq }) => and(
        eq(r.structureId, proCtx.structureId),
        eq(r.isActive, true)
      ),
      orderBy: (r, { asc }) => [asc(r.weekday), asc(r.startTime)],
    });

    const slotAllowed = isSlotWithinRules({
      rules,
      startAt,
      endAt,
    });
    if (!slotAllowed) {
      return res.status(409).json({ error: 'Slot is not available' });
    }

    const conflictResult = await db.transaction(async (tx) => {
      const existing = await tx.query.ProAppointment.findMany({
        where: (pa, { and, eq, inArray, lt, gt }) => and(
          eq(pa.structureId, proCtx.structureId),
          inArray(pa.status, ACTIVE_APPOINTMENT_STATUSES),
          lt(pa.startAt, endAt),
          gt(pa.endAt, startAt)
        ),
        with: {
          service: {
            columns: {
              bufferBeforeMinutes: true,
              bufferAfterMinutes: true,
            },
          },
        },
      });

      const busyWindows = toBusyWindows(existing);
      const requestedWindow = {
        start: new Date(startAt.getTime() - service.bufferBeforeMinutes * 60_000),
        end: new Date(endAt.getTime() + service.bufferAfterMinutes * 60_000),
      };

      const hasConflict = busyWindows.some((window) => requestedWindow.start < window.end && window.start < requestedWindow.end);
      if (hasConflict) return { conflict: true, appointment: null };

      const [appointment] = await tx.insert(ProAppointment).values({
        structureId: proCtx.structureId,
        serviceId: service.id,
        startAt,
        endAt,
        status: 'booked',
        beneficiaryName,
        beneficiaryPhone,
        notes,
        createdByProUserId: proCtx.userId,
      }).returning();

      const fullAppointment = await tx.query.ProAppointment.findFirst({
        where: (pa, { eq }) => eq(pa.id, appointment.id),
        with: {
          service: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
      });
      return { conflict: false, appointment: fullAppointment };
    }, {
      isolationLevel: 'serializable'
    });

    if (conflictResult.conflict || !conflictResult.appointment) {
      return res.status(409).json({ error: 'Slot no longer available' });
    }

    return res.status(201).json({
      ok: true,
      item: serialize(conflictResult.appointment),
      meta: {
        rangeStart: rangeStart.toISOString(),
        rangeEnd: rangeEnd.toISOString(),
      },
    });
  }

  if (req.method === 'PATCH') {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const id = String(req.query.id || body.id || '').trim();
    const status = String(body.status || '').trim();
    const notes = typeof body.notes === 'string' ? body.notes.trim() : undefined;

    if (!id) return res.status(400).json({ error: 'id is required' });
    if (!['cancelled', 'done'].includes(status)) {
      return res.status(400).json({ error: 'status must be cancelled or done' });
    }

    const existing = await db.query.ProAppointment.findFirst({
      where: (pa, { eq }) => eq(pa.id, id),
      with: {
        service: { columns: { id: true, name: true } },
      },
    });
    if (!existing) return res.status(404).json({ error: 'Appointment not found' });
    if (existing.structureId !== proCtx.structureId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    /** @type {Record<string, any>} */
    const updates = {};
    if (existing.status !== status) updates.status = status;
    if (typeof notes !== 'undefined' && notes !== existing.notes) updates.notes = notes || null;

    if (Object.keys(updates).length === 0) {
      return res.status(200).json({ ok: true, item: serialize(existing) });
    }

    await db.update(ProAppointment).set(updates).where(eq(ProAppointment.id, id));

    const updated = await db.query.ProAppointment.findFirst({
      where: (pa, { eq }) => eq(pa.id, id),
      with: {
        service: { columns: { id: true, name: true } },
      },
    });
    return res.status(200).json({ ok: true, item: serialize(updated) });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withProRdvHandler('pro.appointments', handler);
