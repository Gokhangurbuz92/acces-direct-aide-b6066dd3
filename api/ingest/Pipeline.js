// api/ingest/Pipeline.js
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * Core Ingestion Pipeline Logic.
 * Handles:
 * - Idempotence (using hash)
 * - SourceSnapshot creation (Audit Trail)
 * - Upsert logic (Aide, Structure, etc.)
 */
export default class Pipeline {
    constructor(sourceName, connector) {
        this.sourceName = sourceName;
        this.connector = connector;
        this.stats = {
            total: 0,
            created: 0,
            updated: 0,
            skipped: 0,
            errors: []
        };
    }

    /**
     * Runs the ingestion process for the configured connector.
     */
    async run() {
        console.log(`[Pipeline] Starting ingestion for source: ${this.sourceName}`);

        try {
            const items = await this.connector.fetchItems();
            this.stats.total = items.length;
            console.log(`[Pipeline] Fetched ${items.length} items.`);

            for (const item of items) {
                try {
                    await this.processItem(item);
                } catch (err) {
                    console.error(`[Pipeline] Error processing item ${item.slug || 'unknown'}:`, err);
                    this.stats.errors.push({
                        item: item.slug,
                        error: err.message
                    });
                }
            }

        } catch (err) {
             console.error(`[Pipeline] Fatal error for source ${this.sourceName}:`, err);
             this.stats.errors.push({ error: "Fatal Connector Error", details: err.message });
        }

        await this.logRun();
        return this.stats;
    }

    /**
     * Processes a single standardized item.
     * Checks hash for changes, upserts entity, and creates audit snapshot.
     */
    async processItem(item) {
        const { entityType, data, rawContent } = item;

        if (!entityType || !data || !data.slug) {
            throw new Error("Invalid item structure. Must have entityType, data.slug.");
        }

        // 1. Compute Hash (Idempotence)
        const contentHash = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');

        // 2. Check existence & Hash
        const model = prisma[entityType]; // e.g. prisma.Aide
        if (!model) throw new Error(`Unknown entity type: ${entityType}`);

        const existing = await model.findUnique({
            where: { slug: data.slug }
        });

        let action = 'SKIP';

        if (!existing) {
            action = 'CREATE';
        } else {
            // Check if content changed
            if (existing.content_hash !== contentHash) {
                action = 'UPDATE';
            }
        }

        // 3. Execute DB Action
        if (action === 'CREATE' || action === 'UPDATE') {
            // Inject ingestion fields
            const payload = {
                ...data,
                content_hash: contentHash,
                source_name: this.sourceName,
                // Ensure defaults if missing
                statut: data.statut || 'brouillon'
            };

            if (action === 'CREATE') {
                await model.create({ data: payload });
                this.stats.created++;
            } else {
                await model.update({
                    where: { id: existing.id },
                    data: payload
                });
                this.stats.updated++;
            }

            // 4. Create Audit Snapshot (Traceability)
            await prisma.sourceSnapshot.create({
                data: {
                    entity_type: entityType,
                    entity_id: action === 'CREATE' ? (await model.findUnique({where: {slug: data.slug}})).id : existing.id,
                    content_hash: contentHash,
                    raw_excerpt: rawContent ? rawContent.substring(0, 500) : null,
                    final_url: data.source_url_exact,
                    http_status: 200
                }
            });

        } else {
            this.stats.skipped++;
        }
    }

    async logRun() {
        await prisma.importLog.create({
            data: {
                source_name: this.sourceName,
                status: this.stats.errors.length > 0 ? 'PARTIAL' : 'SUCCESS',
                items_total: this.stats.total,
                items_new: this.stats.created + this.stats.updated, // "New" means processed/changed
                logs: this.stats.errors.length ? JSON.stringify(this.stats.errors) : null
            }
        });
    }
}
