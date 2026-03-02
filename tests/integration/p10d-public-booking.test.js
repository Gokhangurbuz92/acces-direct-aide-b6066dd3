import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import apiHandler from '../../api/index.js';
import prisma from '../../api/_utils/prisma.js';
import { __clearTestOutbox, __getTestOutbox } from '../../api/_utils/mailer.js';
import { buildUserSessionCookie, signUserSessionToken } from '../../api/_utils/user-auth.js';

/**
 * @param {{
 *   method?: string,
 *   url?: string,
 *   headers?: Record<string, string>,
 *   query?: Record<string, any>,
 *   body?: unknown,
 * }} overrides
 */
function createReq(overrides = {}) {
  return {
    method: overrides.method || 'GET',
    url: overrides.url || '/api/rdv',
    headers: {
      host: 'localhost:3000',
      'x-forwarded-proto': 'http',
      ...(overrides.headers || {}),
    },
    query: overrides.query || {},
    body: overrides.body || null,
    cookies: {},
  };
}

function createRes() {
  /** @type {Record<string, string>} */
  const headers = {};
  /** @type {Array<() => void>} */
  const finishListeners = [];

  return {
    statusCode: 200,
    body: null,
    headersSent: false,
    on(event, listener) {
      if (event === 'finish' && typeof listener === 'function') finishListeners.push(listener);
      return this;
    },
    setHeader(key, value) {
      headers[String(key).toLowerCase()] = String(value);
      return this;
    },
    getHeader(key) {
      return headers[String(key).toLowerCase()];
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    writeHead(code, outHeaders = {}) {
      this.statusCode = code;
      for (const [key, value] of Object.entries(outHeaders)) {
        headers[String(key).toLowerCase()] = String(value);
      }
      return this;
    },
    json(payload) {
      this.body = payload;
      this.headersSent = true;
      for (const listener of finishListeners) listener();
      return this;
    },
    send(payload) {
      this.body = payload;
      this.headersSent = true;
      for (const listener of finishListeners) listener();
      return this;
    },
    end(payload) {
      if (typeof payload !== 'undefined') this.body = payload;
      this.headersSent = true;
      for (const listener of finishListeners) listener();
      return this;
    },
  };
}

let ipCounter = 20;
function nextIp() {
  ipCounter += 1;
  return `10.20.0.${ipCounter}`;
}

/**
 * Find the next Monday that is at least 2 days in the future.
 * Returns an ISO date string like '2026-03-09'.
 */
function getNextMondayDate() {
  const now = new Date();
  // Start from 3 days ahead to be safely in the future
  const base = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const dayOfWeek = base.getUTCDay(); // 0=Sun … 6=Sat
  const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
  const monday = new Date(base.getTime() + daysUntilMonday * 24 * 60 * 60 * 1000);
  return monday.toISOString().slice(0, 10);
}

/**
 * @param {string} url
 * @param {{
 *   method?: string,
 *   headers?: Record<string, string>,
 *   query?: Record<string, any>,
 *   body?: unknown,
 * }} options
 */
async function invokeApi(url, options = {}) {
  const parsedUrl = new URL(url, 'http://localhost');
  const queryFromUrl = Object.fromEntries(parsedUrl.searchParams.entries());
  const req = createReq({
    method: options.method,
    url,
    headers: {
      'x-forwarded-for': nextIp(),
      ...(options.headers || {}),
    },
    query: { ...queryFromUrl, ...(options.query || {}) },
    body: options.body,
  });
  const res = createRes();
  await apiHandler(req, res);
  return res;
}

/** @type {string[]} */
let createdStructureIds = [];
/** @type {string[]} */
let createdServiceIds = [];
/** @type {string[]} */
let createdRuleIds = [];
/** @type {string[]} */
let createdTimeOffIds = [];
/** @type {string[]} */
let createdAppointmentIds = [];
/** @type {string[]} */
let createdUserIds = [];
/** @type {string[]} */
let createdSettingsIds = [];

const originalEnv = {
  jwtSecret: process.env.JWT_SECRET,
  mailerProvider: process.env.MAILER_PROVIDER,
  mailerFrom: process.env.MAILER_FROM,
};

beforeEach(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'p10d-test-jwt-secret';
  process.env.MAILER_PROVIDER = 'test';
  process.env.MAILER_FROM = 'noreply@test.local';
  __clearTestOutbox();
});

afterEach(async () => {
  if (createdAppointmentIds.length > 0) {
    await prisma.proAppointment.deleteMany({ where: { id: { in: createdAppointmentIds } } });
  }
  if (createdTimeOffIds.length > 0) {
    await prisma.proTimeOff.deleteMany({ where: { id: { in: createdTimeOffIds } } });
  }
  if (createdRuleIds.length > 0) {
    await prisma.proAvailabilityRule.deleteMany({ where: { id: { in: createdRuleIds } } });
  }
  if (createdServiceIds.length > 0) {
    await prisma.proRdvService.deleteMany({ where: { id: { in: createdServiceIds } } });
  }
  if (createdSettingsIds.length > 0) {
    await prisma.structureRdvSettings.deleteMany({ where: { id: { in: createdSettingsIds } } });
  }
  if (createdUserIds.length > 0) {
    await prisma.citizenUser.deleteMany({ where: { id: { in: createdUserIds } } });
  }
  if (createdStructureIds.length > 0) {
    await prisma.structure.deleteMany({ where: { id: { in: createdStructureIds } } });
  }

  createdAppointmentIds = [];
  createdTimeOffIds = [];
  createdRuleIds = [];
  createdServiceIds = [];
  createdSettingsIds = [];
  createdUserIds = [];
  createdStructureIds = [];

  process.env.JWT_SECRET = originalEnv.jwtSecret;
  process.env.MAILER_PROVIDER = originalEnv.mailerProvider;
  process.env.MAILER_FROM = originalEnv.mailerFrom;

  __clearTestOutbox();
});

async function createPublicBookingFixture() {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const testDate = getNextMondayDate();

  const structure = await prisma.structure.create({
    data: {
      nom: `P10D Structure ${suffix}`,
      slug: `p10d-structure-${suffix}`,
      statut: 'actif',
      services: [],
      publics_accueillis: [],
      categories_aidees: [],
      mots_cles: [],
      region_codes: [],
      department_codes: [],
      insee_codes: [],
      is_pro_enabled: true,
    },
  });
  createdStructureIds.push(structure.id);

  const settings = await prisma.structureRdvSettings.create({
    data: {
      structureId: structure.id,
      isPublished: true,
      bookingMode: 'IN_PERSON',
      publishedAt: new Date(),
    },
  });
  createdSettingsIds.push(settings.id);

  const service = await prisma.proRdvService.create({
    data: {
      structureId: structure.id,
      name: 'Accompagnement social',
      durationMinutes: 30,
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 0,
      isActive: true,
    },
  });
  createdServiceIds.push(service.id);

  const rule = await prisma.proAvailabilityRule.create({
    data: {
      structureId: structure.id,
      weekday: 1,
      startTime: '09:00',
      endTime: '11:00',
      timezone: 'Europe/Paris',
      isActive: true,
    },
  });
  createdRuleIds.push(rule.id);

  const busy = await prisma.proAppointment.create({
    data: {
      structureId: structure.id,
      serviceId: service.id,
      startAt: new Date(`${testDate}T09:30:00.000Z`),
      endAt: new Date(`${testDate}T10:00:00.000Z`),
      status: 'confirmed',
      beneficiaryName: 'Occuped Slot',
    },
  });
  createdAppointmentIds.push(busy.id);

  const timeOff = await prisma.proTimeOff.create({
    data: {
      structureId: structure.id,
      startAt: new Date(`${testDate}T10:30:00.000Z`),
      endAt: new Date(`${testDate}T11:00:00.000Z`),
      reason: 'Fermeture',
    },
  });
  createdTimeOffIds.push(timeOff.id);

  const citizen = await prisma.citizenUser.create({
    data: {
      email: `citizen-${suffix}@test.local`,
      passwordHash: 'hash',
      emailVerifiedAt: new Date(),
    },
  });
  createdUserIds.push(citizen.id);

  const unverifiedCitizen = await prisma.citizenUser.create({
    data: {
      email: `unverified-${suffix}@test.local`,
      passwordHash: 'hash',
      emailVerifiedAt: null,
    },
  });
  createdUserIds.push(unverifiedCitizen.id);

  return {
    structure,
    service,
    citizen,
    unverifiedCitizen,
    testDate,
  };
}

function buildUserCookie(user) {
  const token = signUserSessionToken({
    userId: user.id,
    email: user.email,
  });
  return buildUserSessionCookie(token).split(';')[0] || '';
}

describe('P10-D public booking flow', () => {
  it('requires USER auth for public rdv services and returns active services when authenticated', async () => {
    const fixture = await createPublicBookingFixture();

    const unauthorized = await invokeApi(`/api/rdv/structures/${fixture.structure.slug}/services`);
    expect(unauthorized.statusCode).toBe(401);

    const authCookie = buildUserCookie(fixture.citizen);
    const ok = await invokeApi(`/api/rdv/structures/${fixture.structure.slug}/services`, {
      headers: { cookie: authCookie },
    });

    expect(ok.statusCode).toBe(200);
    expect(Array.isArray(ok.body.items)).toBe(true);
    expect(ok.body.items.length).toBe(1);
    expect(ok.body.items[0]).toMatchObject({
      id: fixture.service.id,
      name: fixture.service.name,
      durationMinutes: 30,
    });
  });

  it('computes slots with availability minus appointments and timeoff', async () => {
    const fixture = await createPublicBookingFixture();
    const authCookie = buildUserCookie(fixture.citizen);

    const res = await invokeApi(
      `/api/rdv/structures/${fixture.structure.slug}/slots?serviceId=${fixture.service.id}&from=${fixture.testDate}&to=${fixture.testDate}`,
      {
        headers: { cookie: authCookie },
      },
    );

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.slots)).toBe(true);
    const starts = res.body.slots.map((slot) => slot.startAt);
    expect(starts).toContain(`${fixture.testDate}T09:00:00.000Z`);
    expect(starts).toContain(`${fixture.testDate}T10:00:00.000Z`);
    expect(starts).not.toContain(`${fixture.testDate}T09:30:00.000Z`);
    expect(starts).not.toContain(`${fixture.testDate}T10:30:00.000Z`);
  });

  it('creates appointment idempotently, sends confirmation email with ICS, and enforces owner-only get/cancel', async () => {
    const fixture = await createPublicBookingFixture();
    const authCookie = buildUserCookie(fixture.citizen);

    const createRes = await invokeApi('/api/rdv/appointments', {
      method: 'POST',
      headers: { cookie: authCookie },
      body: {
        structureSlug: fixture.structure.slug,
        serviceId: fixture.service.id,
        startAt: `${fixture.testDate}T09:00:00.000Z`,
        idempotencyKey: 'idem-key-1',
      },
    });

    expect(createRes.statusCode).toBe(201);
    expect(createRes.body).toMatchObject({
      status: 'CONFIRMED',
      service: { id: fixture.service.id },
      structure: { slug: fixture.structure.slug },
    });

    const createdId = createRes.body.id;
    createdAppointmentIds.push(createdId);

    const createReplay = await invokeApi('/api/rdv/appointments', {
      method: 'POST',
      headers: { cookie: authCookie },
      body: {
        structureSlug: fixture.structure.slug,
        serviceId: fixture.service.id,
        startAt: `${fixture.testDate}T09:00:00.000Z`,
        idempotencyKey: 'idem-key-1',
      },
    });

    expect(createReplay.statusCode).toBe(200);
    expect(createReplay.body.id).toBe(createdId);

    const outbox = __getTestOutbox();
    expect(outbox.length).toBe(1);
    expect(outbox[0].subject).toContain('Confirmation de votre rendez-vous');
    expect(Array.isArray(outbox[0].attachments)).toBe(true);
    expect(outbox[0].attachments[0]?.contentType).toContain('text/calendar');
    expect(String(outbox[0].attachments[0]?.content || '')).toContain('BEGIN:VCALENDAR');

    const otherUser = await prisma.citizenUser.create({
      data: {
        email: `owner-other-${Date.now()}@test.local`,
        passwordHash: 'hash',
        emailVerifiedAt: new Date(),
      },
    });
    createdUserIds.push(otherUser.id);

    const otherCookie = buildUserCookie(otherUser);

    const forbiddenRead = await invokeApi(`/api/rdv/appointments/${createdId}`, {
      headers: { cookie: otherCookie },
    });
    expect(forbiddenRead.statusCode).toBe(403);

    const ownerRead = await invokeApi(`/api/rdv/appointments/${createdId}`, {
      headers: { cookie: authCookie },
    });
    expect(ownerRead.statusCode).toBe(200);
    expect(ownerRead.body.id).toBe(createdId);

    const cancelRes = await invokeApi(`/api/rdv/appointments/${createdId}/cancel`, {
      method: 'POST',
      headers: { cookie: authCookie },
    });
    expect(cancelRes.statusCode).toBe(200);
    expect(cancelRes.body.status).toBe('CANCELLED');

    const cancelReplay = await invokeApi(`/api/rdv/appointments/${createdId}/cancel`, {
      method: 'POST',
      headers: { cookie: authCookie },
    });
    expect(cancelReplay.statusCode).toBe(200);
    expect(cancelReplay.body.status).toBe('CANCELLED');
  });

  it('rejects appointment creation when USER email is not verified', async () => {
    const fixture = await createPublicBookingFixture();
    const unverifiedCookie = buildUserCookie(fixture.unverifiedCitizen);

    const res = await invokeApi('/api/rdv/appointments', {
      method: 'POST',
      headers: { cookie: unverifiedCookie },
      body: {
        structureSlug: fixture.structure.slug,
        serviceId: fixture.service.id,
        startAt: `${fixture.testDate}T09:00:00.000Z`,
        idempotencyKey: 'idem-key-unverified',
      },
    });

    expect(res.statusCode).toBe(403);
    expect(res.body).toMatchObject({
      code: 'EMAIL_NOT_VERIFIED',
    });
  });
});
