import { db } from '../../../src/db/index.js';
import { ProRdvService, ProAvailabilityRule, ProAppointment, ProTimeOff } from '../../../src/db/schema.js';
import { eq, inArray, lt, gt, and } from 'drizzle-orm';
import { requireProStructureContext } from '../../_utils/auth.js';
import {
  ACTIVE_APPOINTMENT_STATUSES,
  generateSlots,
  toBusyWindows,
  validateDateRange,
} from '../../_utils/pro-rdv.js';
import { withProRdvHandler } from '../../_utils/with-pro-rdv-handler.js';

const MAX_RANGE_DAYS = 31;

/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */
async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const proCtx = requireProStructureContext(req, res);
  if (!proCtx) return;

  const serviceId = String(req.query.serviceId || '').trim();
  const from = String(req.query.from || '').trim();
  const to = String(req.query.to || '').trim();

  if (!serviceId) return res.status(400).json({ error: 'serviceId is required' });
  if (!from || !to) return res.status(400).json({ error: 'from and to are required' });

  let range;
  try {
    range = validateDateRange(from, to, MAX_RANGE_DAYS);
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid date range' });
  }

  const service = await db.query.ProRdvService.findFirst({
    where: eq(ProRdvService.id, serviceId),
  });
  if (!service) return res.status(404).json({ error: 'Service not found' });
  if (service.structureId !== proCtx.structureId) return res.status(403).json({ error: 'Forbidden' });

  const rules = await db.query.ProAvailabilityRule.findMany({
    where: and(
      eq(ProAvailabilityRule.structureId, proCtx.structureId),
      eq(ProAvailabilityRule.isActive, true)
    ),
    orderBy: (par, { asc }) => [asc(par.weekday), asc(par.startTime)],
  });

  const appointments = await db.query.ProAppointment.findMany({
    where: and(
      eq(ProAppointment.structureId, proCtx.structureId),
      inArray(ProAppointment.status, ACTIVE_APPOINTMENT_STATUSES),
      lt(ProAppointment.startAt, range.to),
      gt(ProAppointment.endAt, range.from)
    ),
    columns: {
      id: true,
      startAt: true,
      endAt: true,
      status: true,
    },
    with: {
      service: {
        columns: {
          bufferBeforeMinutes: true,
          bufferAfterMinutes: true,
        },
      },
    },
  });

  const timeOffs = await db.query.ProTimeOff.findMany({
    where: and(
      eq(ProTimeOff.structureId, proCtx.structureId),
      lt(ProTimeOff.startAt, range.to),
      gt(ProTimeOff.endAt, range.from)
    ),
    columns: {
      startAt: true,
      endAt: true,
    },
  });

  const busyWindows = [
    ...toBusyWindows(appointments),
    ...timeOffs.map((off /** @type {any} */) => ({
      start: off.startAt,
      end: off.endAt,
    })),
  ];

  const slots = generateSlots({
    rules,
    from: range.from,
    to: range.to,
    durationMinutes: service.durationMinutes,
    bufferBeforeMinutes: service.bufferBeforeMinutes,
    bufferAfterMinutes: service.bufferAfterMinutes,
    busyWindows,
  });

  return res.status(200).json({
    slots,
    meta: {
      serviceId: service.id,
      timezone: rules[0]?.timezone || 'Europe/Paris',
      durationMinutes: service.durationMinutes,
      bufferBeforeMinutes: service.bufferBeforeMinutes,
      bufferAfterMinutes: service.bufferAfterMinutes,
      from: range.from.toISOString(),
      to: range.to.toISOString(),
      total: slots.length,
    },
  });
}

export default withProRdvHandler('pro.slots', handler);
