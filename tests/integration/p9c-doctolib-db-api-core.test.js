import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import apiHandler from '../../api/index.js';
import prisma from '../../api/_utils/prisma.js';
import { signProToken } from '../../api/lib/pro-auth.js';

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
    url: overrides.url || '/api/pro/me',
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
    headers: options.headers,
    query: { ...queryFromUrl, ...(options.query || {}) },
    body: options.body,
  });
  const res = createRes();
  await apiHandler(req, res);
  return res;
}

const originalJwtSecret = process.env.JWT_SECRET;
const originalAdminToken = process.env.ADMIN_TOKEN;

/** @type {string[]} */
let createdStructureIds = [];
/** @type {string[]} */
let createdProUserIds = [];
/** @type {string[]} */
let createdServiceIds = [];
/** @type {string[]} */
let createdAppointmentIds = [];
/** @type {string[]} */
let createdRuleIds = [];

beforeEach(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'p9c-test-jwt-secret';
  process.env.ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'p9c-test-admin-token';
});

afterEach(async () => {
  if (createdAppointmentIds.length > 0) {
    await prisma.proAppointment.deleteMany({ where: { id: { in: createdAppointmentIds } } });
  }
  if (createdRuleIds.length > 0) {
    await prisma.proAvailabilityRule.deleteMany({ where: { id: { in: createdRuleIds } } });
  }
  if (createdServiceIds.length > 0) {
    await prisma.proRdvService.deleteMany({ where: { id: { in: createdServiceIds } } });
  }
  if (createdProUserIds.length > 0) {
    await prisma.proUser.deleteMany({ where: { id: { in: createdProUserIds } } });
  }
  if (createdStructureIds.length > 0) {
    await prisma.structure.deleteMany({ where: { id: { in: createdStructureIds } } });
  }

  createdAppointmentIds = [];
  createdRuleIds = [];
  createdServiceIds = [];
  createdProUserIds = [];
  createdStructureIds = [];

  process.env.JWT_SECRET = originalJwtSecret;
  process.env.ADMIN_TOKEN = originalAdminToken;
});

async function createTenantFixture() {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const structureA = await prisma.structure.create({
    data: {
      nom: `P9C Structure A ${suffix}`,
      slug: `p9c-structure-a-${suffix}`,
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
  const structureB = await prisma.structure.create({
    data: {
      nom: `P9C Structure B ${suffix}`,
      slug: `p9c-structure-b-${suffix}`,
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

  const proUserA = await prisma.proUser.create({
    data: {
      email: `p9c-a-${suffix}@test.local`,
      password_hash: 'hashed',
      role: 'STRUCTURE_ADMIN',
      status: 'active',
      structureId: structureA.id,
    },
  });

  const serviceB = await prisma.proRdvService.create({
    data: {
      structureId: structureB.id,
      name: 'Service B',
      durationMinutes: 30,
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 0,
      isActive: true,
    },
  });

  createdStructureIds.push(structureA.id, structureB.id);
  createdProUserIds.push(proUserA.id);
  createdServiceIds.push(serviceB.id);

  return { structureA, structureB, proUserA, serviceB };
}

describe('P9-C doctolib social DB + pro API core', () => {
  it('enforces pro-only auth on /api/pro/services', async () => {
    const noAuth = await invokeApi('/api/pro/services');
    expect(noAuth.statusCode).toBe(401);

    const adminAuth = await invokeApi('/api/pro/services', {
      headers: { authorization: `Bearer ${process.env.ADMIN_TOKEN}` },
    });
    expect(adminAuth.statusCode).toBe(401);
  });

  it('supports services, availability, slots and appointments flow for same structure', async () => {
    const fixture = await createTenantFixture();
    const token = signProToken({
      id: fixture.proUserA.id,
      email: fixture.proUserA.email,
      structureId: fixture.structureA.id,
      role: fixture.proUserA.role,
    });

    const serviceCreate = await invokeApi('/api/pro/services', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: {
        name: 'Accompagnement droits',
        durationMinutes: 30,
        bufferBeforeMinutes: 10,
        bufferAfterMinutes: 5,
      },
    });
    expect(serviceCreate.statusCode).toBe(201);
    const serviceId = serviceCreate.body.id;
    createdServiceIds.push(serviceId);

    const listServices = await invokeApi('/api/pro/services', {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(listServices.statusCode).toBe(200);
    expect(listServices.body.some((service) => service.id === serviceId)).toBe(true);

    const setAvailability = await invokeApi('/api/pro/availability', {
      method: 'PUT',
      headers: { authorization: `Bearer ${token}` },
      body: {
        rules: [{ weekday: 1, startTime: '09:00', endTime: '12:00', timezone: 'Europe/Paris' }],
      },
    });
    expect(setAvailability.statusCode).toBe(200);

    const dbRules = await prisma.proAvailabilityRule.findMany({
      where: { structureId: fixture.structureA.id },
      select: { id: true },
    });
    createdRuleIds.push(...dbRules.map((rule) => rule.id));

    const slotsRes = await invokeApi(
      `/api/pro/slots?serviceId=${serviceId}&from=2026-03-02T00:00:00.000Z&to=2026-03-02T23:59:59.000Z`,
      {
        headers: { authorization: `Bearer ${token}` },
      },
    );
    expect(slotsRes.statusCode).toBe(200);
    expect(Array.isArray(slotsRes.body.slots)).toBe(true);
    expect(slotsRes.body.slots.length).toBeGreaterThan(0);

    const appointmentCreate = await invokeApi('/api/pro/appointments', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: {
        serviceId,
        startAt: slotsRes.body.slots[0].startAt,
        beneficiaryName: 'Test Beneficiary',
        beneficiaryPhone: '0612345678',
        notes: 'Test note',
      },
    });
    expect(appointmentCreate.statusCode).toBe(201);
    const appointmentId = appointmentCreate.body.item.id;
    createdAppointmentIds.push(appointmentId);

    const appointmentsList = await invokeApi(
      '/api/pro/appointments?from=2026-03-02T00:00:00.000Z&to=2026-03-03T00:00:00.000Z',
      {
        headers: { authorization: `Bearer ${token}` },
      },
    );
    expect(appointmentsList.statusCode).toBe(200);
    expect(appointmentsList.body.items.some((item) => item.id === appointmentId)).toBe(true);

    const markDone = await invokeApi('/api/pro/appointments', {
      method: 'PATCH',
      headers: { authorization: `Bearer ${token}` },
      body: { id: appointmentId, status: 'done' },
    });
    expect(markDone.statusCode).toBe(200);
    expect(markDone.body.item.status).toBe('done');

    const cancelLegacy = await invokeApi('/api/pro/appointments/cancel', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: { id: appointmentId },
    });
    expect(cancelLegacy.statusCode).toBe(200);
    expect(cancelLegacy.body.item.status).toBe('cancelled');
  });

  it('enforces tenancy: service from another structure cannot be booked', async () => {
    const fixture = await createTenantFixture();
    const token = signProToken({
      id: fixture.proUserA.id,
      email: fixture.proUserA.email,
      structureId: fixture.structureA.id,
      role: fixture.proUserA.role,
    });

    const res = await invokeApi('/api/pro/appointments', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: {
        serviceId: fixture.serviceB.id,
        startAt: '2026-03-02T09:00:00.000Z',
        beneficiaryName: 'Cross Tenant',
      },
    });

    expect(res.statusCode).toBe(403);
  });
});
