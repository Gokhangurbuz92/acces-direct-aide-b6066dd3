/**
 * Ingestion Pipeline
 * Idempotent pipeline for ingesting aides from multiple sources
 */

import { getConnector, getAllConnectors } from './connectors/index.js';
import prisma from '../_utils/prisma.js';
import { logger } from './logger.js';
import * as Sentry from '@sentry/node';

export class IngestionPipeline {
    constructor(options = {}) {
        this.dryRun = options.dryRun || false;
        this.sources = options.sources || 'all';
        this.stats = {
            fetched: 0,
            created: 0,
            updated: 0,
            skipped: 0,
            errors: []
        };
    }

    /**
     * Run the ingestion pipeline
     */
    async run() {
        const startTime = Date.now();
        logger.info('INGESTION_START', { dryRun: this.dryRun, sources: this.sources });

        try {
            // Get connectors to run
            const connectors = this.sources === 'all' 
                ? getAllConnectors() 
                : [getConnector(this.sources)];

            for (const connector of connectors) {
                await this.ingestFromConnector(connector);
            }

            const duration = Date.now() - startTime;
            logger.info('INGESTION_COMPLETE', { 
                ...this.stats, 
                duration_ms: duration 
            });

            // Log to database
            if (!this.dryRun) {
                await this.logRun(duration, 'success');
            }

            return this.stats;
        } catch (error) {
            const duration = Date.now() - startTime;
            logger.error('INGESTION_ERROR', { error, duration_ms: duration });
            Sentry.captureException(error);

            if (!this.dryRun) {
                await this.logRun(duration, 'error');
            }

            throw error;
        }
    }

    /**
     * Ingest from a single connector
     */
    async ingestFromConnector(connector) {
        logger.info('CONNECTOR_START', { name: connector.name });
        
        try {
            // Fetch raw items
            const rawItems = await connector.fetch();
            this.stats.fetched += rawItems.length;

            logger.info('CONNECTOR_FETCHED', { 
                name: connector.name, 
                count: rawItems.length 
            });

            // Process each item
            for (const rawItem of rawItems) {
                try {
                    await this.processItem(connector, rawItem);
                } catch (error) {
                    logger.error('ITEM_PROCESS_ERROR', { 
                        connector: connector.name, 
                        error: error.message 
                    });
                    this.stats.errors.push({
                        connector: connector.name,
                        error: error.message
                    });
                }
            }

            logger.info('CONNECTOR_COMPLETE', { 
                name: connector.name,
                created: this.stats.created,
                updated: this.stats.updated,
                skipped: this.stats.skipped
            });
        } catch (error) {
            logger.error('CONNECTOR_ERROR', { 
                name: connector.name, 
                error: error.message 
            });
            this.stats.errors.push({
                connector: connector.name,
                error: error.message
            });
        }
    }

    /**
     * Process a single item
     */
    async processItem(connector, rawItem) {
        // Parse
        const parsedItem = connector.parse(rawItem);
        
        // Map to Aide model
        const aideData = connector.mapToAide(parsedItem);
        
        // Get stable ID for deduplication
        const stableId = connector.getStableId(parsedItem);

        if (this.dryRun) {
            logger.info('DRY_RUN_ITEM', { 
                titre: aideData.titre, 
                stableId 
            });
            this.stats.created++;
            return;
        }

        // Check if exists
        const existing = await prisma.aide.findFirst({
            where: {
                OR: [
                    { content_hash: aideData.content_hash },
                    { source_url_exact: aideData.source_url_exact },
                    { slug: aideData.slug }
                ]
            }
        });

        if (existing) {
            // Update if content changed
            if (existing.content_hash !== aideData.content_hash) {
                await prisma.aide.update({
                    where: { id: existing.id },
                    data: {
                        ...aideData,
                        updatedAt: new Date(),
                        updatedBy: 'ingestion-pipeline'
                    }
                });
                this.stats.updated++;
                logger.info('AIDE_UPDATED', { 
                    id: existing.id, 
                    titre: aideData.titre 
                });
            } else {
                this.stats.skipped++;
                logger.debug('AIDE_SKIPPED', { 
                    id: existing.id, 
                    titre: aideData.titre 
                });
            }
        } else {
            // Create new
            const created = await prisma.aide.create({
                data: {
                    ...aideData,
                    updatedBy: 'ingestion-pipeline'
                }
            });
            this.stats.created++;
            logger.info('AIDE_CREATED', { 
                id: created.id, 
                titre: aideData.titre 
            });
        }
    }

    /**
     * Log run to database
     */
    async logRun(duration, status) {
        try {
            await prisma.updateLog.create({
                data: {
                    ran_at: new Date(),
                    status,
                    duration_ms: duration,
                    items_fetched_count: this.stats.fetched,
                    items_created_count: this.stats.created,
                    items_updated_count: this.stats.updated,
                    items_skipped_count: this.stats.skipped,
                    errors: this.stats.errors.map(e => `${e.connector}: ${e.error}`),
                    source_name: this.sources === 'all' ? 'all' : this.sources,
                    is_dry_run: this.dryRun
                }
            });
        } catch (error) {
            logger.error('LOG_RUN_ERROR', { error });
        }
    }
}

/**
 * Run ingestion pipeline
 */
export async function runIngestion(options = {}) {
    const pipeline = new IngestionPipeline(options);
    return await pipeline.run();
}
