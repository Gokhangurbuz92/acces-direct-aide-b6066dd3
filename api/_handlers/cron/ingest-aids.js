import { isCronAuthorized } from '../../_utils/cronAuth.js';
import crypto from 'crypto';
import { logger } from '../../lib/logger.js';
import * as Sentry from '@sentry/node';
import { runIngestion } from '../../lib/ingestion-pipeline.js';

export async function runIngestAids({ limit, runId, wipe = false, sources = 'all', dryRun = false }) {
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
            // 1. Crawl (Fetch)
            const startCrawl = Date.now();
            let urls = [];
            try {
                urls = await connector.getDetailUrls();
            } catch (e) {
                logger.error(`CONNECTOR_CRAWL_ERROR`, { runId, connector: connector.name, error: e });
                stats.errors.push(`${connector.name} crawl error: ${e.message}`);
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

                    const slug = slugify(`${connector.name}-${item.title}`);
                    const contentHash = crypto.createHash('md5').update(JSON.stringify(item)).digest('hex');

    try {
        // Use new ingestion pipeline
        const stats = await runIngestion({
            sources,
            dryRun
        });

        return stats;
    } catch (error) {
        logger.error('INGEST_AIDS_ERROR', { runId, error });
        throw error;
    }
}

export default async function handler(req, res) {
    if (!isCronAuthorized(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
    const wipe = req.query.wipe === 'true';
    const sources = req.query.sources || 'all';
    const dryRun = req.query.dryRun === 'true';
    const runId = crypto.randomUUID();

    try {
        const stats = await runIngestAids({ limit, runId, wipe, sources, dryRun });
        return res.status(200).json(stats);
    } catch (error) {
        logger.error('Ingest Aids Handler Error', { runId, error });
        Sentry.captureException(error, { extra: { runId } });
        return res.status(500).json({ error: error.message });
    }
}
