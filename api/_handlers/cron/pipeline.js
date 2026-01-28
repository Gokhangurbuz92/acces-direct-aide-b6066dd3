/* global process */
import { PrismaClient } from '@prisma/client';
import Parser from 'rss-parser';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { summarizeToFalc } from '../../lib/falc-summarizer.js';
import { ensureSlug } from '../../lib/slug.js';
import ingestStructures from './ingest-structures.js';
import ingestAids from './ingest-aids.js';

const prisma = new PrismaClient();
const parser = new Parser();

// Helper: Slugify
function slugify(text) {
    if (!text) return '';
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

export default async function handler(req, res) {
    // 1. Authorization
    if (!process.env.CRON_SECRET) {
        console.error("CRITICAL: CRON_SECRET environment variable is not defined.");
        return res.status(500).json({ error: 'Server configuration error' });
    }

    // req.query is available in Vercel function, or parsed by dev-server
    const query = req.query || {};
    const secret = query.secret || new URL(req.url, `http://${req.headers.host}`).searchParams.get('secret');
    const vercelCronHeader = req.headers['x-vercel-cron'];
    const authHeader = req.headers['authorization'];

    const isAuthorized =
        secret === process.env.CRON_SECRET ||
        vercelCronHeader === '1' ||
        authHeader === `Bearer ${process.env.CRON_SECRET}`;

    if (!isAuthorized) {
        console.warn("Unauthorized Pipeline Attempt");
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // 2. Validation & Parameters
    const source = query.source; // 'structures', 'aides', 'rss'
    const mode = query.mode; // 'smoke'
    const limitParam = query.limit;

    // Determine limit: explicit > smoke default (5) > undefined (unlimited)
    let limit = limitParam ? parseInt(limitParam, 10) : (mode === 'smoke' ? 5 : undefined);

    if (!source) {
        return res.status(400).json({
            ok: false,
            error: "Missing required 'source' parameter. Options: 'structures', 'aides', 'rss'."
        });
    }

    const runId = crypto.randomUUID();
    const stats = {
        ingested: 0,
        enriched: 0,
        published: 0,
        errors: []
    };
    const startTime = Date.now();

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
        // ROUTING LOGIC
        // ==========================================

        if (source === 'structures') {
            try {
                // Pass limit via query to the handler
                const subQuery = { secret: process.env.CRON_SECRET };
                if (limit) subQuery.limit = limit.toString();

                await ingestStructures({ query: subQuery, headers: {}, url: '/' }, {
                    status: () => ({
                        json: (d) => {
                            if (d) {
                                stats.ingested += (d.created || 0);
                                if (d.errors) stats.errors.push(...d.errors);
                            }
                        }
                    })
                });
            } catch (e) {
                console.error("Pipeline: Ingest Structures failed", e);
                stats.errors.push(`Structures failed: ${e.message}`);
                throw e; // Propagate to trigger failure response
            }

        } else if (source === 'aides') {
            try {
                const subQuery = { secret: process.env.CRON_SECRET };
                if (limit) subQuery.limit = limit.toString();

                await ingestAids({ query: subQuery, headers: {}, url: '/' }, {
                    status: () => ({
                        json: (d) => {
                            if (d) {
                                stats.ingested += (d.created || 0);
                                if (d.errors) stats.errors.push(...d.errors);
                            }
                        }
                    })
                });
            } catch (e) {
                console.error("Pipeline: Ingest Aids failed", e);
                stats.errors.push(`Aids failed: ${e.message}`);
                throw e;
            }

        } else if (source === 'rss') {
            // ==========================================
            // RSS INGESTION
            // ==========================================
            // Step 0: Ensure Config Exists (Upsert Sources)
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
                                enabled: true
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
                stats.errors.push(`Config Seed failed: ${e.message}`);
            }

            const sources = await prisma.rssSource.findMany({ where: { enabled: true } });

            let processedCount = 0;
            // Apply limit across ALL sources or per source? 
            // 'limit' usually implies total items for this run.
            // We'll stop after reaching limit total items.

            for (const source of sources) {
                if (limit && processedCount >= limit) break;

                try {
                    const feed = await retry(() => parser.parseURL(source.feed_url));

                    // Slice feed items if remainder of limit is small
                    let itemsToProcess = feed.items;
                    if (limit) {
                        const remaining = limit - processedCount;
                        itemsToProcess = itemsToProcess.slice(0, remaining);
                    }

                    for (const item of itemsToProcess) {
                        const rawContent = `${item.title}${item.link}`;
                        const hash = crypto.createHash('md5').update(rawContent).digest('hex');
                        const isOfficial = source.trust_level === 'OFFICIAL';

                        try {
                            const itemSlug = await ensureSlug(prisma, 'actualite', {
                                id: null,
                                titre: item.title || "Sans titre",
                                slug: null
                            }, 'titre');

                            const upsertData = {
                                titre: item.title || "Sans titre",
                                slug: itemSlug || (slugify(item.title || "info") + '-' + hash.substring(0, 6)),
                                contenu: item.content || item.contentSnippet || "",
                                resume: item.contentSnippet || item.content || "",
                                canonical_url: item.link,
                                guid: item.guid || item.link,
                                source_id: source.id,
                                source_name: source.name,
                                source_url: source.feed_url,
                                dedupe_hash: hash,
                                ingest_batch: runId,
                                statut: "brouillon",
                                falc_status: "pending",
                                quality_score: isOfficial ? 60 : 40,
                                auto_publish: isOfficial,
                                date_publication: item.isoDate ? new Date(item.isoDate) : new Date(),
                                fetched_at: new Date(),
                                tags: []
                            };

                            const result = await prisma.actualite.upsert({
                                where: { raw_data_hash: hash },
                                update: {},
                                create: { ...upsertData, raw_data_hash: hash }
                            });

                            if (Math.abs(result.fetched_at - upsertData.fetched_at) < 2000) {
                                stats.ingested++;
                            }
                            processedCount++;

                        } catch (e) {
                            if (!e.message.includes('Unique constraint')) {
                                throw e;
                            }
                        }
                    }
                } catch (err) {
                    console.error(`Error processing source ${source.name}:`, err.message);
                    stats.errors.push(`${source.name}: ${err.message}`);
                }
            }

            // RSS specific: Enrichment & Publication (Optional: could also be separate steps/sources)
            // For now, keep them part of 'rss' run but respect limit?
            // Usually enrichment is separate, but let's keep it here for continuity unless 'limit' prevented ingestion.

            // ... (Keeping existing enrichment/publish logic for brevity, assuming it runs on pending items)
            // Ideally, we only enrich what we just ingested or small batch.

            // STEP 2: ENRICHMENT
            const itemsToEnrich = await prisma.actualite.findMany({
                where: { falc_status: 'pending' },
                take: limit ? Math.min(limit, 5) : 5, // Respect limit or default 5
                orderBy: { fetched_at: 'desc' }
            });

            for (const item of itemsToEnrich) {
                // ... enrichment logic (same as before)
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

            // STEP 3: PUBLICATION
            const threshold = 75;
            const toPublish = await prisma.actualite.findMany({
                where: {
                    statut: 'brouillon',
                    auto_publish: true,
                    quality_score: { gte: threshold },
                    falc_status: { in: ['generated'] }
                },
                take: limit ? limit : undefined // Optional: limit publication too?
            });

            for (const item of toPublish) {
                await prisma.actualite.update({
                    where: { id: item.id },
                    data: {
                        statut: 'publie',
                        published_at: new Date()
                    }
                });
                stats.published++;
            }

        } else {
            const err = new Error(`Invalid source '${source}'. Valid: structures, aides, rss`);
            // We'll throw so it's caught and correctly errored
            throw err;
        }

        // Log the Run
        await prisma.importLog.create({
            data: {
                source_name: `CRON_${source.toUpperCase()}`,
                status: stats.errors.length > 0 ? 'PARTIAL' : 'SUCCESS',
                items_new: stats.ingested,
                items_total: stats.ingested + stats.enriched + stats.published,
                logs: stats.errors.length ? JSON.stringify(stats.errors) : null,
                duration_ms: Date.now() - startTime
            }
        });
    };

    try {
        await Promise.race([pipelineLogic(), timeoutPromise]);
    } catch (globalErr) {
        console.error("Pipeline Global Error:", globalErr);
        // Try to log failure
        try {
            await prisma.importLog.create({
                data: {
                    source_name: `CRON_${source ? source.toUpperCase() : 'UNKNOWN'}`,
                    status: 'ERROR',
                    logs: JSON.stringify(globalErr.message),
                    duration_ms: Date.now() - startTime
                }
            });
        } catch (e) { /* ignore */ }

        // Use 400 for bad requests, 500 for others
        const statusCode = globalErr.message.includes('Invalid source') ? 400 : 500;
        return res.status(statusCode).json({
            ok: false,
            error: globalErr.message,
            source,
            mode,
            durationMs: Date.now() - startTime
        });
    }

    return res.status(200).json({
        ok: true,
        source,
        mode,
        durationMs: Date.now() - startTime,
        stats
    });
}
