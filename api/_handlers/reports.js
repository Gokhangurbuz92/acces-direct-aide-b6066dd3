import prisma from '../_utils/prisma.js';
import { checkRateLimit, getClientIp } from '../_utils/rateLimit.js';
import { verifyAdmin } from '../_utils/auth.js';
import { logger } from '../lib/logger.js';
import * as Sentry from '@sentry/node';
import { z } from 'zod';

const VALID_CONTENT_TYPES = ['AIDE', 'DEMARCHE', 'STRUCTURE', 'ACTUALITE'];
const VALID_REASONS = ['LIEN_MORT', 'HORAIRES_FAUX', 'INFO_FAUSSE', 'INFO_OBSOLETE', 'AUTRE'];
const VALID_STATUSES = ['NEW', 'IN_PROGRESS', 'FIXED', 'REJECTED'];

const createReportSchema = z.object({
  contentType: z.enum(VALID_CONTENT_TYPES),
  contentId: z.string().min(1),
  reason: z.enum(VALID_REASONS),
  message: z.string().max(2000).optional(),
  pageUrl: z.string().url().optional(),
  reporterEmail: z.string().email().optional(),
});

const updateReportSchema = z.object({
  status: z.enum(VALID_STATUSES),
  adminNote: z.string().max(2000).optional(),
});

const listReportsSchema = z.object({
  status: z.enum(VALID_STATUSES).optional(),
  contentType: z.enum(VALID_CONTENT_TYPES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

async function handler(req, res) {
  try {
    // POST /api/reports — Public: create a report
    if (req.method === 'POST') {
      const ip = getClientIp(req);
      const rateLimit = await checkRateLimit('REPORT_CONTENT', ip);
      if (!rateLimit.allowed) {
        return res.status(429).json(rateLimit.error);
      }

      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON' }); }
      }

      const validation = createReportSchema.safeParse(body);
      if (!validation.success) {
        return res.status(400).json({ error: 'Invalid parameters', details: validation.error.format() });
      }

      const data = validation.data;

      const report = await prisma.contentReport.create({
        data: {
          contentType: data.contentType,
          contentId: data.contentId,
          reason: data.reason,
          message: data.message || null,
          pageUrl: data.pageUrl || null,
          reporterEmail: data.reporterEmail || null,
        },
      });

      logger.info('REPORT_CREATED', {
        reportId: report.id,
        contentType: data.contentType,
        contentId: data.contentId,
        reason: data.reason,
      });

      return res.status(201).json({ id: report.id, status: report.status });
    }

    // GET /api/reports — Admin: list reports
    if (req.method === 'GET') {
      if (!verifyAdmin(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const validation = listReportsSchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({ error: 'Invalid parameters', details: validation.error.format() });
      }

      const { status, contentType, page, pageSize } = validation.data;

      const where = {};
      if (status) where.status = status;
      if (contentType) where.contentType = contentType;

      const [items, total] = await Promise.all([
        prisma.contentReport.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.contentReport.count({ where }),
      ]);

      return res.status(200).json({
        items,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    }

    // PATCH /api/reports?id=xxx — Admin: update report status
    if (req.method === 'PATCH') {
      if (!verifyAdmin(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const reportId = req.query?.id;
      if (!reportId) {
        return res.status(400).json({ error: 'Missing report id' });
      }

      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON' }); }
      }

      const validation = updateReportSchema.safeParse(body);
      if (!validation.success) {
        return res.status(400).json({ error: 'Invalid parameters', details: validation.error.format() });
      }

      const existing = await prisma.contentReport.findUnique({ where: { id: reportId } });
      if (!existing) {
        return res.status(404).json({ error: 'Report not found' });
      }

      const updated = await prisma.contentReport.update({
        where: { id: reportId },
        data: {
          status: validation.data.status,
          adminNote: validation.data.adminNote ?? existing.adminNote,
        },
      });

      logger.info('REPORT_STATUS_UPDATED', {
        reportId,
        oldStatus: existing.status,
        newStatus: updated.status,
      });

      return res.status(200).json(updated);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    logger.error('REPORTS_ERROR', { error });
    Sentry.captureException(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default handler;
