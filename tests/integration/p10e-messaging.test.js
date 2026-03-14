import { vi } from "vitest";
vi.stubEnv("KV_REST_API_URL", "http://localhost");
vi.stubEnv("KV_REST_API_TOKEN", "mock-token");

import crypto from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import apiHandler from '../../api/index.js';
import { db } from '../../src/db/index.js';
import * as schema from '../../src/db/schema.js';
import { eq, sql, desc, and } from 'drizzle-orm';
import { signProToken } from '../../api/_utils/auth.js';
import { buildUserSessionCookie, signUserSessionToken } from '../../api/_utils/user-auth.js';
import { __clearTestOutbox, __getTestOutbox } from '../../api/_utils/mailer.js';
import { notifyConversationMessage } from '../../api/_utils/rdv-messaging.js';

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
    url: overrides.url || '/api/messages/conversations',
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

let ipCounter = 30;
function nextIp() {
  ipCounter += 1;
  return `10.30.0.${ipCounter}`;
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
let structureIds = [];
/** @type {string[]} */
let proUserIds = [];
/** @type {string[]} */
let userIds = [];
/** @type {string[]} */
let serviceIds = [];
/** @type {string[]} */
let appointmentIds = [];
/** @type {string[]} */
let conversationIds = [];
/** @type {string[]} */
let messageIds = [];
/** @type {string[]} */
let notificationIds = [];

const originalEnv = {
  jwtSecret: process.env.JWT_SECRET,
  mailerProvider: process.env.MAILER_PROVIDER,
  mailerFrom: process.env.MAILER_FROM,
};

beforeEach(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'p10e-test-jwt-secret';
  process.env.MAILER_PROVIDER = 'test';
  process.env.MAILER_FROM = 'noreply@test.local';
  __clearTestOutbox();
});

afterEach(async () => {
  if (notificationIds.length > 0) {
    await db.delete(schema.RdvNotificationLog);
  }
  if (messageIds.length > 0) {
    await db.delete(schema.RdvConversationMessage);
  }
  if (conversationIds.length > 0) {
    await db.delete(schema.RdvConversation);
  }
  if (appointmentIds.length > 0) {
    await db.delete(schema.ProAppointment);
  }
  if (serviceIds.length > 0) {
    await db.delete(schema.ProRdvService);
  }
  if (proUserIds.length > 0) {
    await db.delete(schema.ProUser);
  }
  if (userIds.length > 0) {
    await db.delete(schema.CitizenUser);
  }
  if (structureIds.length > 0) {
    await db.delete(schema.Structure);
  }

  notificationIds = [];
  messageIds = [];
  conversationIds = [];
  appointmentIds = [];
  serviceIds = [];
  proUserIds = [];
  userIds = [];
  structureIds = [];

  process.env.JWT_SECRET = originalEnv.jwtSecret;
  process.env.MAILER_PROVIDER = originalEnv.mailerProvider;
  process.env.MAILER_FROM = originalEnv.mailerFrom;
  __clearTestOutbox();
});

async function createFixture() {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const now = new Date();

  const structureA = await (await db.insert(schema.Structure).values({
      id: crypto.randomUUID(), createdAt: now, updatedAt: now,
      nom: `P10E Structure A ${suffix}`,
      slug: `p10e-struct-a-${suffix}`,
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
  ).returning())[0];

  const structureB = await (await db.insert(schema.Structure).values({
      id: crypto.randomUUID(), createdAt: now, updatedAt: now,
      nom: `P10E Structure B ${suffix}`,
      slug: `p10e-struct-b-${suffix}`,
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
  ).returning())[0];

  structureIds.push(structureA.id, structureB.id);

  const proA = await (await db.insert(schema.ProUser).values({
      id: crypto.randomUUID(), createdAt: now, updatedAt: now,
      email: `pro-a-${suffix}@test.local`,
      password_hash: 'hash',
      role: 'STRUCTURE_ADMIN',
      status: 'active',
      structureId: structureA.id,
      notificationEmailEnabled: true,
    },
  ).returning())[0];

  const proB = await (await db.insert(schema.ProUser).values({
      id: crypto.randomUUID(), createdAt: now, updatedAt: now,
      email: `pro-b-${suffix}@test.local`,
      password_hash: 'hash',
      role: 'STRUCTURE_ADMIN',
      status: 'active',
      structureId: structureB.id,
      notificationEmailEnabled: true,
    },
  ).returning())[0];

  proUserIds.push(proA.id, proB.id);

  const userA = await (await db.insert(schema.CitizenUser).values({
      id: crypto.randomUUID(), createdAt: now, updatedAt: now,
      email: `user-a-${suffix}@test.local`,
      passwordHash: 'hash',
      emailVerifiedAt: new Date(),
      notificationEmailEnabled: true,
    },
  ).returning())[0];

  const userB = await (await db.insert(schema.CitizenUser).values({
      id: crypto.randomUUID(), createdAt: now, updatedAt: now,
      email: `user-b-${suffix}@test.local`,
      passwordHash: 'hash',
      emailVerifiedAt: new Date(),
      notificationEmailEnabled: true,
    },
  ).returning())[0];

  userIds.push(userA.id, userB.id);

  const service = await (await db.insert(schema.ProRdvService).values({
      id: crypto.randomUUID(), createdAt: now, updatedAt: now,
      structureId: structureA.id,
      name: 'Accompagnement',
      durationMinutes: 30,
      isActive: true,
    },
  ).returning())[0];
  serviceIds.push(service.id);

  const appointment = await (await db.insert(schema.ProAppointment).values({
      id: crypto.randomUUID(), createdAt: now, updatedAt: now,
      structureId: structureA.id,
      serviceId: service.id,
      startAt: new Date('2026-03-05T10:00:00.000Z'),
      endAt: new Date('2026-03-05T10:30:00.000Z'),
      status: 'confirmed',
      beneficiaryName: 'Particulier',
      citizenUserId: userA.id,
      citizenEmailSnapshot: userA.email,
      idempotencyKey: `p10e-${suffix}`,
    },
  ).returning())[0];
  appointmentIds.push(appointment.id);

  const conversation = await (await db.insert(schema.RdvConversation).values({
      id: crypto.randomUUID(), createdAt: now, updatedAt: now,
      appointmentId: appointment.id,
      structureId: structureA.id,
      citizenUserId: userA.id,
      lastMessageAt: new Date('2026-03-05T10:00:00.000Z'),
    },
  ).returning())[0];
  conversationIds.push(conversation.id);

  const initialMessage = await (await db.insert(schema.RdvConversationMessage).values({
      id: crypto.randomUUID(), createdAt: now, updatedAt: now,
      conversationId: conversation.id,
      senderType: 'USER',
      senderCitizenUserId: userA.id,
      body: 'Bonjour',
    },
  ).returning())[0];
  messageIds.push(initialMessage.id);

  return {
    structureA,
    structureB,
    proA,
    proB,
    userA,
    userB,
    appointment,
    conversation,
  };
}

function userCookie(user) {
  const token = signUserSessionToken({ userId: user.id, email: user.email });
  return buildUserSessionCookie(token).split(';')[0] || '';
}

describe('P10-E messaging contracts', () => {
  it('enforces owner-only and tenant-scope on conversation read', async () => {
    const fixture = await createFixture();
    console.log('MARK 1');

    const userAReq = await invokeApi(`/api/messages/conversations/${fixture.conversation.id}`, {
      headers: { cookie: userCookie(fixture.userA) },
    });
    console.log('MARK 2');
    expect(userAReq.statusCode).toBe(200);
    expect(userAReq.body?.item?.id).toBe(fixture.conversation.id);
    expect(String(userAReq.getHeader('cache-control') || '').toLowerCase()).toContain('no-store');
    expect(String(userAReq.getHeader('x-robots-tag') || '').toLowerCase()).toContain('noindex');

    const userBReq = await invokeApi(`/api/messages/conversations/${fixture.conversation.id}`, {
      headers: { cookie: userCookie(fixture.userB) },
    });
    console.log('MARK 3');
    expect(userBReq.statusCode).toBe(403);

    const proAToken = signProToken({
      id: fixture.proA.id,
      email: fixture.proA.email,
      structureId: fixture.structureA.id,
      role: fixture.proA.role,
    });
    const proAReq = await invokeApi(`/api/pro/messages/conversations/${fixture.conversation.id}`, {
      headers: { authorization: `Bearer ${proAToken}` },
    });
    console.log('MARK 4');
    expect(proAReq.statusCode).toBe(200);

    const proBToken = signProToken({
      id: fixture.proB.id,
      email: fixture.proB.email,
      structureId: fixture.structureB.id,
      role: fixture.proB.role,
    });
    const proBReq = await invokeApi(`/api/pro/messages/conversations/${fixture.conversation.id}`, {
      headers: { authorization: `Bearer ${proBToken}` },
    });
    console.log('MARK 5');
    expect(proBReq.statusCode).toBe(403);
  }, 15000);

  it('rejects empty message body and sends one notification email per message+recipient', async () => {
    const fixture = await createFixture();

    const invalid = await invokeApi(`/api/messages/conversations/${fixture.conversation.id}`, {
      method: 'POST',
      headers: { cookie: userCookie(fixture.userA) },
      body: { body: '   ' },
    });
    expect(invalid.statusCode).toBe(400);

    const created = await invokeApi(`/api/messages/conversations/${fixture.conversation.id}`, {
      method: 'POST',
      headers: { cookie: userCookie(fixture.userA) },
      body: { body: 'Nouveau message usager' },
    });

    expect(created.statusCode).toBe(201);
    expect(created.body?.item?.senderType).toBe('USER');

    const createdMessage = (await db.select().from(schema.RdvConversationMessage).where(eq(schema.RdvConversationMessage.id, created.body.item.id)))[0];
    expect(createdMessage).toBeTruthy();
    if (createdMessage) messageIds.push(createdMessage.id);

    const logs = await db.select().from(schema.RdvNotificationLog).where(
      and(
        eq(schema.RdvNotificationLog.messageId, created.body.item.id),
        eq(schema.RdvNotificationLog.recipientType, 'PRO')
      )
    );
    for (const log of logs) notificationIds.push(log.id);

    expect(logs.length).toBe(1);
    expect(__getTestOutbox().length).toBe(1);

    const duplicateResult = await notifyConversationMessage({
      conversationId: fixture.conversation.id,
      messageId: created.body.item.id,
      recipientType: 'PRO',
      recipientEmail: fixture.proA.email,
      recipientEnabled: true,
      structureName: fixture.structureA.nom,
      appointmentStartAt: fixture.appointment.startAt,
    });

    expect(duplicateResult).toMatchObject({ sent: false, skipped: true, reason: 'duplicate' });
    expect(__getTestOutbox().length).toBe(1);
  });

  it('supports get-or-create conversation from appointment for owner user', async () => {
    const fixture = await createFixture();

    const ownerResponse = await invokeApi(`/api/messages/from-appointment/${fixture.appointment.id}`, {
      method: 'POST',
      headers: { cookie: userCookie(fixture.userA) },
    });

    expect(ownerResponse.statusCode).toBe(200);
    expect(ownerResponse.body).toMatchObject({
      ok: true,
      conversationId: fixture.conversation.id,
      appointmentId: fixture.appointment.id,
    });

    const forbidden = await invokeApi(`/api/messages/from-appointment/${fixture.appointment.id}`, {
      method: 'POST',
      headers: { cookie: userCookie(fixture.userB) },
    });

    expect(forbidden.statusCode).toBe(403);
  });
});
