import { PrismaClient } from '@prisma/client';
import Parser from 'rss-parser';
import { summarizeToFalc } from '../../lib/falc-summarizer.js';
import crypto from 'crypto';

const prisma = new PrismaClient();
const parser = new Parser();

// Allowlist of trusted domains
const ALLOWED_DOMAINS = [
    'service-public.fr',
    'caf.fr',
    'handicap.gouv.fr',
    'monparcourshandicap.gouv.fr',
    'legifrance.gouv.fr',
    'bas-rhin.fr',
    'grandest.fr',
    'strasbourg.eu'
];

export async function GET(request) {
    // Security check: verify authorization header if needed, 
    // currently relying on Vercel Cron protection usually (check CRON_SECRET if needed).
    // For now, we open it but in prod users should secure crons.

    if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
        // return new Response('Unauthorized', { status: 401 });
        // In dev, we might relax this or check env.
        // console.log("Cron secret verification skipped in dev or missing env");
    }

    const sources = await prisma.rssSource.findMany({
        where: { enabled: true }
    });

    const results = {
        processed: 0,
        created: 0,
        errors: []
    };

    for (const source of sources) {
        try {
            // Validate domain
            try {
                const urlObj = new URL(source.feed_url);
                const domain = urlObj.hostname.replace(/^www\./, '');
                if (!ALLOWED_DOMAINS.some(d => domain.endsWith(d))) {
                    console.warn(`Skipping source ${source.name}: domain ${domain} not in allowlist.`);
                    continue;
                }
            } catch (e) {
                console.warn(`Invalid URL for source ${source.name}: ${source.feed_url}`);
                continue;
            }

            console.log(`Fetching feed: ${source.name}`);
            const feed = await parser.parseURL(source.feed_url);

            for (const item of feed.items) {
                // Create a basic hash for deduplication
                const hashContent = `${item.title || ''}${item.link || ''}`;
                const dedupeHash = crypto.createHash('md5').update(hashContent).digest('hex');

                // Check if exists
                const existing = await prisma.actualite.findFirst({
                    where: { dedupe_hash: dedupeHash }
                });

                if (existing) {
                    continue;
                }

                // Generate FALC summary
                const contentText = item.contentSnippet || item.content || "";
                const falcResult = await summarizeToFalc(contentText, `Source: ${source.name}`);

                // Create Draft
                await prisma.actualite.create({
                    data: {
                        titre: item.title || "Sans titre",
                        slug: slugify(item.title || "sans-titre") + '-' + dedupeHash.substring(0, 6),
                        contenu: item.content || item.contentSnippet || "",
                        summary_falc: falcResult.summary,
                        key_points_falc: falcResult.key_points,
                        canonical_url: item.link,
                        guid: item.guid || item.link,
                        source_id: source.id,
                        source_name: source.name,
                        source_url: source.feed_url,
                        // source, type_actu, etc. default
                        dedupe_hash: dedupeHash,
                        statut: "brouillon", // Needs validation
                        date_publication: item.isoDate ? new Date(item.isoDate) : new Date(),
                        fetched_at: new Date(),
                        score_fiabilite: source.trust_level === 'OFFICIAL' ? 10 : 8
                    }
                });

                results.created++;
            }

            results.processed++;

            // Update source stats
            await prisma.rssSource.update({
                where: { id: source.id },
                data: {
                    last_run_at: new Date(),
                    error_count: 0,
                    last_error: null
                }
            });

        } catch (err) {
            console.error(`Error processing feed ${source.name}:`, err);
            results.errors.push(`${source.name}: ${err.message}`);

            await prisma.rssSource.update({
                where: { id: source.id },
                data: {
                    error_count: { increment: 1 },
                    last_error: err.message
                }
            });
        }
    }

    return new Response(JSON.stringify(results), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}

function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-')   // Replace multiple - with single -
        .replace(/^-+/, '')       // Trim - from start of text
        .replace(/-+$/, '');      // Trim - from end of text
}
