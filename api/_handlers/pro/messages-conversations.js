// @ts-nocheck
import { db } from '../../../src/db/index.js';
import { RdvConversation, RdvConversationMessage } from '../../../src/db/schema.js';
import { eq, desc, asc } from 'drizzle-orm';
import { requireProStructureContext } from '../../_utils/auth.js';
import { checkRateLimit, getClientIp, getRateLimitStatus } from '../../_utils/rateLimit.js';
import { withProRdvHandler } from '../../_utils/with-pro-rdv-handler.js';
import {
  notifyConversationMessage,
  sanitizeMessageBody,
  serializeConversationDetail,
  serializeConversationListItem,
  serializeRdvMessage,
} from '../../_utils/rdv-messaging.js';

/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @returns {URL}
 */
function getUrl(req) {
  return new URL(req.url || '/api/pro/messages/conversations', `https://${req.headers?.host || 'localhost'}`);
}

/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @returns {string[]}
 */
function getPathSegments(req) {
  const pathname = getUrl(req).pathname || '';
  const normalized = pathname
    .replace(/^\/api\/pro\/messages\/conversations\/?/i, '')
    .replace(/^\/pro\/messages\/conversations\/?/i, '')
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
 * @param {import('../../_utils/http-types').ApiRequest} req
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
 * @param {number} limit
 */
async function loadConversationForPro(conversationId, limit) {
  return db.query.RdvConversation.findFirst({
    where: eq(RdvConversation.id, conversationId),
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
        orderBy: [asc(RdvConversationMessage.createdAt)],
      },
      citizenUser: {
        columns: { id: true },
      },
    },
  });
}

/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */
async function getConversations(req, res, proCtx) {
  const readLimit = await enforceRateLimit(req, 'MESSAGE_PRO_READ', `${proCtx.userId}:conversations`);
  if (!readLimit.allowed) {
    return res.status(readLimit.status).json(readLimit.error);
  }

  const url = getUrl(req);
  const limit = toLimit(url.searchParams.get('limit'), 20, 100);

  const conversations = await db.query.RdvConversation.findMany({
    where: eq(RdvConversation.structureId, proCtx.structureId),
    limit,
    orderBy: [desc(RdvConversation.lastMessageAt)],
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
        orderBy: [desc(RdvConversationMessage.createdAt)],
      },
    },
  });

  return res.status(200).json({
    ok: true,
    items: conversations.map((conversation) => serializeConversationListItem(conversation)),
  });
}

/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */
async function getConversation(req, res, proCtx, conversationId) {
  const readLimit = await enforceRateLimit(req, 'MESSAGE_PRO_READ', `${proCtx.userId}:${conversationId}`);
  if (!readLimit.allowed) {
    return res.status(readLimit.status).json(readLimit.error);
  }

  const url = getUrl(req);
  const limit = toLimit(url.searchParams.get('limit'), 50, 200);

  const conversation = await loadConversationForPro(conversationId, limit);
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  if (conversation.structureId !== proCtx.structureId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  return res.status(200).json({
    ok: true,
    item: serializeConversationDetail(conversation),
  });
}

/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */
async function sendMessage(req, res, proCtx, conversationId) {
  const writeLimit = await enforceRateLimit(req, 'MESSAGE_PRO_SEND', `${proCtx.userId}:${conversationId}`);
  if (!writeLimit.allowed) {
    return res.status(writeLimit.status).json(writeLimit.error);
  }

  const body = sanitizeMessageBody(req.body?.body);
  if (!body) {
    return res.status(400).json({ error: 'Message body is required' });
  }

  const created = await db.transaction(async (tx) => {
    const conversation = await tx.query.RdvConversation.findFirst({
      where: eq(RdvConversation.id, conversationId),
      with: {
        structure: { columns: { id: true, nom: true } },
        appointment: { columns: { id: true, startAt: true } },
        citizenUser: {
          columns: {
            email: true,
            emailVerifiedAt: true,
            notificationEmailEnabled: true,
          },
        },
      },
    });

    if (!conversation) return null;
    if (conversation.structureId !== proCtx.structureId) {
      return { forbidden: true };
    }

    const [message] = await tx.insert(RdvConversationMessage).values({
        conversationId: conversation.id,
        senderType: 'PRO',
        senderProUserId: proCtx.userId,
        body,
    }).returning();

    await tx.update(RdvConversation).set({
        lastMessageAt: message.createdAt,
    }).where(eq(RdvConversation.id, conversation.id));

    return { conversation, message, forbidden: false };
  });

  if (!created) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  if (created.forbidden) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    await notifyConversationMessage({
      conversationId: created.conversation.id,
      messageId: created.message.id,
      recipientType: 'USER',
      recipientEmail: created.conversation.citizenUser?.email || null,
      recipientEnabled: Boolean(
        created.conversation.citizenUser?.notificationEmailEnabled && created.conversation.citizenUser?.emailVerifiedAt,
      ),
      structureName: created.conversation.structure?.nom || 'Acces Direct Aide',
      appointmentStartAt: created.conversation.appointment?.startAt || null,
    });
  } catch {
    // Email delivery stays best-effort for messaging.
  }

  return res.status(201).json({
    ok: true,
    item: serializeRdvMessage(created.message),
  });
}

/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */
async function handler(req, res) {
  const proCtx = requireProStructureContext(req, res);
  if (!proCtx) return;

  const method = String(req.method || 'GET').toUpperCase();
  const segments = getPathSegments(req);

  if (method === 'GET' && segments.length === 0) {
    return getConversations(req, res, proCtx);
  }

  if (method === 'GET' && segments[0]) {
    return getConversation(req, res, proCtx, String(segments[0]));
  }

  if (method === 'POST' && segments[0]) {
    return sendMessage(req, res, proCtx, String(segments[0]));
  }

  return res.status(404).json({ error: 'Not Found' });
}

export default withProRdvHandler('pro_messages_conversations', handler);
