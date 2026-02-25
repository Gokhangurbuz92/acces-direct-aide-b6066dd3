import { getCronAuth } from '../../_utils/cronAuth.js';
import prisma from '../../_utils/prisma.js';
import crypto from 'crypto';
import { logger } from '../../lib/logger.js';
import * as Sentry from '@sentry/node';
import { GrandEstConnector } from '../../lib/ingestion/GrandEstConnector.js';
import { AgefiphConnector } from '../../lib/ingestion/AgefiphConnector.js';
import { AidesTerritoiresConnector } from '../../lib/ingestion/AidesTerritoiresConnector.js';
import { DreesConnector } from '../../lib/ingestion/DreesConnector.js';
import { computeContentHash } from '../../_utils/contentHash.js';
import { ensureSlugOrNull } from '../../_utils/slug.js';
import { upsertSourceDocument } from '../../_utils/sourceDocument.js';

/**
 * @param {unknown} error
 * @returns {string}
 */
function getErrorMessage(error) {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return 'unknown error';
}

/**
 * @param {{ limit?: number, runId?: string, wipe?: boolean }} params
 * @returns {Promise<{ fetched: number, processed: number, created: number, updated: number, skippedExisting: number, errors: string[], durationByStage: { fetchMs: number, processingMs: number } }>}
 */
export async function runIngestAids({ limit, runId, wipe = false }) {
    if (!runId) runId = crypto.randomUUID();

    logger.info('INGEST_AIDS_START', { runId, wipe, limit });

    /** @type {{ fetched: number, processed: number, created: number, updated: number, skippedExisting: number, errors: string[], durationByStage: { fetchMs: number, processingMs: number } }} */
    const stats = {
        fetched: 0,
        processed: 0,
        created: 0,
        updated: 0,
        skippedExisting: 0,
        errors: [],
        durationByStage: {
            fetchMs: 0,
            processingMs: 0
        }
    };

    const startTotal = Date.now();

    // Wipe if requested
    if (wipe) {
        try {
            logger.warn('INGEST_AIDS_WIPE_START', { runId });
            // Wipe ingested items (providerType = 'ingest' or providerName in known list)
            // Or wipe all non-manual if we stick to that convention.
            // Safe approach: delete where providerType = 'ingest'.
            await prisma.aide.deleteMany({
                where: {
                    OR: [
                        { providerType: 'ingest' },
                        { providerType: null } // Assume nulls are also targets if we are wiping everything non-manual
                    ]
                }
            });
            logger.warn('INGEST_AIDS_WIPE_DONE', { runId });
        } catch (e) {
            logger.error('INGEST_AIDS_WIPE_ERROR', { runId, error: e });
            stats.errors.push(`Wipe failed: ${getErrorMessage(e)}`);
        }
    }

    const connectors = [
        new GrandEstConnector(),
        new AgefiphConnector(),
        new AidesTerritoiresConnector(),
        new DreesConnector(),
    ];

    for (const connector of connectors) {
        logger.info(`CONNECTOR_START`, { runId, connector: connector.name });

        try {
            // 1. Crawl (Fetch)
            const startCrawl = Date.now();
            let urls = [];
            try {
                urls = await connector.getDetailUrls();
            } catch (e) {
                logger.error(`CONNECTOR_CRAWL_ERROR`, { runId, connector: connector.name, error: e });
                stats.errors.push(`${connector.name} crawl error: ${getErrorMessage(e)}`);

                // Enhanced Sentry context for connector crawl errors
                Sentry.captureException(e, {
                    tags: {
                        connector: connector.name,
                        runId: runId,
                        stage: 'crawl'
                    },
                    extra: {
                        connectorName: connector.name
                    }
                });
                continue;
            }
            stats.durationByStage.fetchMs += (Date.now() - startCrawl);
            logger.info(`CONNECTOR_CRAWL_DONE`, { runId, connector: connector.name, count: urls.length });

            // Limit
            if (limit && limit > 0) {
                urls = urls.slice(0, limit);
            }

            // 2. Process
            const startProcess = Date.now();
            for (const url of urls) {
                stats.processed++;
                try {
                    const html = await connector.fetch(url);
                    const item = await connector.parse(html, url);

                    if (!item.title) {
                        stats.errors.push(`Skipped ${url}: No title`);
                        continue;
                    }

                    // Data normalization: trim all text fields
                    const normalizedItem = {
                        title: item.title?.trim() || '',
                        description: item.description?.trim() || '',
                        content: item.content?.trim() || '',
                        source_url: item.source_url?.trim() || '',
                        apply_url: item.apply_url?.trim() || '',
                        theme: item.theme?.trim() || '',
                        fetched_at: item.fetched_at || new Date()
                    };

                    const baseSlug = ensureSlugOrNull(`${connector.name}-${normalizedItem.title}`);
                    const contentHash = computeContentHash({
                        title: normalizedItem.title,
                        description: normalizedItem.description,
                        content: normalizedItem.content,
                        source_url: normalizedItem.source_url,
                        apply_url: normalizedItem.apply_url,
                        theme: normalizedItem.theme,
                        connector: connector.name,
                    });

                    let sourceDocumentId = null;
                    try {
                        const sourceDocument = await upsertSourceDocument(prisma, {
                            sourceUrl: normalizedItem.source_url || url,
                            rawContent: typeof html === 'string' ? html.slice(0, 20000) : JSON.stringify(item),
                            metadata: {
                                entityType: 'aide',
                                connector: connector.name,
                                parserVersion: 'connector-v1',
                            },
                        });
                        sourceDocumentId = sourceDocument.id;
                    } catch {
                        stats.errors.push(`${url}: source document failed`);
                        logger.warn('INGEST_AIDS_SOURCE_DOCUMENT_FAIL', { runId, connector: connector.name });
                    }

                    // Idempotency: Upsert by slug (or source_url)
                    // We prioritize source_url for uniqueness if possible, but slug is the DB unique key.
                    // Let's rely on slug.

                    const existing = await prisma.aide.findFirst({
                        where: {
                            OR: [
                                ...(baseSlug ? [{ slug: baseSlug }] : []),
                                ...(normalizedItem.source_url ? [{ source_url: normalizedItem.source_url }] : []),
                            ],
                        }
                    });

                    const data = {
                        titre: normalizedItem.title,
                        summary_falc: normalizedItem.description,
                        cest_quoi: normalizedItem.content,
                        providerName: connector.name,
                        providerType: 'ingest', // Explicitly set type
                        source_url: normalizedItem.source_url,
                        source_url_exact: normalizedItem.source_url, // Exact URL for traceability
                        apply_url: normalizedItem.apply_url,
                        theme: normalizedItem.theme,
                        fetched_at: normalizedItem.fetched_at,
                        retrieved_at: normalizedItem.fetched_at, // Original fetch timestamp
                        last_checked_at: new Date(), // Current check timestamp
                        statut: 'publie',
                        published_at: new Date(),
                        content_hash: contentHash,
                        source_document_id: sourceDocumentId,
                    };

                    if (existing) {
                        if (existing.content_hash !== contentHash || (existing.source_document_id || null) !== sourceDocumentId) {
                            await prisma.aide.update({
                                where: { id: existing.id },
                                data
                            });
                            stats.updated++;
                        } else {
                            stats.skippedExisting++;
                        }
                    } else {
                        // Ensure deterministic slug uniqueness.
                        let finalSlug = baseSlug;
                        if (finalSlug && (await prisma.aide.count({ where: { slug: finalSlug } })) > 0) {
                            finalSlug = ensureSlugOrNull(`${finalSlug}-${contentHash.slice(0, 6)}`);
                        }

                        await prisma.aide.create({
                            data: {
                                ...data,
                                slug: finalSlug || null
                            }
                        });
                        stats.created++;
                    }

                } catch (itemErr) {
                    logger.error(`ITEM_PROCESS_ERROR`, { runId, url, error: itemErr });
                    stats.errors.push(`${url}: ${getErrorMessage(itemErr)}`);

                    // Enhanced Sentry context for item-level errors
                    Sentry.captureException(itemErr, {
                        tags: {
                            connector: connector.name,
                            runId: runId,
                            stage: 'item_processing'
                        },
                        extra: {
                            url: url
                        }
                    });
                }
            }
            stats.durationByStage.processingMs += (Date.now() - startProcess);

        } catch (connErr) {
            logger.error(`CONNECTOR_ERROR`, { runId, connector: connector.name, error: connErr });
            stats.errors.push(`${connector.name} fatal: ${getErrorMessage(connErr)}`);

            // Enhanced Sentry context for fatal connector errors
            Sentry.captureException(connErr, {
                tags: {
                    connector: connector.name,
                    runId: runId,
                    stage: 'connector_fatal'
                },
                extra: {
                    connectorName: connector.name,
                    stats: stats
                }
            });
        }

        logger.info(`CONNECTOR_END`, { runId, connector: connector.name });
    }

    const durationTotal = Date.now() - startTotal;

    // Detect silent failures: no items processed and no errors
    if (stats.processed === 0 && stats.errors.length === 0) {
        const silentFailureError = new Error('Silent failure: No items processed and no errors reported');
        logger.error('INGEST_AIDS_SILENT_FAILURE', { runId, stats });
        Sentry.captureException(silentFailureError, {
            tags: { runId, stage: 'validation' },
            extra: { stats }
        });
        stats.errors.push('Silent failure detected: No items processed');
    }

    logger.info('INGEST_AIDS_END', { runId, stats, duration_ms: durationTotal });

    // Log the Run with enhanced traceability
    try {
        await prisma.importLog.create({
            data: {
                run_id: runId, // Unique run identifier
                source_name: 'CRON_AIDS',
                status: stats.errors.length > 0 ? 'PARTIAL' : 'SUCCESS',
                items_new: stats.created,
                items_updated: stats.updated,
                items_skipped: stats.skippedExisting,
                items_total: stats.processed,
                error_count: stats.errors.length,
                logs: stats.errors.length ? JSON.stringify(stats.errors) : null,
                duration_ms: durationTotal
            }
        });
    } catch (e) {
        logger.error('IMPORT_LOG_ERROR', { runId, error: e });
    }

    return stats;
}
/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */

export default async function handler(req, res) {
    const auth = getCronAuth(req);
    if (!auth.ok) {
        if (auth.reason === 'missing_secret') {
            return res.status(500).json({ error: 'CRON_SECRET is not configured' });
        }
        logger.warn("Unauthorized Ingest-Aids Attempt");
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
    const wipe = req.query.wipe === 'true';
    const runId = crypto.randomUUID();

    try {
        const stats = await runIngestAids({ limit, runId, wipe });
        return res.status(200).json(stats);
    } catch (error) {
        logger.error('Ingest Aids Handler Error', { runId, error });
        Sentry.captureException(error, { extra: { runId } });
        return res.status(500).json({ error: 'Internal Server Error', runId });
    }
}
