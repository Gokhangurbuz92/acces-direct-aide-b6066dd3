// @ts-nocheck
import crypto from 'node:crypto';
import fs from 'fs';
import { db } from '../../src/db/index.js';
import * as schema from '../../src/db/schema.js';
import { eq, and, desc, asc } from 'drizzle-orm';
import { checkRateLimit, getClientIp, getRateLimitStatus } from '../_utils/rateLimit.js';
import { requireCitizenUser } from '../_utils/rdv-public-auth.js';
import {
  notifyConversationMessage,
  sanitizeMessageBody,
  serializeConversationDetail,
  serializeConversationListItem,
  serializeRdvMessage,
} from '../_utils/rdv-messaging.js';

/**
 * @param {import('../_utils/http-types').ApiRequest} req
 * @returns {URL}
 */
function getUrl(req) {
  return new URL(req.url || '/api/messages', `https://${req.headers?.host || 'localhost'}`);
}

/**
 * @param {import('../_utils/http-types').ApiRequest} req
 * @returns {string[]}
 */
function getPathSegments(req) {
  const pathname = getUrl(req).pathname || '';
  const normalized = pathname
    .replace(/^\/api\/messages\/?/i, '')
    .replace(/^\/messages\/?/i, '')
    .replace(/\/+$/, '');
  if (!normalized) return [];
  return normalized.split('/').filter(Boolean).map((segment) => decodeURIComponent(segment));
}

/**
 * @param {unknown} value
 * @param {number} fallback
 * @param {number} max
 */
function toLimit(value, fallback, max) {
  const parsed = Number.parseInt(String(value || ''), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.min(max, parsed));
}

/**
 * @param {import('../_utils/http-types').ApiRequest} req
 * @param {string} action
 * @param {string} subject
 */
async function enforceRateLimit(req, action, subject) {
  const key = `${subject}:${getClientIp(req)}`;
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
 * @param {string} conversationId
 * @param {string} userId
 * @param {number} limit
 */
async function loadConversationById(conversationId, limit) {
  return db.query.RdvConversation.findFirst({
    where: (conv, { eq }) => eq(conv.id, conversationId),
    with: {
      structure: {
        columns: { id: true, slug: true, nom: true },
      },
      appointment: {
        columns: { id: true, startAt: true, endAt: true, status: true },
        with: {
          service: { columns: { id: true, name: true } },
        },
      },
      messages: {
        orderBy: (msg, { asc }) => [asc(msg.createdAt)],
      },
    },
  });
}

/**
 * @param {import('../_utils/http-types').ApiRequest} req
 * @param {import('../_utils/http-types').ApiResponse} res
 */
async function getConversations(req, res, user) {
  const readLimit = await enforceRateLimit(req, 'MESSAGE_USER_READ', `${user.id}:conversations`);
  if (!readLimit.allowed) {
    return res.status(readLimit.status).json(readLimit.error);
  }

  const url = getUrl(req);
  const limit = toLimit(url.searchParams.get('limit'), 20, 100);

  let conversations;
  try {
    conversations = await db.query.RdvConversation.findMany({
      where: (conv, { eq }) => eq(conv.citizenUserId, user.id),
      limit,
      orderBy: (conv, { desc }) => [desc(conv.lastMessageAt)],
      with: {
        structure: { columns: { id: true, slug: true, nom: true } },
        appointment: {
          columns: { id: true, startAt: true, endAt: true, status: true },
          with: { service: { columns: { id: true, name: true } } },
        },
        messages: {
          orderBy: (msg, { desc }) => [desc(msg.createdAt)],
        },
      },
    });
  } catch (err) {
    fs.appendFileSync('API_ERROR.txt', 'GET CONV ERROR: ' + err.stack + ' | CODE: ' + err.code + ' | DETAIL: ' + err.detail + '\n');
    throw err;
  }

  return res.status(200).json({
    ok: true,
    items: conversations.map((conversation) => serializeConversationListItem(conversation)),
  });
}

/**
 * @param {import('../_utils/http-types').ApiRequest} req
 * @param {import('../_utils/http-types').ApiResponse} res
 */
async function getConversation(req, res, user, conversationId) {
  const readLimit = await enforceRateLimit(req, 'MESSAGE_USER_READ', `${user.id}:${conversationId}`);
  if (!readLimit.allowed) {
    return res.status(readLimit.status).json(readLimit.error);
  }

  const url = getUrl(req);
  const limit = toLimit(url.searchParams.get('limit'), 50, 200);

  let conversation;
  try {
    conversation = await loadConversationById(conversationId, limit);
  } catch (err) {
    console.error("GET CONVERSATION BY ID ERROR", err);
    throw err;
  }
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  if (conversation.citizenUserId !== user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  return res.status(200).json({
    ok: true,
    item: serializeConversationDetail(conversation),
  });
}

/**
 * @param {import('../_utils/http-types').ApiRequest} req
 * @param {import('../_utils/http-types').ApiResponse} res
 */
async function sendMessage(req, res, user, conversationId) {
  const writeLimit = await enforceRateLimit(req, 'MESSAGE_USER_SEND', `${user.id}:${conversationId}`);
  if (!writeLimit.allowed) {
    return res.status(writeLimit.status).json(writeLimit.error);
  }

  const body = sanitizeMessageBody(req.body?.body);
  if (!body) {
    return res.status(400).json({ error: 'Message body is required' });
  }

  let created;
  try {
    created = await db.transaction(async (tx) => {
      const conversation = await tx.query.RdvConversation.findFirst({
        where: (conv, { eq }) => eq(conv.id, conversationId),
        with: {
          structure: { columns: { id: true, nom: true } },
          appointment: { columns: { id: true, startAt: true } },
        },
      });

      if (!conversation) return null;
      if (conversation.citizenUserId !== user.id) {
        return { forbidden: true };
      }

      const message = (await tx.insert(schema.RdvConversationMessage).values({
        id: crypto.randomUUID(),
        conversationId: conversation.id,
        senderType: 'USER',
        senderCitizenUserId: user.id,
        body,
      }).returning())[0];

      await tx.update(schema.RdvConversation).set({
        lastMessageAt: message.createdAt,
      }).where(eq(schema.RdvConversation.id, conversation.id));

      return { conversation, message, forbidden: false };
    });
  } catch (err) {
    fs.appendFileSync('API_ERROR.txt', 'TX ERROR: ' + err.stack + ' | CODE: ' + err.code + ' | DETAIL: ' + err.detail + ' | MSG: ' + err.message + '\n');
    throw err;
  }

  if (!created) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  if (created.forbidden) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const recipient = await db.query.ProUser.findFirst({
    where: (pro, { eq, and }) => and(
      eq(pro.structureId, created.conversation.structureId),
      eq(pro.status, 'active'),
      eq(pro.notificationEmailEnabled, true)
    ),
    columns: { email: true, notificationEmailEnabled: true },
    orderBy: (pro, { asc }) => [asc(pro.createdAt)],
  });

  try {
    await notifyConversationMessage({
      conversationId: created.conversation.id,
      messageId: created.message.id,
      recipientType: 'PRO',
      recipientEmail: recipient?.email || null,
      recipientEnabled: Boolean(recipient?.notificationEmailEnabled),
      structureName: created.conversation.structure?.nom || 'Acces Direct Aide',
      appointmentStartAt: created.conversation.appointment?.startAt || null,
    });
  } catch {
    // Messaging must remain successful even if email delivery fails.
  }

  return res.status(201).json({
    ok: true,
    item: serializeRdvMessage(created.message),
  });
}

/**
 * @param {import('../_utils/http-types').ApiRequest} req
 * @param {import('../_utils/http-types').ApiResponse} res
 */
async function getOrCreateFromAppointment(req, res, user, appointmentId) {
  const writeLimit = await enforceRateLimit(req, 'MESSAGE_USER_WRITE', `${user.id}:${appointmentId}`);
  if (!writeLimit.allowed) {
    return res.status(writeLimit.status).json(writeLimit.error);
  }

  const appointment = await db.query.ProAppointment.findFirst({
    where: (app, { eq }) => eq(app.id, appointmentId),
    columns: { id: true, citizenUserId: true, structureId: true },
    with: {
      structure: { columns: { slug: true, nom: true } },
    },
  });

  if (!appointment) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  if (appointment.citizenUserId !== user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const existing = await db.query.RdvConversation.findFirst({
    where: (conv, { eq }) => eq(conv.appointmentId, appointment.id),
    columns: { id: true, citizenUserId: true },
  });

  if (existing && existing.citizenUserId !== user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const rawConversation = (await db.insert(schema.RdvConversation).values({
      id: crypto.randomUUID(),
      appointmentId: appointment.id,
      structureId: appointment.structureId,
      citizenUserId: user.id,
      lastMessageAt: new Date(),
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: schema.RdvConversation.appointmentId,
      set: { updatedAt: new Date() },
    }).returning())[0];

    const conversation = await db.query.RdvConversation.findFirst({
      where: (conv, { eq }) => eq(conv.id, rawConversation.id),
      columns: { id: true, appointmentId: true, lastMessageAt: true },
      with: { structure: { columns: { slug: true, nom: true } } },
    });
    
    return res.status(200).json({
      ok: true,
      conversationId: conversation.id,
      appointmentId: conversation.appointmentId,
      structure: {
        slug: conversation.structure?.slug || null,
        name: conversation.structure?.nom || null,
      },
    });
  } catch (err) {
    fs.appendFileSync('API_ERROR.txt', 'UPSERT ERROR: ' + err.stack + ' | CODE: ' + err.code + ' | DETAIL: ' + err.detail + ' | MSG: ' + err.message + '\n');
    throw err;
  }
}

/**
 * @param {import('../_utils/http-types').ApiRequest} req
 * @param {import('../_utils/http-types').ApiResponse} res
 */
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const auth = await requireCitizenUser(req);
  if (!auth.ok) {
    return res.status(auth.status).json({
      error: auth.error,
      ...(auth.code ? { code: auth.code } : {}),
    });
  }

  const method = String(req.method || 'GET').toUpperCase();
  const segments = getPathSegments(req);

  if (method === 'GET' && segments[0] === 'conversations' && segments.length === 1) {
    return getConversations(req, res, auth.user);
  }

  if (method === 'GET' && segments[0] === 'conversations' && segments[1]) {
    return getConversation(req, res, auth.user, String(segments[1]));
  }

  if (method === 'POST' && segments[0] === 'conversations' && segments[1]) {
    return sendMessage(req, res, auth.user, String(segments[1]));
  }

  if (method === 'POST' && segments[0] === 'from-appointment' && segments[1]) {
    return getOrCreateFromAppointment(req, res, auth.user, String(segments[1]));
  }

  return res.status(404).json({ error: 'Not Found' });
}
