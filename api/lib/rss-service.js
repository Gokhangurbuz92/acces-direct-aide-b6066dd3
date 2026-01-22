
import { PrismaClient } from '@prisma/client';
import { fetch } from 'undici';
import crypto from 'crypto';
import { summarizeFALC, extractKeyPoints } from './falc-summarizer.js';

const prisma = new PrismaClient();

/**
 * Very basic RSS XML parser using regex.
 */
function parseRSS(xml) {
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
        const content = match[1];

        const title = (content.match(/<title>([\s\S]*?)<\/title>/) || [])[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
        const link = (content.match(/<link>([\s\S]*?)<\/link>/) || [])[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
        const guid = (content.match(/<guid[^>]*>([\s\S]*?)<\/guid>/) || [])[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
        const description = (content.match(/<(?:description|content:encoded)>([\s\S]*?)<\/(?:description|content:encoded)>/) || [])[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
        const pubDate = (content.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');

        if (title && link) {
            items.push({
                title: title.trim(),
                link: link.trim(),
                guid: guid ? guid.trim() : link.trim(),
                description: description ? description.trim() : "",
                pubDate: (pubDate && !isNaN(Date.parse(pubDate))) ? new Date(pubDate) : new Date()
            });
        }
    }

    return items;
}

/**
 * Generates a deduplication hash.
 */
function generateHash(item, domain) {
    const data = `${item.title}${item.pubDate.getTime()}${domain}`;
    return crypto.createHash('md5').update(data).digest('hex');
}

/**
 * Synchronizes all enabled RSS sources.
 */
export async function syncAllFeeds() {
    const sources = await prisma.rssSource.findMany({ where: { enabled: true } });
    const results = { totalProcessed: 0, newItems: 0, errors: [] };

    for (const source of sources) {
        try {
            console.log(`Fetching feed: ${source.name} (${source.feed_url})`);

            const response = await fetch(source.feed_url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'application/rss+xml, application/xml, text/xml, */*'
                }
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const xml = await response.text();
            const items = parseRSS(xml);

            console.log(`Parsed ${items.length} items from ${source.name}`);
            results.totalProcessed += items.length;

            for (const item of items) {
                // Domain allowlisting check
                const itemUrl = new URL(item.link);
                const isOfficialSubdomain = itemUrl.hostname.endsWith('.gouv.fr');
                const matchesSourceDomain = itemUrl.hostname.includes(source.domain);

                if (!isOfficialSubdomain && !matchesSourceDomain) {
                    console.warn(`Skipping item from unknown domain: ${itemUrl.hostname} (Source domain: ${source.domain})`);
                    continue;
                }

                const dedupeHash = generateHash(item, source.domain);

                // Check if exists
                const existing = await prisma.actualite.findFirst({
                    where: {
                        OR: [
                            { guid: item.guid },
                            { canonical_url: item.link },
                            { dedupe_hash: dedupeHash }
                        ]
                    }
                });

                if (existing) continue;

                // Generate FALC content
                const summaryFalc = summarizeFALC(item.description);
                const keyPointsFalc = extractKeyPoints(item.description);

                // Determine category based on title/description keywords
                let categorie = "general";
                const text = (item.title + " " + item.description).toLowerCase();
                if (text.includes("logement") || text.includes("apl") || text.includes("loyer")) categorie = "logement";
                else if (text.includes("santé") || text.includes("ameli") || text.includes("maladie")) categorie = "sante";
                else if (text.includes("emploi") || text.includes("chômage") || text.includes("travail")) categorie = "emploi";
                else if (text.includes("famille") || text.includes("enfant") || text.includes("caf")) categorie = "famille";
                else if (text.includes("argent") || text.includes("budget") || text.includes("impôt")) categorie = "budget";
                else if (text.includes("étranger") || text.includes("visa") || text.includes("séjour")) categorie = "etrangers";

                // Create new Actualite
                await prisma.actualite.create({
                    data: {
                        titre: item.title,
                        slug: `${item.guid.split('/').pop()?.substring(0, 30) || 'actu'}-${dedupeHash.substring(0, 8)}`.replace(/[^a-z0-9-]/gi, '-'),
                        contenu: summaryFalc, // Store FALC in contenu for frontend compatibility
                        summary_falc: summaryFalc,
                        key_points_falc: keyPointsFalc,
                        canonical_url: item.link,
                        source_url: item.link, // For frontend
                        guid: item.guid,
                        source_id: source.id,
                        source_name: source.name,
                        source_nom: source.name, // For frontend
                        source: source.name,
                        dedupe_hash: dedupeHash,
                        date_publication: item.pubDate,
                        fetched_at: new Date(),
                        statut: "publie",
                        territoire: "FRANCE",
                        categorie: categorie,
                        type_actu: "info",
                        est_important: text.includes("important") || text.includes("urgent")
                    }
                });

                results.newItems++;
            }

            // Update source
            await prisma.rssSource.update({
                where: { id: source.id },
                data: { last_run_at: new Date(), error_count: 0 }
            });

        } catch (err) {
            console.error(`Error syncing ${source.name}:`, err);
            results.errors.push({ source: source.name, error: err.message });

            await prisma.rssSource.update({
                where: { id: source.id },
                data: { error_count: { increment: 1 }, last_error: err.message }
            });
        }
    }

    return results;
}
