import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
// Native fetch used
import { geocodeAddress } from '../../_utils/geocoder.js';

const prisma = new PrismaClient();

const DATASETS = [
    {
        id: 'mediation_numerique_lieux',
        name: "Médiation numérique – lieux (Strasbourg)",
        url: "https://opendata.strasbourg.eu/api/explore/v2.1/catalog/datasets/mediation_numerique_lieux/records?limit=100",
        trust_level: "OFFICIAL"
    }
];

// Helper: Safe Header Access
function getHeader(req, name) {
    const n = name.toLowerCase();
    const h = req?.headers;
    // Fetch/Edge style
    if (h && typeof h.get === "function") return h.get(name) ?? h.get(n) ?? undefined;
    // Node style
    if (h && typeof h === "object") return h[n] ?? h[name] ?? undefined;
    return undefined;
}

function slugify(text) {
    if (!text) return '';
    return text.toString().toLowerCase().trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

export default async function handler(req, res) {
    // 1. Authorization
    if (!process.env.CRON_SECRET) {
        console.error("CRITICAL: CRON_SECRET environment variable is not defined.");
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const secret = req.query?.secret || new URL(req.url, 'http://localhost').searchParams.get('secret');
    const vercelCronHeader = getHeader(req, 'x-vercel-cron');

    if (secret !== process.env.CRON_SECRET && vercelCronHeader !== '1') {
        console.warn("Unauthorized Ingest-Structures Attempt");
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const runId = crypto.randomUUID();
    const stats = {
        created: 0,
        updated: 0,
        skipped: 0,
        errors: []
    };

    try {
        for (const dataset of DATASETS) {
            console.log(`Pipeline Structures: Ingesting ${dataset.name}`);

            const response = await fetch(dataset.url);
            if (!response.ok) {
                stats.errors.push(`${dataset.id}: HTTP ${response.status}`);
                continue;
            }

            const data = await response.json();
            let items = data.results || data.records || [];

            // Limit support
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
            if (limit && limit > 0) {
                items = items.slice(0, limit);
            }

            for (const item of items) {
                try {
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
        }

        // Log the Run
        await prisma.importLog.create({
            data: {
                source_name: 'CRON_STRUCTURES_ALSACE',
                status: stats.errors.length > 0 ? 'PARTIAL' : 'SUCCESS',
                items_new: stats.created,
                items_total: stats.created + stats.updated,
                logs: stats.errors.length ? JSON.stringify(stats.errors) : null
            }
        });

    } catch (globalErr) {
        console.error("Structures Pipeline Global Error:", globalErr);
        return res.status(500).json({ error: globalErr.message });
    }

    return res.status(200).json(stats);
}
