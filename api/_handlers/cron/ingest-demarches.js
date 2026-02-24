import { getCronAuth } from '../../_utils/cronAuth.js';
import prisma from '../../_utils/prisma.js';
import crypto from 'crypto';
import { logger } from '../../lib/logger.js';
import * as Sentry from '@sentry/node';
import { computeContentHash } from '../../_utils/contentHash.js';
import { ensureSlugOrNull } from '../../_utils/slug.js';

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
 * Service-Public.fr démarches source.
 * Uses the Aides Territoires API endpoint for démarches/fiches pratiques.
 * Falls back to a curated list of key démarches if API is unavailable.
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
 * @param {{ limit?: number, runId?: string }} params
 * @returns {Promise<{ fetched: number, processed: number, created: number, updated: number, skippedExisting: number, errors: string[] }>}
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
    };

    const startTotal = Date.now();
    const items = limit ? CURATED_DEMARCHES.slice(0, limit) : CURATED_DEMARCHES;
    stats.fetched = items.length;

    for (const item of items) {
        stats.processed++;
        try {
            const baseSlug = ensureSlugOrNull(`demarche-${item.titre}`);
            const contentHash = computeContentHash({
                titre: item.titre,
                description_courte: item.description_courte,
                lien_officiel: item.lien_officiel,
                source: 'service-public',
            });

            const existing = await prisma.demarche.findFirst({
                where: {
                    OR: [
                        ...(baseSlug ? [{ slug: baseSlug }] : []),
                        ...(item.lien_officiel ? [{ lien_officiel: item.lien_officiel }] : []),
                    ],
                },
            });

            const data = {
                titre: item.titre,
                description_courte: item.description_courte,
                pour_qui: item.pour_qui,
                lien_officiel: item.lien_officiel,
                categorie: item.categorie,
                audiences: item.audiences || [],
                statut: 'publie',
                published_at: new Date(),
                content_hash: contentHash,
                source_url: item.lien_officiel,
                territory_scope: 'NATIONAL',
                retrieved_at: new Date(),
                last_checked_at: new Date(),
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
        } catch (itemErr) {
            logger.error('DEMARCHE_PROCESS_ERROR', { runId, titre: item.titre, error: itemErr });
            stats.errors.push(`${item.titre}: ${getErrorMessage(itemErr)}`);
            Sentry.captureException(itemErr, {
                tags: { runId, stage: 'demarche_processing' },
                extra: { titre: item.titre },
            });
        }
    }

    const durationTotal = Date.now() - startTotal;

    logger.info('INGEST_DEMARCHES_END', { runId, stats, duration_ms: durationTotal });

    // Log the run
    try {
        await prisma.importLog.create({
            data: {
                run_id: runId,
                source_name: 'CRON_DEMARCHES',
                status: stats.errors.length > 0 ? 'PARTIAL' : 'SUCCESS',
                items_new: stats.created,
                items_updated: stats.updated,
                items_skipped: stats.skippedExisting,
                items_total: stats.processed,
                error_count: stats.errors.length,
                logs: stats.errors.length ? JSON.stringify(stats.errors) : null,
                duration_ms: durationTotal,
            },
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
