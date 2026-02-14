import { PrismaClient } from '@prisma/client';
import Sentry from '../_utils/sentry.js';
import logger from '../_utils/logger.js';
import { env } from '../_utils/env.js';

const prisma = new PrismaClient();

// Valid content types and reasons (matching Prisma enums)
const VALID_CONTENT_TYPES = ['AIDE', 'DEMARCHE', 'STRUCTURE', 'ACTUALITE'];
const VALID_REASONS = ['LIEN_MORT', 'HORAIRES_FAUX', 'INFO_FAUSSE', 'INFO_OBSOLETE', 'AUTRE'];
const VALID_STATUSES = ['NEW', 'IN_PROGRESS', 'FIXED', 'REJECTED'];

/**
 * POST /api/reports - Create a new content report
 * GET /api/reports - List reports (admin only)
 * PUT /api/reports/:id - Update report status (admin only)
 */
/**
 * @param {import('../_utils/http-types').ApiRequest} req
 * @param {import('../_utils/http-types').ApiResponse} res
 */
export default async function handler(req, res) {
    const log = logger.child({ handler: 'reports' });

    try {
        // POST - Create new report (public endpoint)
        if (req.method === 'POST') {
            const { contentType, contentId, reason, message, pageUrl, reporterEmail } = req.body || {};

            // Validation
            if (!contentType || !VALID_CONTENT_TYPES.includes(contentType)) {
                return res.status(400).json({
                    error: 'Invalid or missing contentType',
                    validTypes: VALID_CONTENT_TYPES
                });
            }

            if (!contentId || typeof contentId !== 'string') {
                return res.status(400).json({ error: 'contentId is required and must be a string' });
            }

            if (!reason || !VALID_REASONS.includes(reason)) {
                return res.status(400).json({
                    error: 'Invalid or missing reason',
                    validReasons: VALID_REASONS
                });
            }

            // Optional fields validation
            if (message && typeof message !== 'string') {
                return res.status(400).json({ error: 'message must be a string' });
            }

            if (reporterEmail && typeof reporterEmail !== 'string') {
                return res.status(400).json({ error: 'reporterEmail must be a string' });
            }

            // Basic email validation if provided
            if (reporterEmail && !reporterEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                return res.status(400).json({ error: 'reporterEmail must be a valid email address' });
            }

            // Create the report
            const report = await prisma.contentReport.create({
                data: {
                    contentType,
                    contentId,
                    reason,
                    message: message || null,
                    pageUrl: pageUrl || null,
                    reporterEmail: reporterEmail || null,
                    status: 'NEW'
                }
            });

            log.info({
                msg: 'Content report created',
                reportId: report.id,
                contentType,
                contentId,
                reason
            });

            return res.status(201).json({
                success: true,
                reportId: report.id,
                message: 'Signalement enregistré avec succès'
            });
        }

        // GET - List reports (admin only)
        if (req.method === 'GET') {
            // Check admin authentication
            if (!req.user || req.user.role !== 'admin') {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const url = new URL(req.url, `https://${req.headers.host}`);
            const status = url.searchParams.get('status');
            const contentType = url.searchParams.get('contentType');
            const page = parseInt(url.searchParams.get('page') || '1', 10);
            const limit = parseInt(url.searchParams.get('limit') || '50', 10);

            // Build filters
            const where = {};
            if (status && VALID_STATUSES.includes(status)) {
                where.status = status;
            }
            if (contentType && VALID_CONTENT_TYPES.includes(contentType)) {
                where.contentType = contentType;
            }

            // Fetch reports with pagination
            const [reports, total] = await Promise.all([
                prisma.contentReport.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    skip: (page - 1) * limit,
                    take: limit
                }),
                prisma.contentReport.count({ where })
            ]);

            return res.status(200).json({
                reports,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });
        }

        // PUT - Update report status (admin only)
        if (req.method === 'PUT') {
            // Check admin authentication
            if (!req.user || req.user.role !== 'admin') {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const url = new URL(req.url, `https://${req.headers.host}`);
            const reportId = url.searchParams.get('id');
            const { status } = req.body || {};

            if (!reportId) {
                return res.status(400).json({ error: 'Report ID is required' });
            }

            if (!status || !VALID_STATUSES.includes(status)) {
                return res.status(400).json({
                    error: 'Invalid or missing status',
                    validStatuses: VALID_STATUSES
                });
            }

            // Update the report
            const report = await prisma.contentReport.update({
                where: { id: reportId },
                data: { status }
            });

            log.info({
                msg: 'Content report updated',
                reportId: report.id,
                newStatus: status,
                updatedBy: req.user.email
            });

            return res.status(200).json({
                success: true,
                report
            });
        }

        // Method not allowed
        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        log.error({ msg: 'Reports handler error', error: error.message, stack: error.stack });
        Sentry.captureException(error);

        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Report not found' });
        }

        return res.status(500).json({
            error: 'Internal server error',
            message: env.runtime.nodeEnv === 'production' ? 'An error occurred' : error.message
        });
    }
}
