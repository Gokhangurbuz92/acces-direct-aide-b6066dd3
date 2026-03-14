import logger from '../_utils/logger.js';
/**
 * POST /api/diagnostic      — public: compute rights via OpenFisca
 * POST /api/diagnostic/trace — pro/admin: get OpenFisca trace
 *
 * Phase 2: SyncRun tracing for observability.
 */

import * as Sentry from '@sentry/node';
import { calculate, trace as traceCall, isAvailable } from '../lib/openfiscaClient.js';
import { buildTestCase, parseResults, getCurrentPeriod } from '../lib/openfiscaMapping.js';
import { checkRateLimit } from '../_utils/rateLimit.js';
import { db } from '../../src/db/index.js';
import { SyncRun } from '../../src/db/schema.js';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

// Simple input validation — we use manual checks to avoid adding a Zod dependency
function validateAnswers(answers) {
    const errors = [];
    if (!answers || typeof answers !== 'object') {
        return ['answers is required and must be an object'];
    }
    if (!answers.birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(answers.birthDate)) {
        errors.push('birthDate is required (YYYY-MM-DD format)');
    }
    if (answers.income) {
        if (answers.income.salary != null && (isNaN(answers.income.salary) || answers.income.salary < 0)) {
            errors.push('income.salary must be a non-negative number');
        }
        if (answers.income.unemployment != null && (isNaN(answers.income.unemployment) || answers.income.unemployment < 0)) {
            errors.push('income.unemployment must be a non-negative number');
        }
    }
    if (answers.housing) {
        if (answers.housing.rent != null && (isNaN(answers.housing.rent) || answers.housing.rent < 0)) {
            errors.push('housing.rent must be a non-negative number');
        }
        if (answers.housing.charges != null && (isNaN(answers.housing.charges) || answers.housing.charges < 0)) {
            errors.push('housing.charges must be a non-negative number');
        }
    }
    return errors;
}

/**
 * Generate a short request ID for logging (no PII).
 */
function generateRequestId() {
    return `diag_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export default async function handler(req, res) {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathSuffix = url.pathname.replace(/^\/api\/diagnostic\/?/, '');

    // Route: /api/diagnostic/trace
    if (pathSuffix === 'trace') {
        return handleTrace(req, res);
    }

    // Route: /api/diagnostic (main)
    return handleDiagnostic(req, res);
}

async function handleDiagnostic(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed', allowed: ['POST'] });
    }

    const requestId = generateRequestId();
    const start = Date.now();

    // ── Phase 2: SyncRun tracing ──
    let syncRunId = null;
    try {
        const [run] = await db.insert(SyncRun).values({
            id: crypto.randomUUID(),
            source_id: 'openfisca-diagnostic',
            status: 'running',
            started_at: new Date(),
            stats: { requestId },
        }).returning({ id: SyncRun.id });
        syncRunId = run.id;
    } catch {
        // SyncRun logging must never break the diagnostic flow
    }

    try {
        // Rate limiting
        const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
        const rateLimitResult = await checkRateLimit('DIAGNOSTIC', ip);
        if (rateLimitResult && !rateLimitResult.allowed) {
            return res.status(429).json({
                error: 'rate_limit_exceeded',
                message: 'Trop de requêtes. Veuillez patienter avant de réessayer.',
                requestId,
            });
        }

        // Pre-flight: check OpenFisca availability (cached 60s)
        let engineUp = false;
        try {
            engineUp = await isAvailable();
        } catch (healthCheckErr) {
            logger.warn('[Diagnostic] isAvailable() threw', { requestId, error: healthCheckErr.message });
            Sentry.captureException(healthCheckErr, {
                extra: { requestId, phase: 'health-check' },
            });
        }
        if (!engineUp) {
            logger.warn('[Diagnostic] OpenFisca unavailable (cached health probe)', { requestId });
            return res.status(503).json({
                code: 'OPENFISCA_UNAVAILABLE',
                message: 'Service de calcul temporairement indisponible. Veuillez réessayer dans quelques instants.',
                requestId,
            });
        }

        // Parse body
        let body;
        if (typeof req.body === 'object' && req.body !== null) {
            body = req.body;
        } else if (typeof req.body === 'string') {
            body = JSON.parse(req.body);
        } else {
            return res.status(400).json({ error: 'invalid_body', message: 'Request body is required (JSON)', requestId });
        }

        const { answers } = body;

        // Validate
        const errors = validateAnswers(answers);
        if (errors.length > 0) {
            return res.status(400).json({ error: 'validation_error', details: errors, requestId });
        }

        // Build OpenFisca test case
        const period = getCurrentPeriod();
        const situation = buildTestCase(answers, period);

        // Call OpenFisca
        const result = await calculate(situation);

        // Parse results
        const rights = parseResults(result, period);

        const duration = Date.now() - start;
        logger.info('[Diagnostic]', { requestId, duration_ms: duration, rightsCount: rights.length });

        // ── Phase 2: SyncRun success ──
        if (syncRunId) {
            try {
                await db.update(SyncRun).set({
                    status: 'success',
                    ended_at: new Date(),
                    stats: {
                        requestId,
                        duration_ms: duration,
                        rightsCount: rights.length,
                        eligibleCount: rights.filter(r => r.eligible).length,
                        variables: rights.map(r => r.code),
                    },
                }).where(eq(SyncRun.id, syncRunId));
            } catch {
                // SyncRun update must never break the response
            }
        }

        return res.status(200).json({
            period,
            rights,
            meta: {
                source: 'openfisca',
                engineVersion: 'france-latest',
                requestId,
                duration_ms: duration,
            },
        });
    } catch (err) {
        const duration = Date.now() - start;
        logger.error('[Diagnostic] ERROR', {
            requestId,
            duration_ms: duration,
            code: err.code || 'UNKNOWN',
            message: err.message,
        });

        // ── Phase 2: SyncRun failure ──
        if (syncRunId) {
            try {
                await db.update(SyncRun).set({
                    status: 'failed',
                    ended_at: new Date(),
                    error: `${err.code || 'UNKNOWN'}: ${err.message}`.slice(0, 500),
                    stats: { requestId, duration_ms: duration },
                }).where(eq(SyncRun.id, syncRunId));
            } catch {
                // SyncRun update must never break the error response
            }
        }

        Sentry.captureException(err, {
            extra: { requestId, phase: 'diagnostic', duration_ms: duration },
        });

        // Graceful error responses
        if (err.fallback) {
            return res.status(503).json({
                error: err.message,
                fallback: true,
                requestId,
            });
        }

        if (err.code === 'OPENFISCA_TIMEOUT' || err.code === 'OPENFISCA_NETWORK_ERROR') {
            return res.status(503).json({
                error: 'OPENFISCA_UNAVAILABLE',
                message: 'Le service de calcul est temporairement indisponible. Veuillez réessayer dans quelques instants.',
                requestId,
            });
        }

        if (err.status >= 400 && err.status < 500) {
            return res.status(422).json({
                error: 'OPENFISCA_INVALID_INPUT',
                message: 'Les données fournies ne sont pas compatibles avec le moteur de calcul.',
                detail: err.detail,
                requestId,
            });
        }

        return res.status(503).json({
            error: 'DIAGNOSTIC_ERROR',
            message: 'Une erreur est survenue lors du calcul. Veuillez réessayer.',
            requestId,
        });
    }
}

async function handleTrace(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed', allowed: ['POST'] });
    }

    // Pro/admin authentication check
    const authHeader = req.headers.authorization || '';
    const adminToken = process.env.ADMIN_TOKEN;
    const isAdmin = adminToken && authHeader === `Bearer ${adminToken}`;

    // Also check for pro session (cookie-based auth)
    const proId = req.proId; // Set by auth middleware if pro is logged in

    if (!isAdmin && !proId) {
        return res.status(403).json({
            error: 'access_denied',
            message: 'L\'accès au détail du calcul est réservé aux professionnels.',
        });
    }

    const requestId = generateRequestId();

    try {
        let body;
        if (typeof req.body === 'object' && req.body !== null) {
            body = req.body;
        } else if (typeof req.body === 'string') {
            body = JSON.parse(req.body);
        } else {
            return res.status(400).json({ error: 'invalid_body', requestId });
        }

        const { answers } = body;
        const errors = validateAnswers(answers);
        if (errors.length > 0) {
            return res.status(400).json({ error: 'validation_error', details: errors, requestId });
        }

        const period = getCurrentPeriod();
        const situation = buildTestCase(answers, period);

        const result = await traceCall(situation);

        // Return a summary of the trace (not the full graph)
        const traceSummary = {
            requestedCalculations: result.requestedCalculations || [],
            entitiesDescription: result.entitiesDescription || {},
            nodesCount: result.trace ? Object.keys(result.trace).length : 0,
        };

        return res.status(200).json({
            period,
            traceSummary,
            fullTrace: result.trace || null,
            meta: { requestId, source: 'openfisca-trace' },
        });
    } catch (err) {
        logger.error('[Diagnostic/Trace] ERROR', { requestId, message: err.message });

        Sentry.captureException(err, {
            extra: { requestId, phase: 'diagnostic-trace' },
        });

        if (err.message?.includes('disabled')) {
            return res.status(503).json({
                error: 'TRACE_DISABLED',
                message: 'Le mode trace est désactivé dans cet environnement.',
                requestId,
            });
        }

        if (err.fallback) {
            return res.status(503).json({
                error: err.message,
                fallback: true,
                requestId,
            });
        }

        return res.status(503).json({
            error: 'OPENFISCA_UNAVAILABLE',
            message: 'Le service de calcul est temporairement indisponible.',
            requestId,
        });
    }
}
