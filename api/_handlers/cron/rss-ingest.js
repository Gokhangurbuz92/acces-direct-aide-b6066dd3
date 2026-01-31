import { isCronAuthorized } from '../../_utils/cronAuth.js';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import Parser from 'rss-parser';
import slugify from '@sindresorhus/slugify';

const prisma = new PrismaClient();
const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'AccesDirectAide/1.0 (https://www.accesdirectaide.fr)',
  },
});

/**
 * Calculate reliability score based on source trust level and content quality
 */
function calculateReliabilityScore(source, item) {
  let score = 0;

  // Base score from source trust level
  switch (source.trust_level) {
    case 'OFFICIAL':
      score += 90;
      break;
    case 'VERIFIED':
      score += 70;
      break;
    case 'COMMUNITY':
      score += 50;
      break;
    default:
      score += 30;
  }

  // Content quality indicators
  if (item.title && item.title.length > 10) score += 5;
  if (item.contentSnippet && item.contentSnippet.length > 100) score += 5;

  return Math.min(100, score);
}

/**
 * Categorize news item based on keywords in title and content
 */
function categorizeItem(title, content) {
  const text = `${title} ${content}`.toLowerCase();

  const categories = {
    logement: ['logement', 'hlm', 'loyer', 'locataire', 'propriétaire', 'apl', 'aide au logement'],
    sante: ['santé', 'médical', 'hôpital', 'cpam', 'sécurité sociale', 'mutuelle', 'soins'],
    handicap: ['handicap', 'aah', 'mdph', 'accessibilité', 'invalidité'],
    emploi: ['emploi', 'chômage', 'pôle emploi', 'travail', 'formation', 'rsa'],
    famille: ['famille', 'enfant', 'caf', 'allocation familiale', 'parent', 'naissance'],
    budget: ['budget', 'impôt', 'taxe', 'prime', 'aide financière', 'revenu'],
    mobilite: ['transport', 'permis', 'mobilité', 'déplacement'],
    justice: ['justice', 'droit', 'juridique', 'tribunal', 'avocat'],
    numerique: ['numérique', 'internet', 'digital', 'en ligne', 'téléservice'],
    etrangers: ['étranger', 'immigration', 'titre de séjour', 'naturalisation'],
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return category;
    }
  }

  return 'general';
}

/**
 * Extract clean summary from RSS content
 */
function extractSummary(item) {
  const content = item.contentSnippet || item.content || item.summary || '';
  
  // Remove HTML tags
  const cleanContent = content.replace(/<[^>]*>/g, '');
  
  // Limit to 2-4 paragraphs (approximately 500 characters)
  const truncated = cleanContent.substring(0, 500);
  
  // Find last complete sentence
  const lastPeriod = truncated.lastIndexOf('.');
  if (lastPeriod > 200) {
    return truncated.substring(0, lastPeriod + 1).trim();
  }
  
  return truncated.trim();
}

/**
 * Generate deduplication hash from title and link
 */
function generateDedupeHash(title, link) {
  const normalized = `${title.toLowerCase().trim()}|${link}`;
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Pure ingestion logic for RSS feeds
 */
export async function runRssIngest({ limit, dryRun = false, sourceId = null }) {
  const runId = crypto.randomUUID();
  const stats = {
    fetched: 0,
    processed: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    sourceResults: [],
    durationMs: 0,
  };

  const startTime = Date.now();

  try {
    // Fetch enabled RSS sources
    const where = { enabled: true };
    if (sourceId) where.id = sourceId;

    const sources = await prisma.rssSource.findMany({ where });

    if (sources.length === 0) {
      stats.errors.push('No enabled RSS sources found');
      return stats;
    }

    console.log(`[RSS_INGEST] Processing ${sources.length} sources`);

    for (const source of sources) {
      const sourceStats = {
        sourceName: source.name,
        fetched: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: [],
      };

      try {
        console.log(`[RSS_INGEST] Fetching ${source.name}: ${source.feed_url}`);

        // Parse RSS feed
        const feed = await parser.parseURL(source.feed_url);
        const items = feed.items || [];
        
        sourceStats.fetched = items.length;
        stats.fetched += items.length;

        // Apply limit if specified
        const itemsToProcess = limit ? items.slice(0, limit) : items;

        for (const item of itemsToProcess) {
          stats.processed++;

          try {
            if (!item.title || !item.link) {
              sourceStats.errors.push(`Missing title or link: ${item.guid || 'unknown'}`);
              continue;
            }

            // Generate deduplication hash
            const dedupeHash = generateDedupeHash(item.title, item.link);

            // Check if already exists
            const existing = await prisma.actualite.findFirst({
              where: { dedupe_hash: dedupeHash },
            });

            const summary = extractSummary(item);
            const category = categorizeItem(item.title, summary);
            const reliabilityScore = calculateReliabilityScore(source, item);
            const slug = slugify(item.title);

            const data = {
              titre: item.title.substring(0, 255),
              slug: slug.substring(0, 255),
              contenu: summary,
              summary_falc: summary,
              date_publication: item.pubDate ? new Date(item.pubDate) : new Date(),
              source_nom: source.name,
              source_url: item.link,
              canonical_url: item.link,
              guid: item.guid || item.link,
              dedupe_hash: dedupeHash,
              categorie: category,
              score_fiabilite: reliabilityScore,
              source_id: source.id,
              fetched_at: new Date(),
              statut: 'publie',
              published_at: new Date(),
              auto_publish: true,
              type_actu: 'info',
              territoire: 'FRANCE',
            };

            if (!dryRun) {
              if (existing) {
                // Update if content changed
                const contentHash = crypto.createHash('md5').update(summary).digest('hex');
                const existingHash = existing.raw_data_hash;

                if (contentHash !== existingHash) {
                  await prisma.actualite.update({
                    where: { id: existing.id },
                    data: {
                      ...data,
                      raw_data_hash: contentHash,
                      updatedAt: new Date(),
                    },
                  });
                  sourceStats.updated++;
                  stats.updated++;
                } else {
                  sourceStats.skipped++;
                  stats.skipped++;
                }
              } else {
                // Create new
                const contentHash = crypto.createHash('md5').update(summary).digest('hex');
                
                // Ensure unique slug
                let uniqueSlug = slug;
                let counter = 1;
                while (await prisma.actualite.findUnique({ where: { slug: uniqueSlug } })) {
                  uniqueSlug = `${slug}-${counter}`;
                  counter++;
                }

                await prisma.actualite.create({
                  data: {
                    ...data,
                    slug: uniqueSlug,
                    raw_data_hash: contentHash,
                  },
                });
                sourceStats.created++;
                stats.created++;
              }
            } else {
              // Dry run - just count
              if (existing) {
                sourceStats.skipped++;
                stats.skipped++;
              } else {
                sourceStats.created++;
                stats.created++;
              }
            }
          } catch (itemError) {
            const msg = `Item error: ${itemError.message}`;
            sourceStats.errors.push(msg);
            stats.errors.push(`[${source.name}] ${msg}`);
          }
        }

        // Update source last_run_at
        if (!dryRun) {
          await prisma.rssSource.update({
            where: { id: source.id },
            data: {
              last_run_at: new Date(),
              error_count: 0,
              last_error: null,
            },
          });
        }
      } catch (sourceError) {
        const msg = `Source error: ${sourceError.message}`;
        sourceStats.errors.push(msg);
        stats.errors.push(`[${source.name}] ${msg}`);

        // Update source error count
        if (!dryRun) {
          await prisma.rssSource.update({
            where: { id: source.id },
            data: {
              error_count: { increment: 1 },
              last_error: sourceError.message.substring(0, 255),
            },
          });
        }
      }

      stats.sourceResults.push(sourceStats);
    }

    stats.durationMs = Date.now() - startTime;

    // Log the run
    if (!dryRun) {
      await prisma.updateLog.create({
        data: {
          ran_at: new Date(),
          status: stats.errors.length > 0 ? 'PARTIAL' : 'SUCCESS',
          duration_ms: stats.durationMs,
          items_fetched_count: stats.fetched,
          items_created_count: stats.created,
          items_updated_count: stats.updated,
          items_skipped_count: stats.skipped,
          errors: stats.errors,
          source_name: 'RSS_INGEST',
          is_dry_run: false,
        },
      });
    }

    console.log(`[RSS_INGEST] Complete: ${stats.created} created, ${stats.updated} updated, ${stats.skipped} skipped`);

    return stats;
  } catch (error) {
    stats.errors.push(`Fatal error: ${error.message}`);
    stats.durationMs = Date.now() - startTime;
    throw error;
  }
}

export default async function handler(req, res) {
  if (!isCronAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
  const dryRun = req.query.dryRun === 'true';
  const sourceId = req.query.sourceId || null;

  try {
    const stats = await runRssIngest({ limit, dryRun, sourceId });
    return res.status(200).json(stats);
  } catch (error) {
    console.error('[RSS_INGEST] Handler error:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}
