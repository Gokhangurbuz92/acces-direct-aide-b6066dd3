const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_RANGE_DAYS = 31;
const MAX_SLOTS = 1000;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const WEEKDAY_TO_KEY = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
/** @type {Record<string, number>} */
const KEY_TO_WEEKDAY = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

export const ACTIVE_APPOINTMENT_STATUSES = ['booked', 'requested', 'confirmed', 'locked'];

/**
 * @param {unknown} value
 * @returns {number}
 */
function toInt(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.trunc(n);
}

/**
 * @param {string} value
 * @returns {{ hours: number, minutes: number }}
 */
export function parseTimeOfDay(value) {
  const normalized = String(value || '').trim();
  const match = TIME_PATTERN.exec(normalized);
  if (!match) {
    throw new Error(`Invalid time format: ${normalized || 'empty'}`);
  }

  return {
    hours: Number(match[1]),
    minutes: Number(match[2]),
  };
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isValidWeekday(value) {
  const weekday = toInt(value);
  return weekday >= 0 && weekday <= 6;
}

/**
 * @param {Date} date
 * @returns {Date}
 */
export function toUtcDayStart(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
}

/**
 * @param {Date} dayStart
 * @param {string} time
 * @returns {Date}
 */
export function toUtcDateAtTime(dayStart, time) {
  const { hours, minutes } = parseTimeOfDay(time);
  return new Date(
    Date.UTC(
      dayStart.getUTCFullYear(),
      dayStart.getUTCMonth(),
      dayStart.getUTCDate(),
      hours,
      minutes,
      0,
      0,
    ),
  );
}

/**
 * @param {unknown} fromValue
 * @param {unknown} toValue
 * @param {number} [maxRangeDays]
 * @returns {{ from: Date, to: Date }}
 */
export function validateDateRange(fromValue, toValue, maxRangeDays = MAX_RANGE_DAYS) {
  const from = new Date(String(fromValue || ''));
  const to = new Date(String(toValue || ''));

  if (!fromValue || Number.isNaN(from.getTime())) {
    throw new Error('Invalid "from" date');
  }
  if (!toValue || Number.isNaN(to.getTime())) {
    throw new Error('Invalid "to" date');
  }
  if (to < from) {
    throw new Error('"to" must be greater than or equal to "from"');
  }

  const rangeDays = Math.ceil((to.getTime() - from.getTime()) / DAY_MS);
  if (rangeDays > maxRangeDays) {
    throw new Error(`Range too large (max ${maxRangeDays} days)`);
  }

  return { from, to };
}

/**
 * @param {unknown} rawRules
 * @returns {Array<{ weekday: number, startTime: string, endTime: string, timezone: string, isActive: boolean }>}
 */
export function normalizeAvailabilityRules(rawRules) {
  if (!Array.isArray(rawRules)) return [];

  /** @type {Array<{ weekday: number, startTime: string, endTime: string, timezone: string, isActive: boolean }>} */
  const normalized = [];

  for (const rule of rawRules) {
    const weekday = toInt(/** @type {any} */ (rule)?.weekday);
    if (!isValidWeekday(weekday)) continue;

    const startTime = String(/** @type {any} */ (rule)?.startTime || '').trim();
    const endTime = String(/** @type {any} */ (rule)?.endTime || '').trim();
    if (!startTime || !endTime) continue;

    const start = parseTimeOfDay(startTime);
    const end = parseTimeOfDay(endTime);
    if (end.hours * 60 + end.minutes <= start.hours * 60 + start.minutes) continue;

    const isActive = Boolean(/** @type {any} */ (rule)?.isActive ?? true);
    if (!isActive) continue;

    normalized.push({
      weekday,
      startTime,
      endTime,
      timezone: String(/** @type {any} */ (rule)?.timezone || 'Europe/Paris'),
      isActive,
    });
  }

  normalized.sort((a, b) => (a.weekday - b.weekday) || a.startTime.localeCompare(b.startTime));
  return normalized;
}

/**
 * @param {Date} aStart
 * @param {Date} aEnd
 * @param {Date} bStart
 * @param {Date} bEnd
 * @returns {boolean}
 */
export function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * @param {Array<{ startAt: Date, endAt: Date, service?: { bufferBeforeMinutes?: number | null, bufferAfterMinutes?: number | null } | null }>} appointments
 * @returns {Array<{ start: Date, end: Date }>}
 */
export function toBusyWindows(appointments) {
  if (!Array.isArray(appointments) || appointments.length === 0) return [];

  /** @type {Array<{ start: Date, end: Date }>} */
  const windows = [];
  for (const appointment of appointments) {
    if (!(appointment?.startAt instanceof Date) || !(appointment?.endAt instanceof Date)) continue;

    const before = Math.max(0, toInt(appointment?.service?.bufferBeforeMinutes ?? 0));
    const after = Math.max(0, toInt(appointment?.service?.bufferAfterMinutes ?? 0));

    windows.push({
      start: new Date(appointment.startAt.getTime() - before * 60_000),
      end: new Date(appointment.endAt.getTime() + after * 60_000),
    });
  }
  return windows;
}

/**
 * @param {{
 *   rules: Array<{ weekday: number, startTime: string, endTime: string, timezone?: string, isActive?: boolean }>,
 *   from: Date,
 *   to: Date,
 *   durationMinutes: number,
 *   bufferBeforeMinutes?: number,
 *   bufferAfterMinutes?: number,
 *   busyWindows?: Array<{ start: Date, end: Date }>,
 *   maxSlots?: number
 * }} options
 * @returns {Array<{ startAt: string, endAt: string }>}
 */
export function generateSlots(options) {
  const rules = normalizeAvailabilityRules(options.rules);
  const durationMinutes = Math.max(5, toInt(options.durationMinutes));
  const bufferBeforeMinutes = Math.max(0, toInt(options.bufferBeforeMinutes ?? 0));
  const bufferAfterMinutes = Math.max(0, toInt(options.bufferAfterMinutes ?? 0));
  const busyWindows = Array.isArray(options.busyWindows) ? options.busyWindows : [];
  const maxSlots = Math.max(1, toInt(options.maxSlots ?? MAX_SLOTS));

  if (!(options.from instanceof Date) || Number.isNaN(options.from.getTime())) return [];
  if (!(options.to instanceof Date) || Number.isNaN(options.to.getTime())) return [];
  if (options.to < options.from) return [];

  const slots = [];
  const from = options.from;
  const to = options.to;

  for (
    let day = toUtcDayStart(from);
    day.getTime() <= to.getTime();
    day = new Date(day.getTime() + DAY_MS)
  ) {
    const weekday = day.getUTCDay();
    const dayRules = rules.filter((rule) => rule.weekday === weekday);

    for (const rule of dayRules) {
      const windowStart = toUtcDateAtTime(day, rule.startTime);
      const windowEnd = toUtcDateAtTime(day, rule.endTime);

      if (windowEnd <= from || windowStart >= to) continue;

      let cursor = new Date(windowStart);
      while (cursor < windowEnd) {
        const slotStart = new Date(cursor);
        const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60_000);

        if (slotEnd > windowEnd || slotStart < from || slotEnd > to) {
          cursor = new Date(cursor.getTime() + durationMinutes * 60_000);
          continue;
        }

        const candidateBusyStart = new Date(slotStart.getTime() - bufferBeforeMinutes * 60_000);
        const candidateBusyEnd = new Date(slotEnd.getTime() + bufferAfterMinutes * 60_000);
        const hasCollision = busyWindows.some((window) =>
          overlaps(candidateBusyStart, candidateBusyEnd, window.start, window.end),
        );

        if (!hasCollision) {
          slots.push({
            startAt: slotStart.toISOString(),
            endAt: slotEnd.toISOString(),
          });
          if (slots.length >= maxSlots) {
            return slots;
          }
        }

        cursor = new Date(cursor.getTime() + durationMinutes * 60_000);
      }
    }
  }

  return slots;
}

/**
 * @param {{ rules: Array<{ weekday: number, startTime: string, endTime: string, isActive?: boolean }>, startAt: Date, endAt: Date }} options
 * @returns {boolean}
 */
export function isSlotWithinRules(options) {
  if (!(options.startAt instanceof Date) || !(options.endAt instanceof Date)) return false;
  if (options.endAt <= options.startAt) return false;

  const rules = normalizeAvailabilityRules(options.rules);
  const weekday = options.startAt.getUTCDay();
  const dayStart = toUtcDayStart(options.startAt);
  const dayRules = rules.filter((rule) => rule.weekday === weekday);
  if (dayRules.length === 0) return false;

  return dayRules.some((rule) => {
    const windowStart = toUtcDateAtTime(dayStart, rule.startTime);
    const windowEnd = toUtcDateAtTime(dayStart, rule.endTime);
    return options.startAt >= windowStart && options.endAt <= windowEnd;
  });
}

/**
 * @param {string} dayKey
 * @returns {number | null}
 */
export function dayKeyToWeekday(dayKey) {
  const normalized = String(dayKey || '').toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(KEY_TO_WEEKDAY, normalized)) return null;
  return KEY_TO_WEEKDAY[normalized];
}

/**
 * @param {number} weekday
 * @returns {string}
 */
export function weekdayToDayKey(weekday) {
  const index = toInt(weekday);
  return WEEKDAY_TO_KEY[index] || 'mon';
}

/**
 * @param {Record<string, unknown>} slotsJson
 * @param {string} [timezone]
 * @returns {Array<{ weekday: number, startTime: string, endTime: string, timezone: string, isActive: boolean }>}
 */
export function slotsJsonToRules(slotsJson, timezone = 'Europe/Paris') {
  if (!slotsJson || typeof slotsJson !== 'object') return [];

  /** @type {Array<{ weekday: number, startTime: string, endTime: string, timezone: string, isActive: boolean }>} */
  const rules = [];

  for (const [dayKey, rawRanges] of Object.entries(slotsJson)) {
    const weekday = dayKeyToWeekday(dayKey);
    if (weekday === null || !Array.isArray(rawRanges)) continue;

    for (const rawRange of rawRanges) {
      const range = String(rawRange || '').trim();
      if (!range) continue;

      const [startTime, endTime] = range.split('-').map((part) => String(part || '').trim());
      if (!startTime || !endTime) continue;

      try {
        const start = parseTimeOfDay(startTime);
        const end = parseTimeOfDay(endTime);
        if (end.hours * 60 + end.minutes <= start.hours * 60 + start.minutes) continue;
      } catch {
        continue;
      }

      rules.push({
        weekday,
        startTime,
        endTime,
        timezone,
        isActive: true,
      });
    }
  }

  return normalizeAvailabilityRules(rules);
}

/**
 * @param {Array<{ weekday: number, startTime: string, endTime: string, isActive?: boolean }>} rules
 * @returns {Record<string, string[]>}
 */
export function rulesToSlotsJson(rules) {
  /** @type {Record<string, string[]>} */
  const output = {
    mon: [],
    tue: [],
    wed: [],
    thu: [],
    fri: [],
    sat: [],
    sun: [],
  };

  for (const rule of normalizeAvailabilityRules(rules)) {
    const key = weekdayToDayKey(rule.weekday);
    output[key].push(`${rule.startTime}-${rule.endTime}`);
  }

  return output;
}
