import { vi } from "vitest";
vi.stubEnv("KV_REST_API_URL", "http://localhost");
vi.stubEnv("KV_REST_API_TOKEN", "mock-token");

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import apiHandler from '../../api/index.js';
import proServicesHandler from '../../api/_handlers/pro/services.js';
import { db } from '../../src/db/index.js';
import * as schema from '../../src/db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { signAdminSessionToken } from '../../api/_utils/auth.js';
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
  const req = createReq({
    method: options.method,
    url,
    headers: options.headers,
    query: options.query,
    body: options.body,
  });
  const res = createRes();
  await apiHandler(req, res);
  return res;
}

/**
 * @param {(req: any, res: any) => Promise<any>} handler
 * @param {string} url
 * @param {{
 *   method?: string,
 *   headers?: Record<string, string>,
 *   query?: Record<string, any>,
 *   body?: unknown,
 * }} options
 */
async function invokeHandler(handler, url, options = {}) {
  const req = createReq({
    method: options.method,
    url,
    headers: options.headers,
    query: options.query,
    body: options.body,
  });
  const res = createRes();
  await handler(req, res);
  return res;
}

const originalJwtSecret = process.env.JWT_SECRET;
const originalAdminToken = process.env.ADMIN_TOKEN;
const originalAuthSecret = process.env.AUTH_SECRET;

/** @type {string[]} */
let createdServiceIds = [];
/** @type {string[]} */
let createdProUserIds = [];
/** @type {string[]} */
let createdStructureIds = [];

beforeEach(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'p9b-test-jwt-secret';
  process.env.ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'p9b-test-admin-token';
  process.env.AUTH_SECRET = process.env.AUTH_SECRET || 'p9b-test-auth-secret';
});

afterEach(async () => {
  if (createdServiceIds.length > 0) {
    await await db.delete(schema.Service);
  }
  if (createdProUserIds.length > 0) {
    await await db.delete(schema.ProUser);
  }
  if (createdStructureIds.length > 0) {
    await await db.delete(schema.Structure);
  }

  createdServiceIds = [];
  createdProUserIds = [];
  createdStructureIds = [];

  process.env.JWT_SECRET = originalJwtSecret;
  process.env.ADMIN_TOKEN = originalAdminToken;
  process.env.AUTH_SECRET = originalAuthSecret;
});

async function createTenantFixture() {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

  const structureA = await (await db.insert(schema.Structure).values({
      nom: `P9B Structure A ${suffix}`,
      slug: `p9b-structure-a-${suffix}`,
      services: [],
      publics_accueillis: [],
      categories_aidees: [],
      mots_cles: [],
      region_codes: [],
      department_codes: [],
      insee_codes: [],
      is_pro_enabled: true,
      accessibilite_pmr: false,
    },
  ).returning())[0];
  const structureB = await (await db.insert(schema.Structure).values({
      nom: `P9B Structure B ${suffix}`,
      slug: `p9b-structure-b-${suffix}`,
      services: [],
      publics_accueillis: [],
      categories_aidees: [],
      mots_cles: [],
      region_codes: [],
      department_codes: [],
      insee_codes: [],
      is_pro_enabled: true,
      accessibilite_pmr: false,
    },
  ).returning())[0];

  const proUserA = await (await db.insert(schema.ProUser).values({
      email: `p9b-a-${suffix}@test.local`,
      password_hash: 'hashed',
      role: 'STRUCTURE_ADMIN',
      status: 'active',
      structureId: structureA.id,
    },
  ).returning())[0];

  const serviceA = await (await db.insert(schema.Service).values({
      structureId: structureA.id,
      slug: `service-a-${suffix}`,
      name: 'Service A',
      required_docs: [],
      audiences: [],
      modes: [],
    },
  ).returning())[0];
  const serviceB = await (await db.insert(schema.Service).values({
      structureId: structureB.id,
      slug: `service-b-${suffix}`,
      name: 'Service B',
      required_docs: [],
      audiences: [],
      modes: [],
    },
  ).returning())[0];

  createdStructureIds.push(structureA.id, structureB.id);
  createdProUserIds.push(proUserA.id);
  createdServiceIds.push(serviceA.id, serviceB.id);

  return { structureA, structureB, proUserA, serviceA, serviceB };
}

describe('P9-B pro-only gate + tenancy foundation', () => {
  it('returns 401 on /api/pro/me without pro JWT', async () => {
    const res = await invokeApi('/api/pro/me');
    expect(res.statusCode).toBe(401);
  });

  it('rejects admin token and admin JWT on /api/pro/me', async () => {
    const adminTokenRes = await invokeApi('/api/pro/me', {
      headers: { authorization: `Bearer ${process.env.ADMIN_TOKEN}` },
    });
    expect(adminTokenRes.statusCode).toBe(401);

    const adminJwt = signAdminSessionToken({ email: 'admin@test.local', role: 'admin' });
    const adminJwtRes = await invokeApi('/api/pro/me', {
      headers: { authorization: `Bearer ${adminJwt}` },
    });
    expect(adminJwtRes.statusCode).toBe(401);
  });

  it('accepts pro JWT on /api/pro/me and returns scoped user', async () => {
    const fixture = await createTenantFixture();
    const proToken = signProToken({
      id: fixture.proUserA.id,
      email: fixture.proUserA.email,
      structureId: fixture.structureA.id,
      role: fixture.proUserA.role,
    });

    const res = await invokeApi('/api/pro/me', {
      headers: { authorization: `Bearer ${proToken}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      user: {
        id: fixture.proUserA.id,
        structureId: fixture.structureA.id,
      },
      structure: {
        id: fixture.structureA.id,
      },
    });
    expect(String(res.getHeader('cache-control') || '')).toContain('no-store');
  });

  it('returns 403 when a pro tries to update a service from another structure', async () => {
    const fixture = await createTenantFixture();
    const proToken = signProToken({
      id: fixture.proUserA.id,
      email: fixture.proUserA.email,
      structureId: fixture.structureA.id,
      role: fixture.proUserA.role,
    });

    const res = await invokeHandler(proServicesHandler, '/api/pro/services', {
      method: 'PUT',
      headers: { authorization: `Bearer ${proToken}` },
      query: { id: fixture.serviceB.id },
      body: {
        name: 'Unauthorized Update',
        description_falc: 'x',
        duration_minutes: 20,
        modes: [],
        audiences: [],
        is_active: true,
      },
    });

    expect(res.statusCode).toBe(403);

    const freshServiceB = await db.query.Service.findFirst({ where: eq(schema.Service.id, fixture.serviceB.id) /* AUTOMIGRATED: { id: fixture.serviceB.id }  */ });
    expect(freshServiceB?.name).toBe('Service B');
  });
});
