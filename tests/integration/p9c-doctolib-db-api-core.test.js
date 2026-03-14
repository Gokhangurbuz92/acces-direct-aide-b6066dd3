import { vi } from "vitest";
vi.stubEnv("KV_REST_API_URL", "http://localhost");
vi.stubEnv("KV_REST_API_TOKEN", "mock-token");

vi.mock('@vercel/kv', () => {
  const mockKv = {
    get: vi.fn().mockResolvedValue('ok'),
    set: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    incr: vi.fn().mockResolvedValue(1),
  };
  return {
    createClient: vi.fn(() => mockKv),
    kv: mockKv
  };
});

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import apiHandler from '../../api/index.js';
import { db } from '../../src/db/index.js';
import * as schema from '../../src/db/schema.js';
import { eq, sql, inArray } from 'drizzle-orm';
import { signProToken } from '../../api/_utils/auth.js';

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
  // ENFORCE DELETE ORDER TO PREVENT FOREIGN KEY CASCADING CRASHES
  if (createdRuleIds.length > 0) {
    await db.delete(schema.ProAvailabilityRule).where(inArray(schema.ProAvailabilityRule.id, createdRuleIds));
  }
  if (createdAppointmentIds.length > 0) {
    await db.delete(schema.ProAppointment).where(inArray(schema.ProAppointment.id, createdAppointmentIds));
  }
  if (createdServiceIds.length > 0) {
    await db.delete(schema.ProRdvService).where(inArray(schema.ProRdvService.id, createdServiceIds));
  }
  if (createdProUserIds.length > 0) {
    await db.delete(schema.ProUser).where(inArray(schema.ProUser.id, createdProUserIds));
  }
  if (createdStructureIds.length > 0) {
    await db.delete(schema.Structure).where(inArray(schema.Structure.id, createdStructureIds));
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
  const structureA = await (await db.insert(schema.Structure).values({
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
  ).returning())[0];
  const structureB = await (await db.insert(schema.Structure).values({
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
  ).returning())[0];

  const proUserA = await (await db.insert(schema.ProUser).values({
      email: `p9c-a-${suffix}@test.local`,
      password_hash: 'hashed',
      role: 'STRUCTURE_ADMIN',
      status: 'active',
      structureId: structureA.id,
    },
  ).returning())[0];

  const serviceB = await (await db.insert(schema.ProRdvService).values({
      structureId: structureB.id,
      name: 'Service B',
      durationMinutes: 30,
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 0,
      isActive: true,
    },
  ).returning())[0];

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

    console.log('[DEBUG-P9C] START serviceCreate');
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
    console.log('[DEBUG-P9C] DONE serviceCreate');
    expect(serviceCreate.statusCode).toBe(201);
    const serviceId = serviceCreate.body.id;
    createdServiceIds.push(serviceId);

    console.log('[DEBUG-P9C] START listServices');
    const listServices = await invokeApi('/api/pro/services', {
      headers: { authorization: `Bearer ${token}` },
    });
    console.log('[DEBUG-P9C] DONE listServices');
    expect(listServices.statusCode).toBe(200);
    expect(listServices.body.some((service) => service.id === serviceId)).toBe(true);

    console.log('[DEBUG-P9C] START setAvailability');
    const setAvailability = await invokeApi('/api/pro/availability', {
      method: 'PUT',
      headers: { authorization: `Bearer ${token}` },
      body: {
        rules: [{ weekday: 1, startTime: '09:00', endTime: '12:00', timezone: 'Europe/Paris' }],
      },
    });
    console.log('[DEBUG-P9C] DONE setAvailability');
    expect(setAvailability.statusCode).toBe(200);

    const dbRules = await db.query.ProAvailabilityRule.findMany({
      where: eq(schema.ProAvailabilityRule.structureId, fixture.structureA.id),
      columns: { id: true },
    });
    createdRuleIds.push(...dbRules.map((rule) => rule.id));

    console.log('[DEBUG-P9C] START slotsRes');
    const slotsRes = await invokeApi(
      `/api/pro/slots?serviceId=${serviceId}&from=2026-03-02T00:00:00.000Z&to=2026-03-02T23:59:59.000Z`,
      {
        headers: { authorization: `Bearer ${token}` },
      },
    );
    console.log('[DEBUG-P9C] DONE slotsRes');
    expect(slotsRes.statusCode).toBe(200);
    expect(Array.isArray(slotsRes.body.slots)).toBe(true);
    expect(slotsRes.body.slots.length).toBeGreaterThan(0);

    console.log('[DEBUG-P9C] START appointmentCreate');
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
    console.log('[DEBUG-P9C] DONE appointmentCreate');
    expect(appointmentCreate.statusCode).toBe(201);
    const appointmentId = appointmentCreate.body.item.id;
    createdAppointmentIds.push(appointmentId);

    console.log('[DEBUG-P9C] START appointmentsList');
    const appointmentsList = await invokeApi(
      '/api/pro/appointments?from=2026-03-02T00:00:00.000Z&to=2026-03-03T00:00:00.000Z',
      {
        headers: { authorization: `Bearer ${token}` },
      },
    );
    console.log('[DEBUG-P9C] DONE appointmentsList');
    expect(appointmentsList.statusCode).toBe(200);
    expect(appointmentsList.body.items.some((item) => item.id === appointmentId)).toBe(true);

    console.log('[DEBUG-P9C] START markDone');
    const markDone = await invokeApi('/api/pro/appointments', {
      method: 'PATCH',
      headers: { authorization: `Bearer ${token}` },
      body: { id: appointmentId, status: 'done' },
    });
    console.log('[DEBUG-P9C] DONE markDone');
    expect(markDone.statusCode).toBe(200);
    expect(markDone.body.item.status).toBe('done');

    console.log('[DEBUG-P9C] START cancelLegacy');
    const cancelLegacy = await invokeApi('/api/pro/appointments/cancel', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: { id: appointmentId },
    });
    console.log('[DEBUG-P9C] DONE cancelLegacy');
    expect(cancelLegacy.statusCode).toBe(200);
    expect(cancelLegacy.body.item.status).toBe('cancelled');
  }, 20000);

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
