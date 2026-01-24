/* global process */
import { PrismaClient } from '@prisma/client';
import Parser from 'rss-parser';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { summarizeToFalc } from '../../lib/falc-summarizer.js';

const prisma = new PrismaClient();
const parser = new Parser();

// Helper: Slugify
function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

export async function GET(request) {
    // 1. Authorization
    if (!process.env.CRON_SECRET) {
        console.error("CRITICAL: CRON_SECRET environment variable is not defined.");
        return new Response('Server configuration error', { status: 500 });
    }

    const urlObj = new URL(request.url);
    const secret = urlObj.searchParams.get('secret');
    const vercelCronHeader = request.headers.get('x-vercel-cron');
    const authHeader = request.headers.get('authorization');

    const isAuthorized =
        secret === process.env.CRON_SECRET ||
        vercelCronHeader === '1' ||
        authHeader === `Bearer ${process.env.CRON_SECRET}`;

    if (!isAuthorized) {
        console.warn("Unauthorized Pipeline Attempt");
        return new Response('Unauthorized', { status: 401 });
    }

    const runId = crypto.randomUUID();
    const stats = {
        ingested: 0,
        enriched: 0,
        published: 0,
        errors: []
    };

    // Helper: Retry wrapper
    async function retry(fn, retries = 3, delay = 1000) {
        for (let i = 0; i < retries; i++) {
            try {
                return await fn();
            } catch (err) {
                if (i === retries - 1) throw err;
                await new Promise(res => setTimeout(res, delay * Math.pow(2, i)));
            }
        }
    }

    // Wrap entire execution in a timeout (50s safe limit for Vercel 60s max)
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Pipeline Timeout')), 50000)
    );

    const pipelineLogic = async () => {
        // ==========================================
        // STEP 0: SEED CONFIG (Ensure Sources Exist)
        // ==========================================
        try {
            const configPath = path.join(process.cwd(), 'config', 'rss-sources.json');
            if (fs.existsSync(configPath)) {
                 const configSources = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                 for (const src of configSources) {
                     await prisma.rssSource.upsert({
                         where: { feed_url: src.url },
                         update: {
                             name: src.name,
                             domain: src.domain,
                             trust_level: src.trust_level,
                             enabled: true // Re-enable if in config
                         },
                         create: {
                             name: src.name,
                             feed_url: src.url,
                             domain: src.domain,
                             trust_level: src.trust_level,
                             enabled: true
                         }
                     });
                 }
            }
        } catch (e) {
            console.error("Pipeline: Seed Config failed", e);
        }

        // ==========================================
        // STEP 0.5: CORE INGESTION (Structures & Aids)
        // ==========================================
        // Structures
        try {
            const structuresHandler = await import('./ingest-structures.js');
            await structuresHandler.default({ query: { secret: process.env.CRON_SECRET } }, {
                status: () => ({ json: (d) => { if (d && d.created) stats.ingested += d.created; } })
            });
        } catch (e) { console.error("Pipeline: Ingest Structures failed", e); }

        // Aids
        try {
            const aidsHandler = await import('./ingest-aids.js');
            await aidsHandler.default({ query: { secret: process.env.CRON_SECRET } }, {
                status: () => ({ json: (d) => { if (d && d.created) stats.ingested += d.created; } })
            });
        } catch (e) { console.error("Pipeline: Ingest Aids failed", e); }

        // ==========================================
        // STEP 1: RSS INGESTION
        // ==========================================
        const sources = await prisma.rssSource.findMany({ where: { enabled: true } });

        for (const source of sources) {
            try {
                const feed = await retry(() => parser.parseURL(source.feed_url));

                for (const item of feed.items) {
                    const rawContent = `${item.title}${item.link}`;
                    const hash = crypto.createHash('md5').update(rawContent).digest('hex');
                    const isOfficial = source.trust_level === 'OFFICIAL';

                    // Using upsert to handle concurrency and idempotency
                    // Note: We catch potential conflicts on canonical_url if it differs from hash
                    try {
                        const upsertData = {
                            titre: item.title || "Sans titre",
                            slug: slugify(item.title || "info") + '-' + hash.substring(0, 6),
                            contenu: item.content || item.contentSnippet || "",
                            resume: item.contentSnippet || item.content || "", // Raw summary
                            canonical_url: item.link,
                            guid: item.guid || item.link,
                            source_id: source.id,
                            source_name: source.name,
                            source_url: source.feed_url,
                            dedupe_hash: hash,
                            ingest_batch: runId,
                            statut: "brouillon", // Default to draft, auto-publish step will handle it
                            falc_status: "pending",
                            quality_score: isOfficial ? 60 : 40,
                            auto_publish: isOfficial,
                            date_publication: item.isoDate ? new Date(item.isoDate) : new Date(),
                            fetched_at: new Date(),
                            tags: [] // Can map from source if available
                        };

                        const result = await prisma.actualite.upsert({
                            where: { raw_data_hash: hash },
                            update: {},
                            create: { ...upsertData, raw_data_hash: hash }
                        });

                        // We count it if it was created recently (approx check)
                        if (Math.abs(result.fetched_at - upsertData.fetched_at) < 2000) {
                            stats.ingested++;
                        }
                    } catch (e) {
                         if (!e.message.includes('Unique constraint')) {
                             throw e;
                         }
                         // Ignore duplicate canonical_url
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
                        quality_score: { increment: 20 }
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
        // STEP 3: PUBLICATION
        // ==========================================
        const threshold = 75;
        const toPublish = await prisma.actualite.findMany({
            where: {
                statut: 'brouillon',
                auto_publish: true,
                quality_score: { gte: threshold },
                falc_status: { in: ['generated'] }
            }
        });

        for (const item of toPublish) {
            await prisma.actualite.update({
                where: { id: item.id },
                data: {
                    statut: 'publie', // FIXED: actif -> publie
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
                items_total: stats.ingested + stats.enriched + stats.published,
                logs: stats.errors.length ? JSON.stringify(stats.errors) : null
            }
        });
    };

    try {
        await Promise.race([pipelineLogic(), timeoutPromise]);
    } catch (globalErr) {
        console.error("Pipeline Global Error:", globalErr);
        // Try to log the failure to DB if possible
        try {
             await prisma.importLog.create({
                data: {
                    source_name: 'CRON_PIPELINE',
                    status: 'ERROR',
                    logs: JSON.stringify(globalErr.message)
                }
            });
        } catch (e) { /* ignore */ } // eslint-disable-line no-unused-vars

        return new Response(JSON.stringify({ error: globalErr.message }), { status: 500 });
    }

    return new Response(JSON.stringify(stats), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}
