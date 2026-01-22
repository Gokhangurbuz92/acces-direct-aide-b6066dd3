import { PrismaClient } from '@prisma/client';
import Parser from 'rss-parser';
import crypto from 'crypto';
import { summarizeToFalc } from '../../../lib/falc-summarizer.js';

const prisma = new PrismaClient();
const parser = new Parser();

// Helper: Slugify
function slugify(text) {
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

export async function GET(request) {
    // 1. Authorization
    // 1. Authorization
    if (process.env.CRON_SECRET && request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
        console.warn("Unauthorized Cron Attempt");
        return new Response('Unauthorized', { status: 401 });
    }

    const runId = crypto.randomUUID();
    const stats = {
        ingested: 0,
        enriched: 0,
        published: 0,
        errors: []
    };

    try {
        // ==========================================
        // STEP 1: INGESTION (Fetch & Dedupe)
        // ==========================================
        const sources = await prisma.rssSource.findMany({ where: { enabled: true } });

        for (const source of sources) {
            try {
                // Basic allowlist check (simplified vs existing ingest-rss.js)
                // console.log(`Pipeline: Fetching ${source.name}`);
                const feed = await parser.parseURL(source.feed_url);

                for (const item of feed.items) {
                    // Strict Dedupe Hash: URL + Title
                    const rawContent = `${item.title}${item.link}`;
                    const hash = crypto.createHash('md5').update(rawContent).digest('hex');

                    // Check existence by hash
                    const existingHash = await prisma.actualite.findUnique({
                        where: { raw_data_hash: hash }
                    });

                    // Check existence by canonical_url (to avoid unique constraint errors)
                    const existingUrl = item.link ? await prisma.actualite.findUnique({
                        where: { canonical_url: item.link }
                    }) : null;

                    if (!existingHash && !existingUrl) {
                        // Fallback check on old dedupe_hash to avoid migrating duplicates
                        const oldHash = crypto.createHash('md5').update(`${item.title}${item.link}`).digest('hex');
                        const oldExisting = await prisma.actualite.findFirst({ where: { dedupe_hash: oldHash } });
                        if (oldExisting) continue;

                        const isOfficial = source.trust_level === 'OFFICIAL';

                        await prisma.actualite.create({
                            data: {
                                titre: item.title || "Sans titre",
                                slug: slugify(item.title || "info") + '-' + hash.substring(0, 6),
                                contenu: item.content || item.contentSnippet || "",
                                canonical_url: item.link,
                                guid: item.guid || item.link,
                                source_id: source.id,
                                source_name: source.name,
                                source_url: source.feed_url,
                                raw_data_hash: hash,
                                dedupe_hash: hash, // Keeping legacy compatible
                                ingest_batch: runId,

                                // Tri-Valve States
                                statut: "brouillon",
                                falc_status: "pending",
                                quality_score: isOfficial ? 60 : 40, // Base score, +20 if valid FALC
                                auto_publish: isOfficial, // Only official sources auto-publish by default

                                date_publication: item.isoDate ? new Date(item.isoDate) : new Date(),
                                fetched_at: new Date()
                            }
                        });
                        stats.ingested++;
                    }
                }
            } catch (err) {
                console.error(`Error processing source ${source.name}:`, err.message);
                stats.errors.push(`${source.name}: ${err.message}`);
            }
        }

        // ==========================================
        // STEP 2: ENRICHMENT (FALC & Tags)
        // ==========================================
        // Process a batch of pending items (max 5)
        const itemsToEnrich = await prisma.actualite.findMany({
            where: { falc_status: 'pending' },
            take: 5,
            orderBy: { fetched_at: 'desc' }
        });

        for (const item of itemsToEnrich) {
            try {
                const falcResult = await summarizeToFalc(item.contenu || item.titre, `Source: ${item.source_name}`);

                await prisma.actualite.update({
                    where: { id: item.id },
                    data: {
                        summary_falc: falcResult.summary,
                        key_points_falc: falcResult.key_points,
                        falc_status: 'generated',
                        quality_score: { increment: 20 } // Bonus for successful enrichment
                        // Could add tags here later
                    }
                });
                stats.enriched++;
            } catch (err) {
                console.error(`Error enriching item ${item.id}:`, err);
                await prisma.actualite.update({
                    where: { id: item.id },
                    data: { falc_status: 'failed' }
                });
            }
        }

        // ==========================================
        // STEP 3: PUBLICATION (The Gatekeeper)
        // ==========================================
        const threshold = 75; // Min score to auto-publish
        const toPublish = await prisma.actualite.findMany({
            where: {
                statut: 'brouillon',
                auto_publish: true,
                quality_score: { gte: threshold },
                falc_status: { in: ['generated'] } // Must be simplified
            }
        });

        for (const item of toPublish) {
            await prisma.actualite.update({
                where: { id: item.id },
                data: {
                    statut: 'actif', // or 'publie' depending on frontend enum? Schema says 'default("brouillon")' string.
                    published_at: new Date()
                }
            });
            stats.published++;
        }

        // Log the Run
        await prisma.importLog.create({
            data: {
                source_name: 'CRON_PIPELINE',
                status: stats.errors.length > 0 ? 'PARTIAL' : 'SUCCESS',
                items_new: stats.ingested,
                items_total: stats.ingested + stats.enriched + stats.published, // Rough metric
                logs: stats.errors.length ? JSON.stringify(stats.errors) : null
            }
        });

    } catch (globalErr) {
        console.error("Pipeline Global Error:", globalErr);
        return new Response(JSON.stringify({ error: globalErr.message }), { status: 500 });
    }

    return new Response(JSON.stringify(stats), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}
