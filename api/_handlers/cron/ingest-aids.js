import { isCronAuthorized } from '../../_utils/cronAuth.js';
import prisma from '../../_utils/prisma.js';
import crypto from 'crypto';
import { logger } from '../../lib/logger.js';
import * as Sentry from '@sentry/node';
import { GrandEstConnector } from '../../lib/ingestion/GrandEstConnector.js';
import { AgefiphConnector } from '../../lib/ingestion/AgefiphConnector.js';

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

export async function runIngestAids({ limit, runId, wipe = false }) {
    if (!runId) runId = crypto.randomUUID();

    logger.info('INGEST_AIDS_START', { runId, wipe, limit });

    const stats = {
        fetched: 0,
        processed: 0,
        created: 0,
        updated: 0,
        skippedExisting: 0,
        errors: [],
        durationByStage: {
            crawlMs: 0,
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
            stats.errors.push(`Wipe failed: ${e.message}`);
        }
    }

    const connectors = [
        new GrandEstConnector(),
        new AgefiphConnector()
    ];

    for (const connector of connectors) {
        logger.info(`CONNECTOR_START`, { runId, connector: connector.name });

        try {
            // 1. Crawl
            const startCrawl = Date.now();
            let urls = [];
            try {
                urls = await connector.getDetailUrls();
            } catch (e) {
                logger.error(`CONNECTOR_CRAWL_ERROR`, { runId, connector: connector.name, error: e });
                stats.errors.push(`${connector.name} crawl error: ${e.message}`);
                continue;
            }
            stats.durationByStage.crawlMs += (Date.now() - startCrawl);
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

                    const slug = slugify(`${connector.name}-${item.title}`);
                    const contentHash = crypto.createHash('md5').update(JSON.stringify(item)).digest('hex');

                    // Idempotency: Upsert by slug (or source_url)
                    // We prioritize source_url for uniqueness if possible, but slug is the DB unique key.
                    // Let's rely on slug.

                    const existing = await prisma.aide.findFirst({
                        where: {
                            OR: [
                                { slug },
                                { source_url: item.source_url }
                            ]
                        }
                    });

                    const data = {
                        titre: item.title,
                        summary_falc: item.description,
                        cest_quoi: item.content,
                        providerName: connector.name,
                        providerType: 'ingest', // Explicitly set type
                        source_url: item.source_url,
                        apply_url: item.apply_url,
                        theme: item.theme,
                        fetched_at: item.fetched_at,
                        statut: 'publie',
                        published_at: new Date(),
                        content_hash: contentHash
                    };

                    if (existing) {
                        if (existing.content_hash !== contentHash) {
                             await prisma.aide.update({
                                where: { id: existing.id },
                                data: { ...data, updatedAt: new Date() }
                            });
                            stats.updated++;
                        } else {
                            stats.skippedExisting++;
                        }
                    } else {
                        // Ensure slug uniqueness
                        let finalSlug = slug;
                        if (await prisma.aide.count({ where: { slug: finalSlug } }) > 0) {
                            finalSlug = `${slug}-${crypto.randomBytes(2).toString('hex')}`;
                        }

                        await prisma.aide.create({
                            data: {
                                ...data,
                                slug: finalSlug
                            }
                        });
                        stats.created++;
                    }

                } catch (itemErr) {
                    logger.error(`ITEM_PROCESS_ERROR`, { runId, url, error: itemErr });
                    stats.errors.push(`${url}: ${itemErr.message}`);
                }
            }
            stats.durationByStage.processingMs += (Date.now() - startProcess);

        } catch (connErr) {
             logger.error(`CONNECTOR_ERROR`, { runId, connector: connector.name, error: connErr });
             stats.errors.push(`${connector.name} fatal: ${connErr.message}`);
        }

        logger.info(`CONNECTOR_END`, { runId, connector: connector.name });
    }

    const durationTotal = Date.now() - startTotal;
    logger.info('INGEST_AIDS_END', { runId, stats, duration_ms: durationTotal });

    // Log the Run
    try {
        await prisma.importLog.create({
            data: {
                source_name: 'CRON_AIDS',
                status: stats.errors.length > 0 ? 'PARTIAL' : 'SUCCESS',
                items_new: stats.created,
                items_total: stats.processed,
                logs: stats.errors.length ? JSON.stringify(stats.errors) : null,
                duration_ms: durationTotal
            }
        });
    } catch (e) { /* ignore */ }

    return stats;
}

export default async function handler(req, res) {
    if (!isCronAuthorized(req)) {
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
        return res.status(500).json({ error: error.message });
    }
}
