import { getCronAuth } from '../../_utils/cronAuth.js';
import prisma from '../../_utils/prisma.js';
import crypto from 'crypto';
import { logger } from '../../lib/logger.js';
import * as Sentry from '@sentry/node';
import { computeContentHash } from '../../_utils/contentHash.js';
import { ensureSlugOrNull } from '../../_utils/slug.js';
import { ServicePublicDemarchesConnector } from '../../lib/ingestion/ServicePublicDemarchesConnector.js';
import { fetchDemarchesSimplifiees } from '../../lib/ingestion/DemarchesSimplifieesConnector.js';
import { fetchMesAidesReno } from '../../lib/ingestion/MesAidesRenoConnector.js';

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
 * Curated démarches as fallback when the Service-Public dataset is unavailable.
 * These are always upserted to ensure a baseline of high-value content.
 */
const CURATED_DEMARCHES = [
    {
        titre: "Demande d'Allocation Personnalisée d'Autonomie (APA)",
        description_courte: "Demander l'APA auprès du conseil départemental pour financer les aides à l'autonomie.",
        pour_qui: "Personnes âgées de 60 ans et plus en perte d'autonomie (GIR 1 à 4)",
        lien_officiel: "https://www.service-public.fr/particuliers/vosdroits/F10009",
        categorie: "personnes-agees",
        audiences: ["Senior"],
    },
    {
        titre: "Demande de Prestation de Compensation du Handicap (PCH)",
        description_courte: "Déposer un dossier MDPH pour obtenir la PCH (aides humaines, techniques, aménagement).",
        pour_qui: "Personnes en situation de handicap de moins de 60 ans",
        lien_officiel: "https://www.service-public.fr/particuliers/vosdroits/F14202",
        categorie: "handicap",
        audiences: ["Handicap"],
    },
    {
        titre: "Demande d'Allocation aux Adultes Handicapés (AAH)",
        description_courte: "Formuler une demande d'AAH via la MDPH pour garantir un revenu minimal.",
        pour_qui: "Adultes avec un taux d'incapacité d'au moins 50%",
        lien_officiel: "https://www.service-public.fr/particuliers/vosdroits/F12242",
        categorie: "handicap",
        audiences: ["Handicap"],
    },
    {
        titre: "Demande de RSA (Revenu de Solidarité Active)",
        description_courte: "Faire une demande de RSA auprès de la CAF ou MSA pour assurer un revenu minimum.",
        pour_qui: "Personnes de plus de 25 ans (ou moins de 25 ans avec enfant) à faibles ressources",
        lien_officiel: "https://www.service-public.fr/particuliers/vosdroits/F19778",
        categorie: "insertion",
        audiences: ["Jeune", "Famille"],
    },
    {
        titre: "Inscription à France Travail (ex-Pôle emploi)",
        description_courte: "S'inscrire comme demandeur d'emploi pour bénéficier de l'accompagnement et des indemnités.",
        pour_qui: "Toute personne en recherche d'emploi",
        lien_officiel: "https://www.service-public.fr/particuliers/vosdroits/F1636",
        categorie: "emploi",
        audiences: ["Jeune", "Senior"],
    },
    {
        titre: "Demande de logement social (HLM)",
        description_courte: "Déposer une demande de logement social via le formulaire Cerfa ou en ligne.",
        pour_qui: "Toute personne résidant en France de manière stable et régulière",
        lien_officiel: "https://www.service-public.fr/particuliers/vosdroits/F10007",
        categorie: "logement",
        audiences: ["Famille", "Jeune"],
    },
    {
        titre: "Demande d'aide juridictionnelle",
        description_courte: "Obtenir la prise en charge partielle ou totale des frais de justice.",
        pour_qui: "Personnes à faibles revenus engagées dans une procédure judiciaire",
        lien_officiel: "https://www.service-public.fr/particuliers/vosdroits/F18074",
        categorie: "droits",
        audiences: ["Famille"],
    },
    {
        titre: "Demande de CMU-C / Complémentaire Santé Solidaire (CSS)",
        description_courte: "Obtenir une complémentaire santé gratuite ou à 1 € par jour selon les ressources.",
        pour_qui: "Personnes à faibles ressources sans complémentaire santé",
        lien_officiel: "https://www.service-public.fr/particuliers/vosdroits/F10027",
        categorie: "sante",
        audiences: ["Famille", "Senior"],
    },
    {
        titre: "Déclaration de changement de situation à la CAF",
        description_courte: "Signaler un changement de situation familiale, professionnelle ou de logement à la CAF.",
        pour_qui: "Tout allocataire CAF",
        lien_officiel: "https://www.service-public.fr/particuliers/vosdroits/F11667",
        categorie: "administratif",
        audiences: ["Famille"],
    },
    {
        titre: "Demande de carte mobilité inclusion (CMI)",
        description_courte: "Demander la CMI invalidité, priorité ou stationnement auprès de la MDPH.",
        pour_qui: "Personnes en situation de handicap ou de perte d'autonomie",
        lien_officiel: "https://www.service-public.fr/particuliers/vosdroits/F34049",
        categorie: "handicap",
        audiences: ["Handicap", "Senior"],
    },
    {
        titre: "Demande d'AEEH (Allocation d'Éducation de l'Enfant Handicapé)",
        description_courte: "Formuler une demande d'AEEH via la MDPH pour un enfant en situation de handicap.",
        pour_qui: "Parents d'un enfant de moins de 20 ans en situation de handicap",
        lien_officiel: "https://www.service-public.fr/particuliers/vosdroits/F14809",
        categorie: "handicap",
        audiences: ["Famille", "Handicap"],
    },
    {
        titre: "Renouvellement de titre de séjour",
        description_courte: "Demander le renouvellement de son titre de séjour avant son expiration.",
        pour_qui: "Ressortissants étrangers résidant en France avec un titre de séjour",
        lien_officiel: "https://www.service-public.fr/particuliers/vosdroits/F2209",
        categorie: "papiers",
        audiences: ["Famille"],
    },
];

/**
 * Upsert a single démarche item into the database.
 * @param {{ titre: string, description_courte: string, pour_qui?: string, lien_officiel: string, categorie: string, audiences?: string[], source_url?: string, external_id?: string, source_api?: string }} item
 * @param {string} runId
 * @param {{ created: number, updated: number, skippedExisting: number, errors: string[] }} stats
 */
async function upsertDemarche(item, runId, stats) {
    const baseSlug = ensureSlugOrNull(`demarche-${item.titre}`);
    const contentHash = computeContentHash({
        titre: item.titre,
        description_courte: item.description_courte,
        lien_officiel: item.lien_officiel || item.source_url,
        source: item.source_api || 'service-public',
    });

    // Stable key: external_id+source_api OR source_url_exact OR slug
    const orConditions = [];
    if (item.external_id && item.source_api) {
        orConditions.push({ external_id: item.external_id, source_api: item.source_api });
    }
    if (item.lien_officiel) {
        orConditions.push({ lien_officiel: item.lien_officiel });
    }
    if (item.source_url) {
        orConditions.push({ source_url: item.source_url });
    }
    if (baseSlug) {
        orConditions.push({ slug: baseSlug });
    }

    if (orConditions.length === 0) {
        stats.errors.push(`${item.titre}: no stable key for upsert`);
        return;
    }

    const existing = await prisma.demarche.findFirst({
        where: { OR: orConditions },
    });

    const data = {
        titre: item.titre,
        description_courte: item.description_courte || null,
        pour_qui: item.pour_qui || null,
        lien_officiel: item.lien_officiel || null,
        categorie: item.categorie || 'administratif',
        audiences: item.audiences || [],
        statut: 'publie',
        published_at: new Date(),
        content_hash: contentHash,
        source_url: item.source_url || item.lien_officiel || null,
        territory_scope: item.territory_scope || 'NATIONAL',
        retrieved_at: new Date(),
        last_checked_at: new Date(),
        date_verification: new Date(),
    };

    if (existing) {
        if (existing.content_hash !== contentHash) {
            await prisma.demarche.update({
                where: { id: existing.id },
                data,
            });
            stats.updated++;
        } else {
            stats.skippedExisting++;
        }
    } else {
        let finalSlug = baseSlug;
        if (finalSlug && (await prisma.demarche.count({ where: { slug: finalSlug } })) > 0) {
            finalSlug = ensureSlugOrNull(`${finalSlug}-${contentHash.slice(0, 6)}`);
        }
        await prisma.demarche.create({
            data: {
                ...data,
                slug: finalSlug || null,
            },
        });
        stats.created++;
    }
}

/**
 * @param {{ limit?: number, runId?: string }} params
 * @returns {Promise<{ fetched: number, processed: number, created: number, updated: number, skippedExisting: number, errors: string[], source: string }>}
 */
export async function runIngestDemarches({ limit, runId } = {}) {
    if (!runId) runId = crypto.randomUUID();

    logger.info('INGEST_DEMARCHES_START', { runId, limit });

    const stats = {
        fetched: 0,
        processed: 0,
        created: 0,
        updated: 0,
        skippedExisting: 0,
        errors: [],
        source: 'curated',
    };

    const startTotal = Date.now();

    // -----------------------------------------------------------------------
    // Phase 1: Try Service-Public dataset connector
    // -----------------------------------------------------------------------
    let connectorItems = [];
    try {
        const connector = new ServicePublicDemarchesConnector();
        const urls = await connector.getDetailUrls();
        stats.source = 'service-public-dataset';
        logger.info('INGEST_DEMARCHES_CONNECTOR_OK', { runId, count: urls.length });

        const urlsToProcess = limit && limit > 0 ? urls.slice(0, limit) : urls;
        stats.fetched = urlsToProcess.length;

        for (const url of urlsToProcess) {
            stats.processed++;
            try {
                const json = await connector.fetch(url);
                const parsed = await connector.parse(json, url);
                connectorItems.push(parsed);
            } catch (parseErr) {
                stats.errors.push(`parse: ${url}: ${getErrorMessage(parseErr)}`);
            }
        }
    } catch (connectorErr) {
        logger.warn('INGEST_DEMARCHES_CONNECTOR_FAIL', { runId, error: getErrorMessage(connectorErr) });
        Sentry.captureException(connectorErr, {
            tags: { runId, stage: 'connector_fetch' },
            extra: { connector: 'service-public' },
        });
        stats.errors.push(`Service-Public connector failed: ${getErrorMessage(connectorErr)}`);
        stats.source = 'curated-fallback';
    }

    // -----------------------------------------------------------------------
    // Phase 2: Always upsert curated baseline (ensures high-value content)
    // -----------------------------------------------------------------------
    const allItems = [...connectorItems];
    const curatedToAdd = limit ? CURATED_DEMARCHES.slice(0, limit) : CURATED_DEMARCHES;

    // Add curated items that aren't already in connector results (by lien_officiel)
    const connectorUrls = new Set(connectorItems.map(i => i.lien_officiel || i.source_url));
    for (const curated of curatedToAdd) {
        if (!connectorUrls.has(curated.lien_officiel)) {
            allItems.push({
                ...curated,
                source_url: curated.lien_officiel,
                source_api: 'curated',
                external_id: null,
            });
        }
    }

    if (!stats.fetched) stats.fetched = allItems.length;

    // -----------------------------------------------------------------------
    // Phase 3: Upsert all items
    // -----------------------------------------------------------------------
    for (const item of allItems) {
        if (!stats.processed) stats.processed = 0;
        try {
            await upsertDemarche(item, runId, stats);
        } catch (itemErr) {
            logger.error('DEMARCHE_PROCESS_ERROR', { runId, titre: item.titre, error: itemErr });
            stats.errors.push(`${item.titre}: ${getErrorMessage(itemErr)}`);
            Sentry.captureException(itemErr, {
                tags: { runId, stage: 'demarche_processing' },
                extra: { titre: item.titre },
            });
        }
    }

    // -----------------------------------------------------------------------
    // Phase 2b-A: Démarches Simplifiées GraphQL connector
    // -----------------------------------------------------------------------
    try {
        const dsItems = await fetchDemarchesSimplifiees();
        if (dsItems.length > 0) {
            logger.info('INGEST_DEMARCHES_DS_OK', { runId, count: dsItems.length });
            for (const dsItem of dsItems) {
                try {
                    await upsertDemarche({
                        ...dsItem,
                        territory_scope: 'NATIONAL',
                    }, runId, stats);
                } catch (dsErr) {
                    stats.errors.push(`DS ${dsItem.external_id}: ${getErrorMessage(dsErr)}`);
                }
            }
        }
    } catch (dsConnectorErr) {
        logger.warn('INGEST_DEMARCHES_DS_FAIL', { runId, error: getErrorMessage(dsConnectorErr) });
        stats.errors.push(`DS connector failed: ${getErrorMessage(dsConnectorErr)}`);
    }

    // -----------------------------------------------------------------------
    // Phase 2b-B: Mes Aides Réno (ANAH) → upsert into Aide table
    // -----------------------------------------------------------------------
    let renoStats = { created: 0, updated: 0, skipped: 0, errors: 0 };
    try {
        const renoItems = await fetchMesAidesReno();
        if (renoItems.length > 0) {
            logger.info('INGEST_RENO_OK', { runId, count: renoItems.length });
            for (const renoItem of renoItems) {
                try {
                    const renoContentHash = computeContentHash({
                        external_id: renoItem.external_id,
                        titre: renoItem.titre,
                        description: renoItem.description,
                    });

                    const existing = await prisma.aide.findFirst({
                        where: {
                            OR: [
                                { externalId: renoItem.external_id },
                                { source_url: renoItem.lien_officiel },
                            ],
                        },
                    });

                    const renoData = {
                        titre: renoItem.titre,
                        summary_falc: renoItem.description.substring(0, 500),
                        cest_quoi: renoItem.description + '\n\n' + renoItem.conditions,
                        providerName: 'Mes Aides Réno',
                        providerType: 'ingest',
                        source_url: renoItem.lien_officiel,
                        source_url_exact: renoItem.lien_officiel,
                        apply_url: renoItem.lien_demarche,
                        theme: renoItem.categorie,
                        echelon_territorial: 'NATIONAL',
                        source_donnee: 'Mes Aides Réno',
                        lien_demarche: renoItem.lien_demarche,
                        statut: 'publie',
                        published_at: new Date(),
                        fetched_at: new Date(),
                        retrieved_at: new Date(),
                        last_checked_at: new Date(),
                        content_hash: renoContentHash,
                    };

                    if (existing) {
                        if (existing.content_hash !== renoContentHash) {
                            await prisma.aide.update({
                                where: { id: existing.id },
                                data: renoData,
                            });
                            renoStats.updated++;
                        } else {
                            renoStats.skipped++;
                        }
                    } else {
                        const slug = ensureSlugOrNull(`aide-${renoItem.titre}`);
                        await prisma.aide.create({
                            data: {
                                ...renoData,
                                externalId: renoItem.external_id,
                                slug,
                            },
                        });
                        renoStats.created++;
                    }
                } catch (renoErr) {
                    renoStats.errors++;
                    stats.errors.push(`Reno ${renoItem.external_id}: ${getErrorMessage(renoErr)}`);
                }
            }
        }
    } catch (renoConnectorErr) {
        logger.warn('INGEST_RENO_FAIL', { runId, error: getErrorMessage(renoConnectorErr) });
        stats.errors.push(`MesAidesReno connector failed: ${getErrorMessage(renoConnectorErr)}`);
    }

    const durationTotal = Date.now() - startTotal;

    // Silent failure detection
    if (stats.created === 0 && stats.updated === 0 && stats.skippedExisting === 0 && stats.errors.length === 0) {
        logger.warn('INGEST_DEMARCHES_SILENT_FAIL', { runId, stats });
        stats.errors.push('Silent failure: no items processed');
    }

    logger.info('INGEST_DEMARCHES_END', { runId, stats, renoStats, duration_ms: durationTotal });

    // Log the run
    try {
        await prisma.importLog.create({
            data: {
                run_id: runId,
                source_name: 'CRON_DEMARCHES',
                status: stats.errors.length > 0 ? 'PARTIAL' : 'SUCCESS',
                items_new: stats.created + renoStats.created,
                items_updated: stats.updated + renoStats.updated,
                items_skipped: stats.skippedExisting + renoStats.skipped,
                items_total: stats.processed + allItems.length,
                error_count: stats.errors.length,
                logs: stats.errors.length ? JSON.stringify(stats.errors.slice(0, 50)) : null,
                duration_ms: durationTotal,
            },
        });
    } catch (e) {
        logger.error('IMPORT_LOG_ERROR', { runId, error: e });
    }

    // ── Phase 2b: SyncRun entry ──
    try {
        await prisma.syncRun.create({
            data: {
                id: crypto.randomUUID(),
                source_id: 'ingest-demarches',
                status: stats.errors.length > 0 ? 'partial' : 'success',
                started_at: new Date(startTotal),
                ended_at: new Date(),
                stats: {
                    demarches: {
                        created: stats.created,
                        updated: stats.updated,
                        skipped: stats.skippedExisting,
                        source: stats.source,
                    },
                    renovation: renoStats,
                    errors: stats.errors.slice(0, 20),
                    duration_ms: durationTotal,
                },
            },
        });
    } catch {
        // SyncRun logging must never break the response
    }

    return { ...stats, renoStats };
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
        logger.warn('Unauthorized Ingest-Demarches Attempt');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
    const runId = crypto.randomUUID();

    try {
        const stats = await runIngestDemarches({ limit, runId });
        return res.status(200).json(stats);
    } catch (error) {
        logger.error('Ingest Demarches Handler Error', { runId, error });
        Sentry.captureException(error, { extra: { runId } });
        return res.status(500).json({ error: 'Internal Server Error', runId });
    }
}
