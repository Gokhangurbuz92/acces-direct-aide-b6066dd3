import { isCronAuthorized } from '../../_utils/cronAuth.js';
import prisma from '../../_utils/prisma.js';
import crypto from 'crypto';

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
 * Pure ingestion logic for Aids
 * @param {Object} params
 * @param {number} params.limit
 * @param {string} params.runId
 * @returns {Promise<Object>} stats
 */
export async function runIngestAids({ limit, runId }) {
    const SOURCE_URL = "https://raw.githubusercontent.com/Gokhangurbuz92/data-sources/main/aids-france.json";
    console.log(`INGEST_AIDS_ENTER url=${SOURCE_URL}`);

    if (!runId) runId = crypto.randomUUID();

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

    // Fetch external data (fallback to local if unreachable - though here we only have fetch)
    let externalAids = [];
    try {
        const startFetch = Date.now();
        // console.log(`[AIDS] Fetching ${SOURCE_URL}`);

        const response = await fetch(SOURCE_URL);
        const fetchDuration = Date.now() - startFetch;
        stats.durationByStage.fetchMs = fetchDuration;

        // console.log(`[AIDS] Fetch Status: ${response.status} CT: ${response.headers.get('content-type')}`);

        if (response.ok) {
            let data;
            try {
                data = await response.json();
                // console.log(`[AIDS] Data Keys: ${Array.isArray(data) ? '[Array]' : (data ? Object.keys(data).join(',') : 'null')}`);
            } catch (jsonErr) {
                const msg = `[AIDS] JSON Parse Error: ${jsonErr.message}`;
                console.error(msg);
                stats.errors.push(msg);
                data = [];
            }

            // Anti Silent Failure: Handle Array vs Object
            if (Array.isArray(data)) {
                externalAids = data;
            } else if (data && Array.isArray(data.items)) {
                externalAids = data.items;
            } else if (data && Array.isArray(data.aides)) {
                externalAids = data.aides;
            } else {
                externalAids = [];
                // if (data) console.warn("[AIDS] Unknown data structure (not array, no items/aides key)");
            }

            console.log(`INGEST_AIDS_FETCH_DONE status=${response.status} ct=${response.headers.get('content-type')} fetchMs=${fetchDuration} items=${externalAids.length}`);

            if (externalAids.length === 0) {
                const msg = `[AIDS] 0 items found. status=${response.status}`;
                console.warn(msg);
                stats.errors.push(msg);
            }

            stats.fetched = externalAids.length;
        } else {
            const body = await response.text();
            const msg = `[AIDS] HTTP Error ${response.status} - ${body.substring(0, 100)}`;
            console.error(msg);
            stats.errors.push(msg);
        }
    } catch (e) {
        console.error("[AIDS] External source unreachable", e);
        stats.errors.push(`Fetch failed: ${e.message}`);
    }

    // Limit support
    if (limit && limit > 0) {
        externalAids = externalAids.slice(0, limit);
    }

    const startProcess = Date.now();
    // Process items
    for (const item of externalAids) {
        stats.processed++;
        try {
            const hash = crypto.createHash('md5').update(JSON.stringify(item)).digest('hex');
            const tit = item.title || "Sans titre";
            const slug = slugify(tit);

            const existing = await prisma.aide.findUnique({ where: { slug } });

            if (existing) {
                await prisma.aide.update({
                    where: { slug },
                    data: {
                        titre: tit,
                        summary_falc: item.summary,
                        providerName: item.provider,
                        statut: 'publie',
                        published_at: new Date()
                    }
                });
                stats.updated++;
            } else {
                await prisma.aide.create({
                    data: {
                        titre: tit,
                        slug,
                        summary_falc: item.summary,
                        providerName: item.provider,
                        statut: 'publie',
                        published_at: new Date()
                    }
                });
                stats.created++;
            }
        } catch (procErr) {
            console.error(`[AIDS] Process item error: ${procErr.message}`);
            stats.errors.push(`Item error: ${procErr.message}`);
        }
    }
    stats.durationByStage.processingMs = Date.now() - startProcess;

    // Log the Run
    try {
        await prisma.importLog.create({
            data: {
                source_name: 'CRON_AIDS',
                status: stats.errors.length > 0 ? 'PARTIAL' : 'SUCCESS',
                items_new: stats.created,
                items_total: stats.processed,
                logs: stats.errors.length ? JSON.stringify(stats.errors) : null,
                duration_ms: Date.now() - startTotal
            }
        });
    } catch (e) { /* ignore log error */ }

    return stats;
}

export default async function handler(req, res) {
    if (!isCronAuthorized(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;

    try {
        const stats = await runIngestAids({ limit, runId: crypto.randomUUID() });
        return res.status(200).json(stats);
    } catch (error) {
        console.error('Ingest Aids Handler Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
