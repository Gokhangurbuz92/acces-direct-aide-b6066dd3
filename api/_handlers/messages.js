// @ts-nocheck
import prisma from '../_utils/prisma.js';
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
  return prisma.rdvConversation.findUnique({
    where: {
      id: conversationId,
    },
    include: {
      structure: {
        select: {
          id: true,
          slug: true,
          nom: true,
        },
      },
      appointment: {
        select: {
          id: true,
          startAt: true,
          endAt: true,
          status: true,
          service: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      messages: {
        orderBy: { createdAt: 'asc' },
        take: limit,
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

  const conversations = await prisma.rdvConversation.findMany({
    where: {
      citizenUserId: user.id,
    },
    take: limit,
    orderBy: {
      lastMessageAt: 'desc',
    },
    include: {
      structure: {
        select: {
          id: true,
          slug: true,
          nom: true,
        },
      },
      appointment: {
        select: {
          id: true,
          startAt: true,
          endAt: true,
          status: true,
          service: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      messages: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      },
    },
  });

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

  const conversation = await loadConversationById(conversationId, limit);
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

  const created = await prisma.$transaction(async (tx) => {
    const conversation = await tx.rdvConversation.findUnique({
      where: {
        id: conversationId,
      },
      include: {
        structure: {
          select: {
            id: true,
            nom: true,
          },
        },
        appointment: {
          select: {
            id: true,
            startAt: true,
          },
        },
      },
    });

    if (!conversation) return null;
    if (conversation.citizenUserId !== user.id) {
      return { forbidden: true };
    }

    const message = await tx.rdvConversationMessage.create({
      data: {
        conversationId: conversation.id,
        senderType: 'USER',
        senderCitizenUserId: user.id,
        body,
      },
    });

    await tx.rdvConversation.update({
      where: {
        id: conversation.id,
      },
      data: {
        lastMessageAt: message.createdAt,
      },
    });

    return { conversation, message, forbidden: false };
  });

  if (!created) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  if (created.forbidden) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const recipient = await prisma.proUser.findFirst({
    where: {
      structureId: created.conversation.structureId,
      status: 'active',
      notificationEmailEnabled: true,
    },
    select: {
      email: true,
      notificationEmailEnabled: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
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

  const appointment = await prisma.proAppointment.findUnique({
    where: {
      id: appointmentId,
    },
    select: {
      id: true,
      citizenUserId: true,
      structureId: true,
      structure: {
        select: {
          slug: true,
          nom: true,
        },
      },
    },
  });

  if (!appointment) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  if (appointment.citizenUserId !== user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const existing = await prisma.rdvConversation.findUnique({
    where: {
      appointmentId: appointment.id,
    },
    select: {
      id: true,
      citizenUserId: true,
    },
  });

  if (existing && existing.citizenUserId !== user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const conversation = await prisma.rdvConversation.upsert({
    where: {
      appointmentId: appointment.id,
    },
    update: {},
    create: {
      appointmentId: appointment.id,
      structureId: appointment.structureId,
      citizenUserId: user.id,
      lastMessageAt: new Date(),
    },
    select: {
      id: true,
      appointmentId: true,
      lastMessageAt: true,
      structure: {
        select: {
          slug: true,
          nom: true,
        },
      },
    },
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
