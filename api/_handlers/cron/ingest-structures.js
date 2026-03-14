import logger from '../../_utils/logger.js';
import { getCronAuth } from '../../_utils/cronAuth.js';
import { db } from '../../../src/db/index.js';
import { Structure, ImportLog, SyncRun } from '../../../src/db/schema.js';
import { eq, or } from 'drizzle-orm';
import crypto from 'crypto';
import { geocodeAddress } from '../../_utils/geocoder.js';
import { withLock } from '../../_utils/pipelineLock.js';
import { computeContentHash } from '../../_utils/contentHash.js';
import { ensureSlugOrNull } from '../../_utils/slug.js';
import { upsertSourceDocument } from '../../_utils/sourceDocument.js';
import { StructureIngestSchema } from '../../lib/ingestion/validators.js';

const DATASETS = [
    {
        id: 'mediation_numerique_lieux',
        name: "Médiation numérique – lieux (Strasbourg)",
        url: "https://opendata.strasbourg.eu/api/explore/v2.1/catalog/datasets/mediation_numerique_lieux/records?limit=100",
        trust_level: "OFFICIAL"
    }
];

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
 * Pure ingestion logic for Structures
 * @param {{ limit?: number, runId?: string }} params
 * @returns {Promise<{ fetched: number, processed: number, created: number, updated: number, skippedExisting: number, errors: string[], durationByStage: { fetchMs: number, processingMs: number } }>}
 */
export async function runIngestStructures({ limit, runId }) {
    // Log format: INGEST_<SOURCE>_ENTER url=<...>
    // URL is from DATASETS[0] for simplicity in this loop
    logger.info(`INGEST_STRUCTURES_ENTER url=${DATASETS[0].url}`);

    // Ensure runId
    if (!runId) runId = crypto.randomUUID();

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

    for (const dataset of DATASETS) {
        // logger.info(`[STRUCTURES] Ingesting ${dataset.name}`);

        const startFetch = Date.now();
        let response;
        try {
            response = await fetch(dataset.url);
        } catch (fetchErr) {
            stats.errors.push(`${dataset.id}: Fetch failed - ${getErrorMessage(fetchErr)}`);
            logger.error(`[STRUCTURES] Fetch Error: ${getErrorMessage(fetchErr)}`);
            continue;
        }

        const fetchDuration = Date.now() - startFetch;
        stats.durationByStage.fetchMs += fetchDuration;

        // logger.info(`[STRUCTURES] Fetch Status: ${response.status} CT: ${response.headers.get('content-type')}`);

        if (!response.ok) {
            const bodyText = await response.text();
            const errorMsg = `${dataset.id}: HTTP ${response.status} - ${bodyText.substring(0, 200)}`;
            stats.errors.push(errorMsg);
            logger.error(`[STRUCTURES] ${errorMsg}`);
            continue;
        }

        let data;
        try {
            data = await response.json();
            // Log keys for diagnosis
            // logger.info(`[STRUCTURES] Data Keys: ${data ? Object.keys(data).join(',') : 'null'}`);
        } catch (parseErr) {
            stats.errors.push(`${dataset.id}: JSON Parse Error - ${getErrorMessage(parseErr)}`);
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
            logger.warn(msg);
            stats.errors.push(msg);
        }

        // Log format: INGEST_<SOURCE>_FETCH_DONE status=<...> ct=<...> fetchMs=<...> items=<...>
        logger.info(`INGEST_STRUCTURES_FETCH_DONE status=${response.status} ct=${response.headers.get('content-type')} fetchMs=${fetchDuration} items=${items.length}`);

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

                // Zod Validation Shield
                const validationTarget = {
                    nom: nom?.trim(),
                    adresse: fullAdresse?.trim() || "Inconnue", // Ensure an address exists or fallback safely
                    ville: ville?.trim(),
                    code_postal: cp?.trim(),
                    telephone: f.tel || f.telephone || null,
                    email: f.mail || f.email || null,
                    site_web: f.url || f.site_internet || null,
                    source_id: dataset.id,
                    source_url: dataset.url,
                };
                
                const parsed = StructureIngestSchema.safeParse(validationTarget);
                if (!parsed.success) {
                    const errorIssues = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
                    stats.errors.push(`Record validation fail: ${nom} - ${errorIssues}`);
                    logger.warn(`INGEST_STRUCTURE_VALIDATION_ERROR`, { nom, errors: errorIssues });
                    continue;
                }
                
                const val = parsed.data;

                const hash = computeContentHash({
                    nom: val.nom,
                    fullAdresse: val.adresse,
                    ville: val.ville,
                    cp: val.code_postal,
                    email: val.email,
                    telephone: val.telephone,
                    site: val.site_web,
                });
                const baseSlug = ensureSlugOrNull(val.nom);
                const normalizedSlug = ensureSlugOrNull(`${baseSlug || 'structure'}-${hash.substring(0, 6)}`);

                let sourceDocumentId = null;
                try {
                    const sourceDocument = await upsertSourceDocument({
                        sourceUrl: dataset.url,
                        rawContent: JSON.stringify(item),
                        metadata: {
                            entityType: 'structure',
                            datasetId: dataset.id,
                            datasetName: dataset.name,
                        },
                    });
                    sourceDocumentId = sourceDocument.id;
                } catch {
                    stats.errors.push(`${dataset.id}: source document failed`);
                }

                // Check if exists
                const existing = await db.query.Structure.findFirst({
                    where: or(
                        eq(Structure.raw_data_hash, hash),
                        ...(normalizedSlug ? [eq(Structure.slug, normalizedSlug)] : [])
                    )
                });

                if (existing) {
                    const unchanged =
                        existing.raw_data_hash === hash &&
                        (existing.source_document_id || null) === sourceDocumentId;

                    if (unchanged) {
                        stats.skippedExisting++;
                    } else {
                        await db.update(Structure).set({
                            last_sync: new Date(),
                            import_batch: runId,
                            telephone: existing.telephone || val.telephone,
                            email: existing.email || val.email,
                            site_web: existing.site_web || val.site_web,
                            raw_data_hash: hash,
                            source_document_id: sourceDocumentId,
                            slug: existing.slug || normalizedSlug || null,
                        }).where(eq(Structure.id, existing.id));
                        stats.updated++;
                    }
                } else {
                    // CREATE - Valve 1: Ingest
                    const [newStructure] = await db.insert(Structure).values({
                        nom: val.nom,
                        slug: normalizedSlug || null,
                        adresse: `${val.adresse} ${val.code_postal} ${val.ville}`.trim(),
                        ville: val.ville,
                        code_postal: val.code_postal,
                        telephone: val.telephone,
                        email: val.email,
                        site_web: val.site_web,
                        source_id: dataset.id,
                        source_url: dataset.url,
                        raw_data_hash: hash,
                        source_document_id: sourceDocumentId,
                        import_batch: runId,
                        statut: "brouillon",
                        import_status: "active"
                    }).returning();

                    // Valve 2: Enrich (Geocoding)
                    const geo = await geocodeAddress(`${val.adresse}, ${val.code_postal} ${val.ville}`);
                    if (geo && geo.score > 0.7) {
                        await db.update(Structure).set({
                            latitude: geo.lat,
                            longitude: geo.lng,
                            geoloc_status: "success",
                            quality_score: 80
                        }).where(eq(Structure.id, newStructure.id));
                    } else {
                        await db.update(Structure).set({ 
                            geoloc_status: "failed", 
                            quality_score: 40 
                        }).where(eq(Structure.id, newStructure.id));
                    }

                    // Valve 3: Publish
                    if (dataset.trust_level === "OFFICIAL") {
                        const updated = await db.query.Structure.findFirst({ where: eq(Structure.id, newStructure.id) });
                        if (updated && updated.quality_score >= 80) {
                            await db.update(Structure).set({
                                statut: "actif",
                                published_at: new Date()
                            }).where(eq(Structure.id, newStructure.id));
                        }
                    }

                    stats.created++;
                }
            } catch (recErr) {
                logger.error("Structure Record Error:", getErrorMessage(recErr));
                stats.errors.push(`Record fail: ${getErrorMessage(recErr)}`);
            }
        }
        stats.durationByStage.processingMs += (Date.now() - startProcess);
    }

    // Log the Run
    try {
        await db.insert(ImportLog).values({
            source_name: 'CRON_STRUCTURES_ALSACE',
            status: stats.errors.length > 0 ? 'PARTIAL' : 'SUCCESS',
            items_new: stats.created,
            items_total: stats.processed,
            logs: stats.errors.length ? JSON.stringify(stats.errors) : null,
            duration_ms: Date.now() - startTotal
        });
    } catch (e) { logger.error("Log Create Failed", e); }

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
	            await db.insert(SyncRun).values({
	                id: runId,
	                source_id: 'pipeline-structures', // Provide a valid string instead of null
	                status: 'running',
                    started_at: new Date()
                });

            try {
                const result = await runIngestStructures({ limit, runId });
                
                // Update sync run with success
                await db.update(SyncRun).set({
                    status: result.errors.length > 0 ? 'partial' : 'success',
                    ended_at: new Date(),
                    error: result.errors.length > 0 ? result.errors.join('; ') : null,
                    stats: result
                }).where(eq(SyncRun.id, runId));

                return result;
            } catch (error) {
                // Update sync run with failure
                await db.update(SyncRun).set({
                    status: 'failed',
                    ended_at: new Date(),
                    error: getErrorMessage(error)
                }).where(eq(SyncRun.id, runId));
                throw error;
            }
        });

        return res.status(200).json(stats);
    } catch (err) {
        if (getErrorMessage(err).includes('already running')) {
            logger.warn({ runId }, 'Ingest-Structures already running, skipping');
            return res.status(409).json({ error: 'Pipeline already running', runId });
        }
        
        logger.error({ runId, error: getErrorMessage(err) }, "Handler Structure Error");
        return res.status(500).json({ error: 'Internal Server Error', runId });
    }
}
