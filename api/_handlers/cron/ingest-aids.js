import { isCronAuthorized } from '../../_utils/cronAuth.js';
import prisma from '../../_utils/prisma.js';
import crypto from 'crypto';
import { logger } from '../../lib/logger.js';
import Sentry from '../../_utils/sentry.js';

// Import connectors
const GrandEstConnector = require('../../lib/ingestion/connectors/grandest.js');
const AgefiphConnector = require('../../lib/ingestion/connectors/agefiph.js');

function slugify(text) {
    if (!text) return '';
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

/**
 * Upsert aide with deduplication via stableId (hash of source_url)
 * @param {Object} aide
 * @param {string} stableId
 * @returns {Promise<Object>} { created: boolean, updated: boolean }
 */
async function upsertAide(aide, stableId) {
    // Check if exists by stableId OR slug OR source_url
    const existing = await prisma.aide.findFirst({
        where: {
            OR: [
                { slug: aide.slug },
                { source_url: aide.source_url },
            ]
        }
    });

    if (existing) {
        // Update
        await prisma.aide.update({
            where: { id: existing.id },
            data: {
                titre: aide.title,
                summary_falc: aide.summary,
                description: aide.description,
                conditions: aide.conditions,
                montant_avantage: aide.montant_avantage,
                steps: aide.steps,
                pieces_a_fournir: aide.pieces_a_fournir,
                providerName: aide.organisme,
                public: aide.public,
                theme: aide.theme,
                sous_theme: aide.sous_theme,
                territoire_niveau: aide.territoire_niveau,
                territoire_codes: aide.territoire_codes,
                territoire_label: aide.territoire_label,
                urgent: aide.urgent,
                statut: aide.statut,
                source_url: aide.source_url,
                apply_url: aide.apply_url,
                source_domain: aide.source_domain,
                fetched_at: aide.fetched_at,
                source_last_modified: aide.source_last_modified,
                tags: aide.tags,
                contacts: aide.contacts,
                falc_summary: aide.falc_summary,
                falc_steps: aide.falc_steps,
                published_at: new Date(),
            }
        });
        return { created: false, updated: true };
    } else {
        // Create
        await prisma.aide.create({
            data: {
                slug: aide.slug,
                titre: aide.title,
                summary_falc: aide.summary,
                description: aide.description,
                conditions: aide.conditions,
                montant_avantage: aide.montant_avantage,
                steps: aide.steps,
                pieces_a_fournir: aide.pieces_a_fournir,
                providerName: aide.organisme,
                public: aide.public,
                theme: aide.theme,
                sous_theme: aide.sous_theme,
                territoire_niveau: aide.territoire_niveau,
                territoire_codes: aide.territoire_codes,
                territoire_label: aide.territoire_label,
                urgent: aide.urgent,
                statut: aide.statut,
                source_url: aide.source_url,
                apply_url: aide.apply_url,
                source_domain: aide.source_domain,
                fetched_at: aide.fetched_at,
                source_last_modified: aide.source_last_modified,
                tags: aide.tags,
                contacts: aide.contacts,
                falc_summary: aide.falc_summary,
                falc_steps: aide.falc_steps,
                published_at: new Date(),
            }
        });
        return { created: true, updated: false };
    }
}

/**
 * Pure ingestion logic for Aids (NEW VERSION with connectors)
 * @param {Object} params
 * @param {number} params.limit
 * @param {string} params.runId
 * @param {string} params.source - 'all' | 'grandest' | 'agefiph'
 * @returns {Promise<Object>} stats
 */
export async function runIngestAids({ limit, runId, source = 'all' }) {
    if (!runId) runId = crypto.randomUUID();

    Sentry.setTags({ runId, handler: 'ingest-aids', source });
    Sentry.addBreadcrumb({
        category: 'ingestion',
        message: 'INGEST_AIDS_START',
        level: 'info',
        data: { runId, source, limit }
    });
    logger.info('INGEST_AIDS_START', { runId, source, limit });

    const stats = {
        fetched: 0,
        processed: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: [],
        durationByStage: {
            fetchMs: 0,
            processingMs: 0
        }
    };

    const startTotal = Date.now();

    // Initialize connectors
    const connectors = [];
    if (source === 'all' || source === 'grandest') {
        logger.info('INGEST_AIDS_CONNECTOR_ADD', { runId, connector: 'GrandEst' });
        Sentry.addBreadcrumb({
            category: 'ingestion',
            message: 'INGEST_AIDS_CONNECTOR_ADD',
            level: 'info',
            data: { runId, connector: 'GrandEst' }
        });
        connectors.push(new GrandEstConnector());
    }
    if (source === 'all' || source === 'agefiph') {
        logger.info('INGEST_AIDS_CONNECTOR_ADD', { runId, connector: 'AGEFIPH' });
        Sentry.addBreadcrumb({
            category: 'ingestion',
            message: 'INGEST_AIDS_CONNECTOR_ADD',
            level: 'info',
            data: { runId, connector: 'AGEFIPH' }
        });
        connectors.push(new AgefiphConnector());
    }

    if (connectors.length === 0) {
        logger.error('INGEST_AIDS_NO_CONNECTORS', { runId, source });
        Sentry.addBreadcrumb({
            category: 'ingestion',
            message: 'INGEST_AIDS_NO_CONNECTORS',
            level: 'error',
            data: { runId, source }
        });
        Sentry.captureMessage('No connectors selected for ingestion', {
            level: 'error',
            tags: { runId, source }
        });
        stats.errors.push('No connectors selected');
        return stats;
    }

    const startFetch = Date.now();
    Sentry.addBreadcrumb({
        category: 'ingestion',
        message: 'INGEST_AIDS_FETCH_START',
        level: 'info',
        data: { runId, connectorCount: connectors.length }
    });
    logger.info('INGEST_AIDS_FETCH_START', { runId, connectorCount: connectors.length });

    // Run connectors in parallel
    const ingestionResults = await Promise.allSettled(
        connectors.map(connector => connector.ingest())
    );

    stats.durationByStage.fetchMs = Date.now() - startFetch;

    // Aggregate results
    const allAides = [];
    for (let i = 0; i < ingestionResults.length; i++) {
        const result = ingestionResults[i];
        const connectorName = connectors[i].constructor.name;

        if (result.status === 'fulfilled') {
            const { aides, errors: connectorErrors } = result.value;
            logger.info('INGEST_AIDS_CONNECTOR_SUCCESS', {
                runId,
                connector: connectorName,
                count: aides.length,
                errors: connectorErrors.length
            });
            Sentry.addBreadcrumb({
                category: 'ingestion',
                message: 'INGEST_AIDS_CONNECTOR_SUCCESS',
                level: 'info',
                data: { runId, connector: connectorName, count: aides.length, errors: connectorErrors.length }
            });
            allAides.push(...aides);
            stats.errors.push(...connectorErrors.map(e => `${connectorName}:${e.rawItem?.url || 'unknown'}: ${e.error}`));
        } else {
            logger.error('INGEST_AIDS_CONNECTOR_FAILED', {
                runId,
                connector: connectorName,
                error: result.reason?.message || result.reason
            });
            Sentry.addBreadcrumb({
                category: 'ingestion',
                message: 'INGEST_AIDS_CONNECTOR_FAILED',
                level: 'error',
                data: { runId, connector: connectorName, error: result.reason?.message }
            });
            Sentry.captureException(result.reason, {
                tags: { runId, connector: connectorName },
                extra: { source }
            });
            stats.errors.push(`${connectorName} failed: ${result.reason}`);
        }
    }

    stats.fetched = allAides.length;
    Sentry.addBreadcrumb({
        category: 'ingestion',
        message: 'INGEST_AIDS_FETCH_DONE',
        level: 'info',
        data: { runId, fetched: stats.fetched, fetch_duration_ms: stats.durationByStage.fetchMs }
    });
    logger.info('INGEST_AIDS_FETCH_DONE', {
        runId,
        fetched: stats.fetched,
        fetch_duration_ms: stats.durationByStage.fetchMs
    });

    // Limit support
    let aidesToProcess = allAides;
    if (limit && limit > 0) {
        aidesToProcess = allAides.slice(0, limit);
        logger.info('INGEST_AIDS_LIMIT_APPLIED', { runId, limit, total: allAides.length });
    }

    const startProcess = Date.now();
    Sentry.addBreadcrumb({
        category: 'ingestion',
        message: 'INGEST_AIDS_PROCESS_START',
        level: 'info',
        data: { runId, count: aidesToProcess.length }
    });
    logger.info('INGEST_AIDS_PROCESS_START', { runId, count: aidesToProcess.length });

    // Upsert aides
    for (const aide of aidesToProcess) {
        stats.processed++;
        try {
            const result = await upsertAide(aide, aide._stableId);
            if (result.created) {
                stats.created++;
                logger.info('INGEST_AIDS_CREATED', { runId, slug: aide.slug, source_url: aide.source_url });
            }
            if (result.updated) {
                stats.updated++;
                logger.info('INGEST_AIDS_UPDATED', { runId, slug: aide.slug, source_url: aide.source_url });
            }
        } catch (procErr) {
            logger.error('INGEST_AIDS_UPSERT_ERROR', {
                runId,
                slug: aide.slug,
                error: procErr.message,
                stack: procErr.stack
            });
            Sentry.addBreadcrumb({
                category: 'ingestion',
                message: 'INGEST_AIDS_UPSERT_ERROR',
                level: 'error',
                data: { runId, slug: aide.slug, error: procErr.message }
            });
            Sentry.captureException(procErr, {
                tags: { runId, slug: aide.slug },
                extra: { source_url: aide.source_url }
            });
            stats.errors.push(`Upsert ${aide.slug}: ${procErr.message}`);
        }
    }

    stats.durationByStage.processingMs = Date.now() - startProcess;
    Sentry.addBreadcrumb({
        category: 'ingestion',
        message: 'INGEST_AIDS_PROCESS_DONE',
        level: 'info',
        data: {
            runId,
            processed: stats.processed,
            created: stats.created,
            updated: stats.updated,
            process_duration_ms: stats.durationByStage.processingMs
        }
    });
    logger.info('INGEST_AIDS_PROCESS_DONE', {
        runId,
        processed: stats.processed,
        created: stats.created,
        updated: stats.updated,
        process_duration_ms: stats.durationByStage.processingMs
    });

    // Log the Run
    try {
        await prisma.importLog.create({
            data: {
                source_name: `CRON_AIDS_${source.toUpperCase()}`,
                status: stats.errors.length > 0 ? 'PARTIAL' : 'SUCCESS',
                items_new: stats.created,
                items_total: stats.processed,
                logs: stats.errors.length ? JSON.stringify(stats.errors.slice(0, 100)) : null,
                duration_ms: Date.now() - startTotal
            }
        });
    } catch (e) {
        logger.warn('INGEST_AIDS_LOG_FAILED', { runId, error: e.message });
    }

    const totalDuration = Date.now() - startTotal;
    const finalStats = {
        fetched: stats.fetched,
        processed: stats.processed,
        created: stats.created,
        updated: stats.updated,
        errors: stats.errors.length
    };
    Sentry.addBreadcrumb({
        category: 'ingestion',
        message: 'INGEST_AIDS_DONE',
        level: stats.errors.length > 0 ? 'warning' : 'info',
        data: { runId, stats: finalStats, duration_ms: totalDuration }
    });
    logger.info('INGEST_AIDS_DONE', {
        runId,
        stats: finalStats,
        duration_ms: totalDuration
    });

    // Report high error rate to Sentry
    if (stats.errors.length > 0) {
        const errorRate = stats.errors.length / (stats.processed || 1);
        if (errorRate > 0.1) { // > 10% error rate
            Sentry.captureMessage('High error rate during ingestion', {
                level: 'warning',
                tags: { runId, source },
                extra: { stats: finalStats, errorRate, duration_ms: totalDuration }
            });
        }
    }

    return stats;
}

export default async function handler(req, res) {
    if (!isCronAuthorized(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
    const source = req.query.source || 'all'; // all | grandest | agefiph

    try {
        const stats = await runIngestAids({ limit, runId: crypto.randomUUID(), source });
        return res.status(200).json(stats);
    } catch (error) {
        console.error('Ingest Aids Handler Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
