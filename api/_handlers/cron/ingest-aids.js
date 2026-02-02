import { isCronAuthorized } from '../../_utils/cronAuth.js';
import prisma from '../../_utils/prisma.js';
import crypto from 'crypto';

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
    console.log(`INGEST_AIDS_ENTER source=${source} limit=${limit}`);

    if (!runId) runId = crypto.randomUUID();

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
        connectors.push(new GrandEstConnector());
    }
    if (source === 'all' || source === 'agefiph') {
        connectors.push(new AgefiphConnector());
    }

    if (connectors.length === 0) {
        stats.errors.push('No connectors selected');
        return stats;
    }

    const startFetch = Date.now();

    // Run connectors in parallel
    const ingestionResults = await Promise.allSettled(
        connectors.map(connector => connector.ingest())
    );

    stats.durationByStage.fetchMs = Date.now() - startFetch;

    // Aggregate results
    const allAides = [];
    for (const result of ingestionResults) {
        if (result.status === 'fulfilled') {
            const { aides, errors: connectorErrors } = result.value;
            allAides.push(...aides);
            stats.errors.push(...connectorErrors.map(e => `${e.rawItem?.url || 'unknown'}: ${e.error}`));
        } else {
            stats.errors.push(`Connector failed: ${result.reason}`);
        }
    }

    stats.fetched = allAides.length;
    console.log(`INGEST_AIDS_FETCH_DONE items=${allAides.length}`);

    // Limit support
    let aidesToProcess = allAides;
    if (limit && limit > 0) {
        aidesToProcess = allAides.slice(0, limit);
    }

    const startProcess = Date.now();

    // Upsert aides
    for (const aide of aidesToProcess) {
        stats.processed++;
        try {
            const result = await upsertAide(aide, aide._stableId);
            if (result.created) stats.created++;
            if (result.updated) stats.updated++;
        } catch (procErr) {
            console.error(`[AIDS] Upsert error (${aide.slug}):`, procErr.message);
            stats.errors.push(`Upsert ${aide.slug}: ${procErr.message}`);
        }
    }

    stats.durationByStage.processingMs = Date.now() - startProcess;

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
        console.warn('[AIDS] Failed to log import:', e.message);
    }

    console.log(`INGEST_AIDS_DONE created=${stats.created} updated=${stats.updated} errors=${stats.errors.length}`);

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
