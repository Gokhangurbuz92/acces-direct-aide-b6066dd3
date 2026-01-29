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

// Helper: Safe Header Access
function getHeader(req, name) {
    const n = name.toLowerCase();
    const h = req?.headers;
    if (h && typeof h.get === "function") return h.get(name) ?? h.get(n) ?? undefined;
    if (h && typeof h === "object") return h[n] ?? h[name] ?? undefined;
    return undefined;
}

export default async function handler(req, res) {
    // 1. Authorization
    if (!process.env.CRON_SECRET) {
        console.error("CRITICAL: CRON_SECRET environment variable is not defined.");
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const query = req.query || {};
    // Safe header access
    const secret = query.secret || new URL(req.url, `http://${req.headers?.host || 'localhost'}`).searchParams.get('secret');
    const vercelCronHeader = getHeader(req, 'x-vercel-cron');
    const authHeader = getHeader(req, 'authorization');

    const isAuthorized =
        secret === process.env.CRON_SECRET ||
        vercelCronHeader === '1' ||
        authHeader === `Bearer ${process.env.CRON_SECRET}`;

    if (!isAuthorized) {
        console.warn("Unauthorized Pipeline Attempt");
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // 2. Validation & Parameters (with Aliases)
    let sourceInput = query.source;
    let sourceResolved = sourceInput;

    // ALIAS LOGIC
    if (sourceInput === 'actualites') sourceResolved = 'rss';
    if (sourceInput === 'demarches') sourceResolved = 'aides';

    const mode = query.mode; // 'smoke'
    const limitParam = query.limit;

    // Determine limit: explicit > smoke default (5) > undefined (unlimited)
    let limit = limitParam ? parseInt(limitParam, 10) : (mode === 'smoke' ? 5 : undefined);

    if (!sourceResolved) {
        return res.status(400).json({
            ok: false,
            error: "Missing required 'source' parameter. Options: 'structures', 'aides' (or 'demarches'), 'rss' (or 'actualites')."
        });
    }

    const runId = crypto.randomUUID();

    // Enhanced Stats Logic
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

    // Helper: Merge API Stats
    const mergeStats = (subStats) => {
        if (!subStats) return;
        stats.fetched += (subStats.fetched || 0);
        stats.processed += (subStats.processed || 0);
        stats.created += (subStats.created || 0);
        stats.updated += (subStats.updated || 0);
        stats.skippedExisting += (subStats.skippedExisting || 0);

        if (subStats.errors && Array.isArray(subStats.errors)) {
            stats.errors.push(...subStats.errors);
        }

        if (subStats.durationByStage) {
            stats.durationByStage.fetchMs += (subStats.durationByStage.fetchMs || 0);
            stats.durationByStage.processingMs += (subStats.durationByStage.processingMs || 0);
        }
    };

    // Wrap entire execution in a timeout (50s safe limit for Vercel 60s max)
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Pipeline Timeout')), 50000)
    );

    const pipelineLogic = async () => {
        // ==========================================
        // ROUTING LOGIC
        // ==========================================

        if (sourceResolved === 'structures') {
            try {
                const subQuery = { secret: process.env.CRON_SECRET };
                if (limit) subQuery.limit = limit.toString();

                await ingestStructures({ query: subQuery }, {
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
                // Don't throw logic error to crash pipeline stats return if possible
            }

        } else if (sourceResolved === 'aides') {
            try {
                const subQuery = { secret: process.env.CRON_SECRET };
                if (limit) subQuery.limit = limit.toString();

                await ingestAids({ query: subQuery }, {
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
            }

        } else if (sourceResolved === 'rss') {
            // RSS Logic adapted for new stats

            // Step 0: Seed Config
            try {
                const configPath = path.join(process.cwd(), 'config', 'rss-sources.json');
                if (fs.existsSync(configPath)) {
                    const configSources = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                    for (const src of configSources) {
                        await prisma.rssSource.upsert({
                            where: { feed_url: src.url },
                            update: { enabled: true, trust_level: src.trust_level },
                            create: { name: src.name, feed_url: src.url, domain: src.domain, trust_level: src.trust_level, enabled: true }
                        });
                    }
                }
            } catch (e) {/* ignore */ }

            const sources = await prisma.rssSource.findMany({ where: { enabled: true } });

            let processedCount = 0;

            for (const source of sources) {
                if (limit && processedCount >= limit) break;

                try {
                    const startFetch = Date.now();
                    const feed = await retry(() => parser.parseURL(source.feed_url));
                    stats.durationByStage.fetchMs += (Date.now() - startFetch);

                    let itemsToProcess = feed.items;
                    if (limit) {
                        const remaining = limit - processedCount;
                        itemsToProcess = itemsToProcess.slice(0, remaining);
                    }
                    stats.fetched += itemsToProcess.length;

                    const startProc = Date.now();
                    for (const item of itemsToProcess) {
                        stats.processed++;
                        const rawContent = `${item.title}${item.link}`;
                        const hash = crypto.createHash('md5').update(rawContent).digest('hex');
                        const isOfficial = source.trust_level === 'OFFICIAL';

                        try {
                            const itemSlug = await ensureSlug(prisma, 'actualite', { id: null, titre: item.title || "Sans", slug: null }, 'titre');
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
                                stats.created++;
                            } else {
                                stats.skippedExisting++;
                            }
                            processedCount++;
                        } catch (e) {
                            // ignore unique constraints
                        }
                    }
                    stats.durationByStage.processingMs += (Date.now() - startProc);

                } catch (err) {
                    stats.errors.push(`${source.name}: ${err.message}`);
                }
            }
        } else {
            const err = new Error(`Invalid source '${sourceResolved}' (resolved from '${sourceInput}'). Valid: structures, aides, rss`);
            throw err;
        }

        // Log the Run
        try {
            await prisma.importLog.create({
                data: {
                    source_name: `CRON_${sourceResolved.toUpperCase()}`,
                    status: stats.errors.length > 0 ? 'PARTIAL' : 'SUCCESS',
                    items_new: stats.created,
                    items_total: stats.processed,
                    logs: stats.errors.length ? JSON.stringify(stats.errors) : null,
                    duration_ms: Date.now() - startTime
                }
            });
        } catch (e) { /* ignore */ }
    };

    try {
        await Promise.race([pipelineLogic(), timeoutPromise]);
    } catch (globalErr) {
        console.error("Pipeline Global Error:", globalErr);
        // Try to log failure
        try {
            await prisma.importLog.create({
                data: {
                    source_name: `CRON_${sourceResolved ? sourceResolved.toUpperCase() : 'UNKNOWN'}`,
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
            source: sourceInput,
            sourceResolved,
            mode,
            durationMs: Date.now() - startTime
        });
    }

    return res.status(200).json({
        ok: true,
        source: sourceInput,
        sourceResolved,
        mode,
        durationMs: Date.now() - startTime,
        stats
    });
}
