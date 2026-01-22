import { PrismaClient } from '@prisma/client';
import { fetch } from 'undici';
import slugify from '@sindresorhus/slugify';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Configuration
const CRON_SECRET = process.env.CRON_SECRET || 'dev-secret-key';
const SCORE_THRESHOLD = 80;

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { key } = req.query;
    if (key !== CRON_SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const results = {
        processed: 0,
        created: 0,
        skipped: 0,
        errors: []
    };

    try {
        const configPath = path.join(process.cwd(), 'config', 'rss-sources.json');
        const sources = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        for (const source of sources) {
            try {
                const response = await fetch(source.url);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const xml = await response.text();

                // Simple RSS Item Regex Parser
                const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);

                for (const match of itemMatches) {
                    const itemContent = match[1];
                    const title = extractTag(itemContent, 'title');
                    const link = extractTag(itemContent, 'link');
                    const pubDate = extractTag(itemContent, 'pubDate');
                    const description = extractTag(itemContent, 'description');

                    if (!title || !link) continue;

                    results.processed++;

                    // Deduplication Hash
                    const hash = crypto.createHash('sha256')
                        .update(`${link}${title}`)
                        .digest('hex');

                    // Check if exists
                    const existing = await prisma.actualite.findFirst({
                        where: { OR: [{ dedupe_hash: hash }, { canonical_url: link }] }
                    });

                    if (existing) {
                        results.skipped++;
                        continue;
                    }

                    // Calculate score
                    const score = calculateScore(source, title, link);
                    const statut = score >= SCORE_THRESHOLD ? 'publie' : 'en_revue';

                    // Create Actualite
                    await prisma.actualite.create({
                        data: {
                            titre: title,
                            slug: slugify(title) + '-' + hash.substring(0, 6),
                            contenu: cleanText(description),
                            summary_falc: cleanText(description), // Initial FALC is just the description
                            source_nom: source.name,
                            source_url: source.url,
                            url: link,
                            canonical_url: link,
                            date_publication: pubDate ? new Date(pubDate) : new Date(),
                            score_fiabilite: score,
                            statut: statut,
                            dedupe_hash: hash,
                            category: source.category,
                            raw_payload_json: { title, link, pubDate, description, source: source.name }
                        }
                    });

                    results.created++;
                }
            } catch (err) {
                console.error(`Error on source ${source.name}:`, err);
                results.errors.push(`${source.name}: ${err.message}`);
            }
        }

        // Log the run
        await prisma.updateLog.create({
            data: {
                status: results.errors.length > 0 ? (results.created > 0 ? 'partial' : 'failed') : 'success',
                items_fetched_count: results.processed,
                items_created_count: results.created,
                items_skipped_count: results.skipped,
                errors: results.errors,
                source_name: 'RSS_CRON'
            }
        });

        res.status(200).json(results);
    } catch (e) {
        console.error('RSS Ingest error:', e);
        res.status(500).json({ error: e.message });
    }
}

function extractTag(xml, tag) {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const match = xml.match(regex);
    if (!match) return null;
    let content = match[1];
    // Handle CDATA
    if (content.includes('<![CDATA[')) {
        content = content.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
    }
    return content.trim();
}

function cleanText(text) {
    if (!text) return '';
    return text
        .replace(/<[^>]*>/g, '') // Remove HTML
        .replace(/&nbsp;/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
}

function calculateScore(source, title, url) {
    let score = 0;

    // Domain rules
    if (source.domain.endsWith('gouv.fr') || source.domain === 'service-public.fr') score += 50;
    else if (source.domain === 'ameli.fr' || source.domain === 'caf.fr') score += 45;
    else if (source.trust_level === 'OFFICIAL') score += 35;

    // Security
    if (url.startsWith('https://')) score += 5;

    // Content keywords (bonus)
    const keywords = ['aide', 'droit', 'social', 'prestation', 'allocation', 'handicap', 'logement'];
    const titleLower = title.toLowerCase();
    if (keywords.some(k => titleLower.includes(k))) score += 5;

    // Recency bonus (assumed for news fetched now)
    score += 5;

    return Math.min(100, score);
}
