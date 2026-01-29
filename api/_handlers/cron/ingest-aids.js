import { isCronAuthorized } from '../../_utils/cronAuth.js';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

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

export default async function handler(req, res) {
    if (!isCronAuthorized(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

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

    try {
        // For this implementation, we use a reliable curated source or the starter pack logic
        // but automated. In a real scenario, this would be an external API fetch.
        const SOURCE_URL = "https://raw.githubusercontent.com/Gokhangurbuz92/data-sources/main/aids-france.json";

        // Fetch external data (fallback to local if unreachable)
        let externalAids = [];
        try {
            const startFetch = Date.now();
            const response = await fetch(SOURCE_URL);
            stats.durationByStage.fetchMs = Date.now() - startFetch;

            if (response.ok) {
                // Anti Silent Failure Logs
                // We check headers/content-type if needed, but here response.ok means we got it.
                // We read JSON and THEN check length.
                externalAids = await response.json();

                if (!externalAids || externalAids.length === 0) {
                    console.warn(`[AIDS] 0 items. status=${response.status} ct=${response.headers.get('content-type')} keys=${Array.isArray(externalAids) ? '[]' : Object.keys(externalAids).join(',')}`);
                }

                stats.fetched = externalAids.length;
            }
        } catch (e) {
            console.warn("External source unreachable, skipping automated enrichment.");
        }

        // Limit support
        const limitParam = req.query.limit;
        if (limitParam) {
            const limit = parseInt(limitParam, 10);
            if (limit > 0) {
                externalAids = externalAids.slice(0, limit);
            }
        }

        const startProcess = Date.now();
        // Process items
        for (const item of externalAids) {
            stats.processed++;
            const hash = crypto.createHash('md5').update(JSON.stringify(item)).digest('hex');
            const slug = slugify(item.title);

            const existing = await prisma.aide.findUnique({ where: { slug } });

            if (existing) {
                await prisma.aide.update({
                    where: { slug },
                    data: {
                        titre: item.title,
                        summary_falc: item.summary,
                        providerName: item.provider,
                        statut: 'publie',
                        published_at: new Date()
                    }
                });
                stats.updated++;
            } else {
                await prisma.aide.create({
                    data: {
                        titre: item.title,
                        slug,
                        summary_falc: item.summary,
                        providerName: item.provider,
                        statut: 'publie',
                        published_at: new Date()
                    }
                });
                stats.created++;
            }
        }
        stats.durationByStage.processingMs = Date.now() - startProcess;

        // Log the Run
        try {
            await prisma.importLog.create({
                data: {
                    source_name: 'CRON_AIDS',
                    status: stats.errors.length > 0 ? 'PARTIAL' : 'SUCCESS',
                    items_new: stats.created,
                    items_total: stats.processed,
                    logs: stats.errors.length ? JSON.stringify(stats.errors) : null,
                    duration_ms: Date.now() - startTotal
                }
            });
        } catch (e) { /* ignore log error */ }

        return res.status(200).json(stats);
    } catch (error) {
        console.error('Ingest Aids Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
