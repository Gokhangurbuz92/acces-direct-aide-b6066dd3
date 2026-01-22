import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import fetch from 'node-fetch';
import { geocodeAddress } from '../../_utils/geocoder.js';

const prisma = new PrismaClient();

const DATASETS = [
    {
        id: 'strasbourg-solidarite',
        name: "Lieux de solidarité (Strasbourg)",
        url: "https://data.strasbourg.eu/api/records/1.0/search/?dataset=lieux_solidarite&rows=100",
        trust_level: "OFFICIAL"
    }
];

function slugify(text) {
    if (!text) return '';
    return text.toString().toLowerCase().trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

export async function GET(request) {
    // 1. Authorization (Vercel Cron compatible)
    const urlObj = new URL(request.url);
    const secret = urlObj.searchParams.get('secret');
    const vercelCronHeader = request.headers.get('x-vercel-cron');

    if (secret !== process.env.CRON_SECRET && vercelCronHeader !== '1') {
        console.warn("Unauthorized Ingest-Structures Attempt");
        return new Response('Unauthorized', { status: 401 });
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

            const res = await fetch(dataset.url);
            if (!res.ok) {
                stats.errors.push(`${dataset.id}: HTTP ${res.status}`);
                continue;
            }

            const data = await res.json();
            const records = data.records || [];

            for (const record of records) {
                try {
                    const f = record.fields;
                    const nom = f.name || f.nom || f.raison_sociale || "Inconnu";
                    const fullAdresse = [f.adresse_num, f.adresse_lib, f.adresse_cplt].filter(Boolean).join(' ');
                    const ville = f.commune || f.ville || "Strasbourg";
                    const cp = f.code_postal || f.cp || "";

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
                        // UPDATE (Keep manual overrides if any?)
                        await prisma.structure.update({
                            where: { id: existing.id },
                            data: {
                                last_sync: new Date(),
                                import_batch: runId,
                                // We update basic fields if they are blank in DB
                                telephone: existing.telephone || f.tel || f.telephone || null,
                                email: existing.email || f.mail || f.email || null,
                                site_web: existing.site_web || f.url || f.site_internet || null,
                                raw_data_hash: hash // ensure hash is set
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
                                statut: "brouillon", // Valve 3 will promote it
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
                                    quality_score: 80 // Base bonus for geocoding success
                                }
                            });
                        } else {
                            await prisma.structure.update({
                                where: { id: newStructure.id },
                                data: { geoloc_status: "failed", quality_score: 40 }
                            });
                        }

                        // Valve 3: Publish (Conditional Auto-Promote)
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
        return new Response(JSON.stringify({ error: globalErr.message }), { status: 500 });
    }

    return new Response(JSON.stringify(stats), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}
