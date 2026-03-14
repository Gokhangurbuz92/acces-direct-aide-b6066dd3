// @ts-nocheck
import { db } from '../../src/db/index.js';
import * as schema from '../../src/db/schema.js';
import { eq, and, inArray, lt, gt, sql, asc, count } from 'drizzle-orm';
import { buildAppointmentIcs } from '../_utils/ics.js';
import { sendMail } from '../_utils/mailer.js';
import { ACTIVE_APPOINTMENT_STATUSES, generateSlots, toBusyWindows, validateDateRange } from '../_utils/pro-rdv.js';
import { checkRateLimit, getClientIp, getRateLimitStatus } from '../_utils/rateLimit.js';
import { requireCitizenUser } from '../_utils/rdv-public-auth.js';
import { buildAppUrl } from '../_utils/user-auth.js';

const MAX_RANGE_DAYS = 14;
const MAX_BOOKING_AHEAD_DAYS = 60;
const MIN_BOOKING_DELAY_MINUTES = 5;

/**
 * @param {import('../_utils/http-types').ApiRequest} req
 * @returns {URL}
 */
function getUrl(req) {
  return new URL(req.url || '/api/rdv', `https://${req.headers?.host || 'localhost'}`);
}

/**
 * @param {import('../_utils/http-types').ApiRequest} req
 * @returns {string[]}
 */
function getPathSegments(req) {
  const pathname = getUrl(req).pathname || '';
  const normalized = pathname
    .replace(/^\/api\/rdv\/?/i, '')
    .replace(/^\/rdv\/?/i, '')
    .replace(/\/+$/, '');
  if (!normalized) return [];
  return normalized.split('/').filter(Boolean).map((segment) => decodeURIComponent(segment));
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function toTrimmedString(value) {
  return String(value || '').trim();
}

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function normalizeDateInput(value) {
  const raw = toTrimmedString(value);
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return `${raw}T00:00:00.000Z`;
  }
  return raw;
}

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function normalizeToDateInput(value) {
  const raw = toTrimmedString(value);
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return `${raw}T23:59:59.999Z`;
  }
  return raw;
}

/**
 * @param {Date} value
 * @returns {Date}
 */
function startOfUtcDay(value) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(), 0, 0, 0, 0));
}

/**
 * @param {Date} value
 * @returns {Date}
 */
function endOfUtcDay(value) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(), 23, 59, 59, 999));
}

/**
 * @param {Date} value
 * @returns {Date}
 */
function addDaysUtc(value, days) {
  return new Date(value.getTime() + Number(days || 0) * 24 * 60 * 60 * 1000);
}

/**
 * @param {Array<{ startAt: string, endAt: string }>} slots
 */
function groupSlotsByDay(slots) {
  /** @type {Map<string, Array<{ startAt: string, endAt: string }>>} */
  const byDay = new Map();
  for (const slot of slots) {
    const day = String(slot.startAt || '').slice(0, 10);
    if (!day) continue;
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push(slot);
  }

  return Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, daySlots]) => ({
      date,
      slots: daySlots,
    }));
}

/**
 * @param {string} slug
 */
async function loadStructureBySlug(slug) {
  const structure = await db.query.Structure.findFirst({
    where: (t, { eq, and }) => and(eq(t.slug, slug), eq(t.statut, 'actif')),
    columns: {
      id: true,
      slug: true,
      nom: true,
      is_pro_enabled: true,
    },
    with: {
      rdvSettings: {
        columns: {
          isPublished: true,
          bookingMode: true,
        },
      },
    },
  });

  if (!structure) return null;

  // rdvSettings is a `many` relation → array in Drizzle
  const settings = Array.isArray(structure.rdvSettings) ? structure.rdvSettings[0] : structure.rdvSettings;
  const isPublished =
    settings && typeof settings.isPublished === 'boolean'
      ? settings.isPublished
      : Boolean(structure.is_pro_enabled);

  return {
    id: structure.id,
    slug: structure.slug,
    nom: structure.nom,
    isPublished,
    bookingMode: settings?.bookingMode || 'IN_PERSON',
  };
}

/**
 * @param {import('../_utils/http-types').ApiRequest} req
 * @param {string} kind
 * @param {string} userId
 */
async function enforcePublicRdvRateLimit(req, kind, userId) {
  const ip = getClientIp(req);
  const action = kind === 'write' ? 'RDV_PUBLIC_WRITE' : 'RDV_PUBLIC_READ';
  const key = `${userId || 'anonymous'}:${ip}`;
  const result = await checkRateLimit(action, key);
  if (!result.allowed) {
    return {
      allowed: false,
      status: getRateLimitStatus(result),
      error: result.error || { error: 'Too many requests' },
    };
  }

  return { allowed: true };
}

/**
 * @param {any} appointment
 * @param {{ structureSlug?: string | null }=} options
 */
function serializeAppointment(appointment, options = {}) {
  const structureSlug = toTrimmedString(options.structureSlug || appointment?.structure?.slug || '');
  const manageUrl = structureSlug
    ? buildAppUrl(`/rdv/${encodeURIComponent(structureSlug)}/creneaux?appointment=${encodeURIComponent(appointment.id)}`)
    : null;

  return {
    id: appointment.id,
    status: String(appointment.status || '').toUpperCase(),
    startsAt: appointment.startAt instanceof Date ? appointment.startAt.toISOString() : null,
    endsAt: appointment.endAt instanceof Date ? appointment.endAt.toISOString() : null,
    cancelledAt: appointment.cancelledAt instanceof Date ? appointment.cancelledAt.toISOString() : null,
    cancelledBy: appointment.cancelledBy || null,
    structure: appointment.structure
      ? {
          id: appointment.structure.id,
          slug: appointment.structure.slug,
          name: appointment.structure.nom,
        }
      : null,
    service: appointment.service
      ? {
          id: appointment.service.id,
          name: appointment.service.name,
          durationMinutes: appointment.service.durationMinutes,
        }
      : null,
    manageUrl,
  };
}

/**
 * @param {{
 *  appointment: any,
 *  structureName: string,
 *  structureSlug: string,
 *  serviceName: string,
 *  toEmail: string,
 * }} input
 */
async function sendAppointmentConfirmationEmail(input) {
  const startsAt = new Date(input.appointment.startAt);
  const endsAt = new Date(input.appointment.endAt);
  const manageUrl = buildAppUrl(`/rdv/${encodeURIComponent(input.structureSlug)}/creneaux?appointment=${encodeURIComponent(input.appointment.id)}`);

  const startsAtLocal = startsAt.toLocaleString('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Europe/Paris',
  });

  const ics = buildAppointmentIcs({
    appointmentId: input.appointment.id,
    startAt: startsAt,
    endAt: endsAt,
    structureName: input.structureName,
    serviceName: input.serviceName,
    manageUrl,
  });

  const text = [
    `Votre rendez-vous est confirme avec ${input.structureName}.`,
    '',
    `Service: ${input.serviceName}`,
    `Date: ${startsAtLocal} (Europe/Paris)`,
    '',
    `Gerer mon rendez-vous: ${manageUrl}`,
    '',
    "Si vous n'etes pas a l'origine de cette demande, ignorez cet email.",
  ].join('\n');

  await sendMail({
    to: input.toEmail,
    subject: `Confirmation de votre rendez-vous - ${input.structureName}`,
    text,
    category: 'appointment_confirmation',
    attachments: [
      {
        filename: `acces-direct-aide-rdv-${input.appointment.id}.ics`,
        contentType: 'text/calendar; charset=utf-8',
        content: ics,
      },
    ],
  });
}

/**
 * Helper: load appointment with service + structure relations
 * @param {string} appointmentId
 * @param {{ citizenUserId?: string, idempotencyKey?: string }=} where
 */
async function loadAppointmentWithRelations(appointmentId, where = {}) {
  if (appointmentId) {
    return db.query.ProAppointment.findFirst({
      where: (a, { eq }) => eq(a.id, appointmentId),
      with: {
        service: { columns: { id: true, name: true, durationMinutes: true } },
        structure: { columns: { id: true, slug: true, nom: true } },
      },
    });
  }
  if (where.citizenUserId && where.idempotencyKey) {
    return db.query.ProAppointment.findFirst({
      where: (a, { eq, and }) => and(eq(a.citizenUserId, where.citizenUserId), eq(a.idempotencyKey, where.idempotencyKey)),
      with: {
        service: { columns: { id: true, name: true, durationMinutes: true } },
        structure: { columns: { id: true, slug: true, nom: true } },
      },
    });
  }
  return null;
}

/**
 * Helper: find overlapping appointments using Query Builder (supports lt/gt/in)
 * @param {any} dbOrTx - db or tx instance
 * @param {{ structureId: string, statuses: string[], startBefore: Date, endAfter: Date }} params
 */
async function findOverlappingAppointments(dbOrTx, params) {
  const rows = await dbOrTx
    .select()
    .from(schema.ProAppointment)
    .where(
      and(
        eq(schema.ProAppointment.structureId, params.structureId),
        inArray(schema.ProAppointment.status, params.statuses),
        lt(schema.ProAppointment.startAt, params.startBefore),
        gt(schema.ProAppointment.endAt, params.endAfter),
      ),
    );

  // Load service relation for buffer minutes
  const withService = await Promise.all(
    rows.map(async (appt) => {
      const service = appt.serviceId
        ? await db.query.ProRdvService.findFirst({
            where: (s, { eq }) => eq(s.id, appt.serviceId),
            columns: { bufferBeforeMinutes: true, bufferAfterMinutes: true },
          })
        : null;
      return { ...appt, service };
    }),
  );

  return withService;
}

/**
 * Helper: find time-offs overlapping a range using Query Builder
 * @param {any} dbOrTx
 * @param {{ structureId: string, startBefore: Date, endAfter: Date }} params
 */
async function findOverlappingTimeOffs(dbOrTx, params) {
  return dbOrTx
    .select({ startAt: schema.ProTimeOff.startAt, endAt: schema.ProTimeOff.endAt })
    .from(schema.ProTimeOff)
    .where(
      and(
        eq(schema.ProTimeOff.structureId, params.structureId),
        lt(schema.ProTimeOff.startAt, params.startBefore),
        gt(schema.ProTimeOff.endAt, params.endAfter),
      ),
    );
}

/**
 * @param {import('../_utils/http-types').ApiRequest} req
 * @param {import('../_utils/http-types').ApiResponse} res
 */
async function getServices(req, res) {
  const segments = getPathSegments(req);
  const structureSlug = toTrimmedString(segments[1]);

  if (!structureSlug) {
    return res.status(400).json({ error: 'structure slug is required' });
  }

  const auth = await requireCitizenUser(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.error, ...(auth.code ? { code: auth.code } : {}) });
  }

  const rateLimit = await enforcePublicRdvRateLimit(req, 'read', auth.user.id);
  if (!rateLimit.allowed) {
    return res.status(rateLimit.status).json(rateLimit.error);
  }

  const structure = await loadStructureBySlug(structureSlug);
  if (!structure || !structure.isPublished) {
    return res.status(404).json({ error: 'RDV indisponible' });
  }

  const services = await db.query.ProRdvService.findMany({
    where: (s, { eq, and }) => and(eq(s.structureId, structure.id), eq(s.isActive, true)),
    columns: {
      id: true,
      name: true,
      durationMinutes: true,
      bufferBeforeMinutes: true,
      bufferAfterMinutes: true,
    },
    orderBy: (s, { asc }) => [asc(s.name)],
  });

  return res.status(200).json({
    structure: {
      slug: structure.slug,
      name: structure.nom,
      bookingMode: structure.bookingMode,
    },
    items: services.map((service) => ({
      id: service.id,
      name: service.name,
      durationMinutes: service.durationMinutes,
      bufferBeforeMinutes: service.bufferBeforeMinutes,
      bufferAfterMinutes: service.bufferAfterMinutes,
    })),
  });
}

/**
 * @param {import('../_utils/http-types').ApiRequest} req
 * @param {import('../_utils/http-types').ApiResponse} res
 */
async function getSlots(req, res) {
  const segments = getPathSegments(req);
  const structureSlug = toTrimmedString(segments[1]);

  if (!structureSlug) {
    return res.status(400).json({ error: 'structure slug is required' });
  }

  const auth = await requireCitizenUser(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.error, ...(auth.code ? { code: auth.code } : {}) });
  }

  const rateLimit = await enforcePublicRdvRateLimit(req, 'read', auth.user.id);
  if (!rateLimit.allowed) {
    return res.status(rateLimit.status).json(rateLimit.error);
  }

  const structure = await loadStructureBySlug(structureSlug);
  if (!structure || !structure.isPublished) {
    return res.status(404).json({ error: 'RDV indisponible' });
  }

  const serviceId = toTrimmedString(req.query?.serviceId);
  const fromInput = normalizeDateInput(req.query?.from);
  const toInput = normalizeToDateInput(req.query?.to);

  if (!serviceId || !fromInput || !toInput) {
    return res.status(400).json({ error: 'serviceId, from and to are required' });
  }

  let range;
  try {
    range = validateDateRange(fromInput, toInput, MAX_RANGE_DAYS);
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid date range' });
  }

  const service = await db.query.ProRdvService.findFirst({
    where: (s, { eq, and }) => and(eq(s.id, serviceId), eq(s.structureId, structure.id), eq(s.isActive, true)),
    columns: {
      id: true,
      name: true,
      durationMinutes: true,
      bufferBeforeMinutes: true,
      bufferAfterMinutes: true,
    },
  });

  if (!service) {
    return res.status(404).json({ error: 'Service not found' });
  }

  const rules = await db.query.ProAvailabilityRule.findMany({
    where: (r, { eq, and }) => and(eq(r.structureId, structure.id), eq(r.isActive, true)),
    orderBy: (r, { asc }) => [asc(r.weekday), asc(r.startTime)],
  });

  const appointments = await findOverlappingAppointments(db, {
    structureId: structure.id,
    statuses: ACTIVE_APPOINTMENT_STATUSES,
    startBefore: range.to,
    endAfter: range.from,
  });

  const timeOffs = await findOverlappingTimeOffs(db, {
    structureId: structure.id,
    startBefore: range.to,
    endAfter: range.from,
  });

  const busyWindows = [
    ...toBusyWindows(appointments),
    ...timeOffs.map((timeOff) => ({ start: timeOff.startAt, end: timeOff.endAt })),
  ];

  const slots = generateSlots({
    rules,
    from: range.from,
    to: range.to,
    durationMinutes: service.durationMinutes,
    bufferBeforeMinutes: service.bufferBeforeMinutes,
    bufferAfterMinutes: service.bufferAfterMinutes,
    busyWindows,
    maxSlots: 800,
  });

  return res.status(200).json({
    timezone: rules[0]?.timezone || 'Europe/Paris',
    service: {
      id: service.id,
      name: service.name,
      durationMinutes: service.durationMinutes,
      bufferBeforeMinutes: service.bufferBeforeMinutes,
      bufferAfterMinutes: service.bufferAfterMinutes,
    },
    from: range.from.toISOString(),
    to: range.to.toISOString(),
    total: slots.length,
    slots,
    days: groupSlotsByDay(slots),
  });
}

/**
 * @param {import('../_utils/http-types').ApiRequest} req
 * @param {import('../_utils/http-types').ApiResponse} res
 */
async function createAppointment(req, res) {
  const auth = await requireCitizenUser(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.error, ...(auth.code ? { code: auth.code } : {}) });
  }

  const rateLimit = await enforcePublicRdvRateLimit(req, 'write', auth.user.id);
  if (!rateLimit.allowed) {
    return res.status(rateLimit.status).json(rateLimit.error);
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const structureSlug = toTrimmedString(body.structureSlug);
  const serviceId = toTrimmedString(body.serviceId);
  const startAtRaw = toTrimmedString(body.startAt);
  const idempotencyKey = toTrimmedString(body.idempotencyKey);

  if (!structureSlug || !serviceId || !startAtRaw || !idempotencyKey) {
    return res.status(400).json({ error: 'structureSlug, serviceId, startAt and idempotencyKey are required' });
  }

  const existingByKey = await loadAppointmentWithRelations(null, {
    citizenUserId: auth.user.id,
    idempotencyKey,
  });

  if (existingByKey) {
    return res.status(200).json(serializeAppointment(existingByKey));
  }

  const startAt = new Date(startAtRaw);
  if (Number.isNaN(startAt.getTime())) {
    return res.status(400).json({ error: 'Invalid startAt' });
  }

  const now = new Date();
  const minStartAt = new Date(now.getTime() + MIN_BOOKING_DELAY_MINUTES * 60_000);
  const maxStartAt = addDaysUtc(now, MAX_BOOKING_AHEAD_DAYS);
  if (startAt < minStartAt || startAt > maxStartAt) {
    return res.status(400).json({ error: 'startAt out of allowed range' });
  }

  const structure = await loadStructureBySlug(structureSlug);
  if (!structure || !structure.isPublished) {
    return res.status(404).json({ error: 'RDV indisponible' });
  }

  const service = await db.query.ProRdvService.findFirst({
    where: (s, { eq, and }) => and(eq(s.id, serviceId), eq(s.structureId, structure.id), eq(s.isActive, true)),
    columns: {
      id: true,
      name: true,
      durationMinutes: true,
      bufferBeforeMinutes: true,
      bufferAfterMinutes: true,
    },
  });

  if (!service) {
    return res.status(404).json({ error: 'Service not found' });
  }

  const endAt = new Date(startAt.getTime() + service.durationMinutes * 60_000);
  const dayStart = startOfUtcDay(startAt);
  const dayEnd = endOfUtcDay(startAt);

  const rules = await db.query.ProAvailabilityRule.findMany({
    where: (r, { eq, and }) => and(eq(r.structureId, structure.id), eq(r.isActive, true)),
    orderBy: (r, { asc }) => [asc(r.weekday), asc(r.startTime)],
  });

  const appointmentsForDay = await findOverlappingAppointments(db, {
    structureId: structure.id,
    statuses: ACTIVE_APPOINTMENT_STATUSES,
    startBefore: dayEnd,
    endAfter: dayStart,
  });

  const timeOffs = await findOverlappingTimeOffs(db, {
    structureId: structure.id,
    startBefore: dayEnd,
    endAfter: dayStart,
  });

  const busyWindows = [
    ...toBusyWindows(appointmentsForDay),
    ...timeOffs.map((timeOff) => ({ start: timeOff.startAt, end: timeOff.endAt })),
  ];

  const availableSlots = generateSlots({
    rules,
    from: dayStart,
    to: dayEnd,
    durationMinutes: service.durationMinutes,
    bufferBeforeMinutes: service.bufferBeforeMinutes,
    bufferAfterMinutes: service.bufferAfterMinutes,
    busyWindows,
    maxSlots: 600,
  });

  const slotExists = availableSlots.some((slot) => slot.startAt === startAt.toISOString() && slot.endAt === endAt.toISOString());
  if (!slotExists) {
    return res.status(409).json({ error: 'Slot no longer available' });
  }

  try {
    // Optimistic locking: Neon HTTP driver does not support transactions.
    // The unique constraint on (citizenUserId, idempotencyKey) prevents duplicates.

    // 1. Check overlapping appointments
    const overlaps = await db
      .select()
      .from(schema.ProAppointment)
      .where(
        and(
          eq(schema.ProAppointment.structureId, structure.id),
          inArray(schema.ProAppointment.status, ACTIVE_APPOINTMENT_STATUSES),
          lt(schema.ProAppointment.startAt, endAt),
          gt(schema.ProAppointment.endAt, startAt),
        ),
      );

    // Load service buffers for overlap check
    const overlapsWithService = await Promise.all(
      overlaps.map(async (appt) => {
        const svc = appt.serviceId
          ? await db
              .select({
                bufferBeforeMinutes: schema.ProRdvService.bufferBeforeMinutes,
                bufferAfterMinutes: schema.ProRdvService.bufferAfterMinutes,
              })
              .from(schema.ProRdvService)
              .where(eq(schema.ProRdvService.id, appt.serviceId))
              .then((rows) => rows[0] || null)
          : null;
        return { ...appt, service: svc };
      }),
    );

    const overlapBusyWindows = toBusyWindows(overlapsWithService);
    const candidateBusyStart = new Date(startAt.getTime() - service.bufferBeforeMinutes * 60_000);
    const candidateBusyEnd = new Date(endAt.getTime() + service.bufferAfterMinutes * 60_000);
    const hasConflict = overlapBusyWindows.some((window) => candidateBusyStart < window.end && window.start < candidateBusyEnd);

    if (hasConflict) {
      return res.status(409).json({ error: 'Slot no longer available' });
    }

    // 2. Check time-offs
    const [timeOffCount] = await db
      .select({ value: count() })
      .from(schema.ProTimeOff)
      .where(
        and(
          eq(schema.ProTimeOff.structureId, structure.id),
          lt(schema.ProTimeOff.startAt, endAt),
          gt(schema.ProTimeOff.endAt, startAt),
        ),
      );

    if (Number(timeOffCount.value) > 0) {
      return res.status(409).json({ error: 'Slot no longer available' });
    }

    // 3. Insert appointment (unique constraint on citizenUserId+idempotencyKey catches races)
    const [createdAppointment] = await db.insert(schema.ProAppointment).values({
      structureId: structure.id,
      serviceId: service.id,
      startAt,
      endAt,
      status: 'confirmed',
      beneficiaryName: 'Particulier',
      beneficiaryPhone: null,
      notes: null,
      citizenUserId: auth.user.id,
      citizenEmailSnapshot: auth.user.email,
      idempotencyKey,
      visioEnabled: false,
    }).returning();

    // Load full appointment with relations
    const fullAppointment = await loadAppointmentWithRelations(createdAppointment.id);

    try {
      await sendAppointmentConfirmationEmail({
        appointment: fullAppointment || createdAppointment,
        structureName: fullAppointment?.structure?.nom || structure.nom,
        structureSlug: fullAppointment?.structure?.slug || structure.slug,
        serviceName: fullAppointment?.service?.name || service.name,
        toEmail: auth.user.email,
      });
    } catch {
      // Email is best-effort: booking must stay successful even if provider is unavailable.
    }

    const payload = serializeAppointment(fullAppointment || createdAppointment, {
      structureSlug: fullAppointment?.structure?.slug || structure.slug,
    });
    return res.status(201).json(payload);
  } catch (error) {
    // Drizzle wraps pg errors in error.cause
    const pgCode = error?.cause?.code || error?.code;
    if (pgCode === '23505') {
      const existing = await loadAppointmentWithRelations(null, {
        citizenUserId: auth.user.id,
        idempotencyKey,
      });

      if (existing) {
        return res.status(200).json(serializeAppointment(existing));
      }
      return res.status(409).json({ error: 'Slot no longer available' });
    }

    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * @param {import('../_utils/http-types').ApiRequest} req
 * @param {import('../_utils/http-types').ApiResponse} res
 */
async function getAppointment(req, res) {
  const segments = getPathSegments(req);
  const appointmentId = toTrimmedString(segments[1]);
  if (!appointmentId) {
    return res.status(400).json({ error: 'Appointment id is required' });
  }

  const auth = await requireCitizenUser(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.error, ...(auth.code ? { code: auth.code } : {}) });
  }

  const rateLimit = await enforcePublicRdvRateLimit(req, 'read', auth.user.id);
  if (!rateLimit.allowed) {
    return res.status(rateLimit.status).json(rateLimit.error);
  }

  const appointment = await loadAppointmentWithRelations(appointmentId);

  if (!appointment) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  if (appointment.citizenUserId !== auth.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  return res.status(200).json(serializeAppointment(appointment));
}

/**
 * @param {import('../_utils/http-types').ApiRequest} req
 * @param {import('../_utils/http-types').ApiResponse} res
 */
async function cancelAppointment(req, res) {
  const segments = getPathSegments(req);
  const appointmentId = toTrimmedString(segments[1]);
  if (!appointmentId) {
    return res.status(400).json({ error: 'Appointment id is required' });
  }

  const auth = await requireCitizenUser(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.error, ...(auth.code ? { code: auth.code } : {}) });
  }

  const rateLimit = await enforcePublicRdvRateLimit(req, 'write', auth.user.id);
  if (!rateLimit.allowed) {
    return res.status(rateLimit.status).json(rateLimit.error);
  }

  const appointment = await loadAppointmentWithRelations(appointmentId);

  if (!appointment) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  if (appointment.citizenUserId !== auth.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (String(appointment.status || '').toLowerCase() === 'cancelled') {
    return res.status(200).json(serializeAppointment(appointment));
  }

  await db.update(schema.ProAppointment).set({
    status: 'cancelled',
    cancelledAt: new Date(),
    cancelledBy: 'USER',
  }).where(eq(schema.ProAppointment.id, appointment.id));

  // Reload with relations after update
  const updated = await loadAppointmentWithRelations(appointment.id);

  return res.status(200).json(serializeAppointment(updated || appointment));
}

/**
 * @param {import('../_utils/http-types').ApiRequest} req
 * @param {import('../_utils/http-types').ApiResponse} res
 */
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const method = String(req.method || 'GET').toUpperCase();
  const segments = getPathSegments(req);

  try {
    if (method === 'GET' && segments[0] === 'structures' && segments[2] === 'services') {
      return await getServices(req, res);
    }

    if (method === 'GET' && segments[0] === 'structures' && segments[2] === 'slots') {
      return await getSlots(req, res);
    }

    if (method === 'POST' && segments[0] === 'appointments' && segments.length === 1) {
      return await createAppointment(req, res);
    }

    if (method === 'GET' && segments[0] === 'appointments' && segments.length === 2) {
      return await getAppointment(req, res);
    }

    if (method === 'POST' && segments[0] === 'appointments' && segments[2] === 'cancel') {
      return await cancelAppointment(req, res);
    }

    return res.status(404).json({ error: 'Not Found' });
  } catch {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
