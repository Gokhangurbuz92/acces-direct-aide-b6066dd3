import { getCronAuth } from '../../_utils/cronAuth.js';
import prisma from '../../_utils/prisma.js';
import crypto from 'crypto';
import { geocodeAddress } from '../../_utils/geocoder.js';
import { withLock } from '../../_utils/pipelineLock.js';
import logger from '../../_utils/logger.js';

const DATASETS = [
    {
        id: 'mediation_numerique_lieux',
        name: "Médiation numérique – lieux (Strasbourg)",
        url: "https://opendata.strasbourg.eu/api/explore/v2.1/catalog/datasets/mediation_numerique_lieux/records?limit=100",
        trust_level: "OFFICIAL"
    }
];

function slugify(text) {
    if (!text) return '';
    return text.toString().toLowerCase().trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

/**
 * Pure ingestion logic for Structures
 * @param {Object} params
 * @param {number} params.limit
 * @param {string} params.runId
 * @returns {Promise<Object>} stats
 */
export async function runIngestStructures({ limit, runId }) {
    // Log format: INGEST_<SOURCE>_ENTER url=<...>
    // URL is from DATASETS[0] for simplicity in this loop
    console.log(`INGEST_STRUCTURES_ENTER url=${DATASETS[0].url}`);

    // Ensure runId
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

    for (const dataset of DATASETS) {
        // console.log(`[STRUCTURES] Ingesting ${dataset.name}`);

        const startFetch = Date.now();
        let response;
        try {
            response = await fetch(dataset.url);
        } catch (fetchErr) {
            stats.errors.push(`${dataset.id}: Fetch failed - ${fetchErr.message}`);
            console.error(`[STRUCTURES] Fetch Error: ${fetchErr.message}`);
            continue;
        }

        const fetchDuration = Date.now() - startFetch;
        stats.durationByStage.fetchMs += fetchDuration;

        // console.log(`[STRUCTURES] Fetch Status: ${response.status} CT: ${response.headers.get('content-type')}`);

        if (!response.ok) {
            const bodyText = await response.text();
            const errorMsg = `${dataset.id}: HTTP ${response.status} - ${bodyText.substring(0, 200)}`;
            stats.errors.push(errorMsg);
            console.error(`[STRUCTURES] ${errorMsg}`);
            continue;
        }

        let data;
        try {
            data = await response.json();
            // Log keys for diagnosis
            // console.log(`[STRUCTURES] Data Keys: ${data ? Object.keys(data).join(',') : 'null'}`);
        } catch (parseErr) {
            stats.errors.push(`${dataset.id}: JSON Parse Error - ${parseErr.message}`);
            continue;
        }

        // Handle OpenDataSoft v2.1 format: { total_count, results: [...] }
        let items = data.results || data.records || [];

        if (!Array.isArray(items)) {
            // Fallback: maybe the root is the array?
            if (Array.isArray(data)) items = data;
        }

        if (items.length === 0) {
            const msg = `[STRUCTURES] 0 items found. status=${response.status} keys=${data ? Object.keys(data).join(',') : 'null'}`;
            console.warn(msg);
            stats.errors.push(msg);
        }

        // Log format: INGEST_<SOURCE>_FETCH_DONE status=<...> ct=<...> fetchMs=<...> items=<...>
        console.log(`INGEST_STRUCTURES_FETCH_DONE status=${response.status} ct=${response.headers.get('content-type')} fetchMs=${fetchDuration} items=${items.length}`);

        stats.fetched += items.length;

        // Apply Limit
        if (limit && limit > 0) {
            items = items.slice(0, limit);
        }

        const startProcess = Date.now();
        for (const item of items) {
            stats.processed++;
            try {
                // Determine fields based on API version (v2.1 has direct fields, v1 had 'fields' wrapper)
                const f = item.fields || item;
                const nom = f.nom || f.name || f.raison_sociale || f.structure_nom_usage || "Inconnu";

                let fullAdresse = [f.adresse_num, f.adresse_lib, f.adresse_cplt].filter(Boolean).join(' ');
                if (!fullAdresse && f.adresse) fullAdresse = f.adresse;

                const ville = f.commune || f.ville || "Strasbourg";
                const cp = (f.code_postal || f.cp || "").toString();

                // Dedupe Logic: Hash of Name + Address
                const rawContent = `${nom}${fullAdresse}${ville}`.toLowerCase();
                const hash = crypto.createHash('md5').update(rawContent).digest('hex');

                // Check if exists
                const existing = await prisma.structure.findFirst({
                    where: {
                        OR: [
                            { raw_data_hash: hash },
                            { slug: slugify(nom) + '-' + hash.substring(0, 6) }
                        ]
                    }
                });

                if (existing) {
                    // UPDATE
                    await prisma.structure.update({
                        where: { id: existing.id },
                        data: {
                            last_sync: new Date(),
                            import_batch: runId,
                            telephone: existing.telephone || f.tel || f.telephone || null,
                            email: existing.email || f.mail || f.email || null,
                            site_web: existing.site_web || f.url || f.site_internet || null,
                            raw_data_hash: hash
                        }
                    });
                    stats.updated++;
                } else {
                    // CREATE - Valve 1: Ingest
                    const newStructure = await prisma.structure.create({
                        data: {
                            nom,
                            slug: slugify(nom) + '-' + hash.substring(0, 6),
                            adresse: `${fullAdresse} ${cp} ${ville}`.trim(),
                            ville,
                            code_postal: cp,
                            telephone: f.tel || f.telephone || null,
                            email: f.mail || f.email || null,
                            site_web: f.url || f.site_internet || null,
                            source_id: dataset.id,
                            source_url: dataset.url,
                            raw_data_hash: hash,
                            import_batch: runId,
                            statut: "brouillon",
                            import_status: "active"
                        }
                    });

                    // Valve 2: Enrich (Geocoding)
                    const geo = await geocodeAddress(`${fullAdresse}, ${cp} ${ville}`);
                    if (geo && geo.score > 0.7) {
                        await prisma.structure.update({
                            where: { id: newStructure.id },
                            data: {
                                latitude: geo.lat,
                                longitude: geo.lng,
                                geoloc_status: "success",
                                quality_score: 80
                            }
                        });
                    } else {
                        await prisma.structure.update({
                            where: { id: newStructure.id },
                            data: { geoloc_status: "failed", quality_score: 40 }
                        });
                    }

                    // Valve 3: Publish
                    if (dataset.trust_level === "OFFICIAL") {
                        const updated = await prisma.structure.findUnique({ where: { id: newStructure.id } });
                        if (updated.quality_score >= 80) {
                            await prisma.structure.update({
                                where: { id: newStructure.id },
                                data: {
                                    statut: "actif",
                                    published_at: new Date()
                                }
                            });
                        }
                    }

                    stats.created++;
                }
            } catch (recErr) {
                console.error("Structure Record Error:", recErr.message);
                stats.errors.push(`Record fail: ${recErr.message}`);
            }
        }
        stats.durationByStage.processingMs += (Date.now() - startProcess);
    }

    // Log the Run
    try {
        await prisma.importLog.create({
            data: {
                source_name: 'CRON_STRUCTURES_ALSACE',
                status: stats.errors.length > 0 ? 'PARTIAL' : 'SUCCESS',
                items_new: stats.created,
                items_total: stats.processed,
                logs: stats.errors.length ? JSON.stringify(stats.errors) : null,
                duration_ms: Date.now() - startTotal
            }
        });
    } catch (e) { console.error("Log Create Failed", e); }

    return stats;
}
/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */

export default async function handler(req, res) {
    // 1. Authorization
    const auth = getCronAuth(req);
    if (!auth.ok) {
        if (auth.reason === 'missing_secret') {
            return res.status(500).json({ error: 'CRON_SECRET is not configured' });
        }
        logger.warn("Unauthorized Ingest-Structures Attempt");
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
    const runId = crypto.randomUUID();

    try {
        // Use distributed lock to prevent concurrent runs
	        const stats = await withLock('ingest-structures', async () => {
	            // Log sync run start
	            await prisma.syncRun.create({
	                data: {
	                    id: runId,
	                    source_id: null, // Multi-source run
	                    status: 'running',
                    started_at: new Date()
                }
            });

            try {
                const result = await runIngestStructures({ limit, runId });
                
                // Update sync run with success
                await prisma.syncRun.update({
                    where: { id: runId },
                    data: {
                        status: result.errors.length > 0 ? 'partial' : 'success',
                        ended_at: new Date(),
                        error: result.errors.length > 0 ? result.errors.join('; ') : null,
                        stats: result
                    }
                });

                return result;
            } catch (error) {
                // Update sync run with failure
                await prisma.syncRun.update({
                    where: { id: runId },
                    data: {
                        status: 'failed',
                        ended_at: new Date(),
                        error: error.message
                    }
                });
                throw error;
            }
        });

        return res.status(200).json(stats);
    } catch (err) {
        if (err.message.includes('already running')) {
            logger.warn({ runId }, 'Ingest-Structures already running, skipping');
            return res.status(409).json({ error: 'Pipeline already running', runId });
        }
        
        logger.error({ runId, error: err.message }, "Handler Structure Error");
        return res.status(500).json({ error: err.message, runId });
    }
}
