// @ts-nocheck
import { Prisma } from '@prisma/client';
import prisma from '../_utils/prisma.js';
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
  const structure = await prisma.structure.findFirst({
    where: {
      slug,
      statut: 'actif',
    },
    select: {
      id: true,
      slug: true,
      nom: true,
      rdvSettings: {
        select: {
          isPublished: true,
          bookingMode: true,
        },
      },
      is_pro_enabled: true,
    },
  });

  if (!structure) return null;

  const isPublished =
    structure.rdvSettings && typeof structure.rdvSettings.isPublished === 'boolean'
      ? structure.rdvSettings.isPublished
      : Boolean(structure.is_pro_enabled);

  return {
    id: structure.id,
    slug: structure.slug,
    nom: structure.nom,
    isPublished,
    bookingMode: structure.rdvSettings?.bookingMode || 'IN_PERSON',
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

  const services = await prisma.proRdvService.findMany({
    where: {
      structureId: structure.id,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      durationMinutes: true,
      bufferBeforeMinutes: true,
      bufferAfterMinutes: true,
    },
    orderBy: {
      name: 'asc',
    },
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

  const service = await prisma.proRdvService.findFirst({
    where: {
      id: serviceId,
      structureId: structure.id,
      isActive: true,
    },
    select: {
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

  const rules = await prisma.proAvailabilityRule.findMany({
    where: {
      structureId: structure.id,
      isActive: true,
    },
    orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
  });

  const appointments = await prisma.proAppointment.findMany({
    where: {
      structureId: structure.id,
      status: {
        in: ACTIVE_APPOINTMENT_STATUSES,
      },
      startAt: { lt: range.to },
      endAt: { gt: range.from },
    },
    include: {
      service: {
        select: {
          bufferBeforeMinutes: true,
          bufferAfterMinutes: true,
        },
      },
    },
  });

  const timeOffs = await prisma.proTimeOff.findMany({
    where: {
      structureId: structure.id,
      startAt: { lt: range.to },
      endAt: { gt: range.from },
    },
    select: {
      startAt: true,
      endAt: true,
    },
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

  const existingByKey = await prisma.proAppointment.findFirst({
    where: {
      citizenUserId: auth.user.id,
      idempotencyKey,
    },
    include: {
      service: {
        select: {
          id: true,
          name: true,
          durationMinutes: true,
        },
      },
      structure: {
        select: {
          id: true,
          slug: true,
          nom: true,
        },
      },
    },
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

  const service = await prisma.proRdvService.findFirst({
    where: {
      id: serviceId,
      structureId: structure.id,
      isActive: true,
    },
    select: {
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

  const rules = await prisma.proAvailabilityRule.findMany({
    where: {
      structureId: structure.id,
      isActive: true,
    },
    orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
  });

  const appointmentsForDay = await prisma.proAppointment.findMany({
    where: {
      structureId: structure.id,
      status: {
        in: ACTIVE_APPOINTMENT_STATUSES,
      },
      startAt: { lt: dayEnd },
      endAt: { gt: dayStart },
    },
    include: {
      service: {
        select: {
          bufferBeforeMinutes: true,
          bufferAfterMinutes: true,
        },
      },
    },
  });

  const timeOffs = await prisma.proTimeOff.findMany({
    where: {
      structureId: structure.id,
      startAt: { lt: dayEnd },
      endAt: { gt: dayStart },
    },
    select: {
      startAt: true,
      endAt: true,
    },
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
    const result = await prisma.$transaction(async (tx) => {
      const overlaps = await tx.proAppointment.findMany({
        where: {
          structureId: structure.id,
          status: { in: ACTIVE_APPOINTMENT_STATUSES },
          startAt: { lt: endAt },
          endAt: { gt: startAt },
        },
        include: {
          service: {
            select: {
              bufferBeforeMinutes: true,
              bufferAfterMinutes: true,
            },
          },
        },
      });

      const overlapBusyWindows = toBusyWindows(overlaps);
      const candidateBusyStart = new Date(startAt.getTime() - service.bufferBeforeMinutes * 60_000);
      const candidateBusyEnd = new Date(endAt.getTime() + service.bufferAfterMinutes * 60_000);
      const hasConflict = overlapBusyWindows.some((window) => candidateBusyStart < window.end && window.start < candidateBusyEnd);

      if (hasConflict) {
        return { created: false, conflict: true, appointment: null };
      }

      const hasTimeOff = await tx.proTimeOff.count({
        where: {
          structureId: structure.id,
          startAt: { lt: endAt },
          endAt: { gt: startAt },
        },
      });

      if (hasTimeOff > 0) {
        return { created: false, conflict: true, appointment: null };
      }

      const createdAppointment = await tx.proAppointment.create({
        data: {
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
        },
        include: {
          service: {
            select: {
              id: true,
              name: true,
              durationMinutes: true,
            },
          },
          structure: {
            select: {
              id: true,
              slug: true,
              nom: true,
            },
          },
        },
      });

      return { created: true, appointment: createdAppointment };
    });

    if (result.conflict || !result.appointment) {
      return res.status(409).json({ error: 'Slot no longer available' });
    }

    if (result.created) {
      try {
        await sendAppointmentConfirmationEmail({
          appointment: result.appointment,
          structureName: result.appointment.structure?.nom || structure.nom,
          structureSlug: result.appointment.structure?.slug || structure.slug,
          serviceName: result.appointment.service?.name || service.name,
          toEmail: auth.user.email,
        });
      } catch {
        // Email is best-effort: booking must stay successful even if provider is unavailable.
      }
    }

    const payload = serializeAppointment(result.appointment, {
      structureSlug: result.appointment.structure?.slug || structure.slug,
    });
    return res.status(result.created ? 201 : 200).json(payload);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const existing = await prisma.proAppointment.findFirst({
        where: {
          citizenUserId: auth.user.id,
          idempotencyKey,
        },
        include: {
          service: {
            select: {
              id: true,
              name: true,
              durationMinutes: true,
            },
          },
          structure: {
            select: {
              id: true,
              slug: true,
              nom: true,
            },
          },
        },
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

  const appointment = await prisma.proAppointment.findUnique({
    where: { id: appointmentId },
    include: {
      service: {
        select: {
          id: true,
          name: true,
          durationMinutes: true,
        },
      },
      structure: {
        select: {
          id: true,
          slug: true,
          nom: true,
        },
      },
    },
  });

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

  const appointment = await prisma.proAppointment.findUnique({
    where: { id: appointmentId },
    include: {
      service: {
        select: {
          id: true,
          name: true,
          durationMinutes: true,
        },
      },
      structure: {
        select: {
          id: true,
          slug: true,
          nom: true,
        },
      },
    },
  });

  if (!appointment) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  if (appointment.citizenUserId !== auth.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (String(appointment.status || '').toLowerCase() === 'cancelled') {
    return res.status(200).json(serializeAppointment(appointment));
  }

  const updated = await prisma.proAppointment.update({
    where: { id: appointment.id },
    data: {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelledBy: 'USER',
    },
    include: {
      service: {
        select: {
          id: true,
          name: true,
          durationMinutes: true,
        },
      },
      structure: {
        select: {
          id: true,
          slug: true,
          nom: true,
        },
      },
    },
  });

  return res.status(200).json(serializeAppointment(updated));
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
