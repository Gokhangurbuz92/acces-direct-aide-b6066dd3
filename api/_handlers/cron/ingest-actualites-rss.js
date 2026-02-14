import prisma from '../../_utils/prisma.js';
import Parser from 'rss-parser';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const DEFAULT_TIMEOUT_MS = 12_000;
const DEFAULT_MAX_ITEMS_PER_SOURCE = 20;
const USER_AGENT = 'AccesDirectAideBot/1.0 (+https://www.accesdirectaide.fr)';

/**
 * @typedef {object} NewsSourceManifestItem
 * @property {string=} id
 * @property {string=} name
 * @property {string=} feedUrl
 * @property {string=} url
 * @property {string=} homepageUrl
 * @property {string=} domain
 * @property {string=} trustLevel
 * @property {string=} trust_level
 * @property {string=} category
 * @property {boolean=} enabled
 * @property {string=} language
 * @property {string=} territory
 */

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function safeString(value) {
  if (value == null) return null;
  const s = String(value).trim();
  return s ? s : null;
}

/**
 * @param {unknown} error
 * @returns {string}
 */
function getErrorMessage(error) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return 'unknown error';
  }
}

/**
 * @param {string} input
 * @returns {string}
 */
function sha256(input) {
  return crypto.createHash('sha256').update(String(input)).digest('hex');
}

/**
 * @param {string | null} raw
 * @returns {string | null}
 */
function guessDomain(raw) {
  if (!raw) return null;
  try {
    return new URL(raw).hostname || null;
  } catch {
    return null;
  }
}

/**
 * @param {string | null} text
 * @returns {string}
 */
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

/**
 * @param {unknown} value
 * @returns {Date}
 */
function parsePublishedAt(value) {
  const raw = safeString(value);
  if (!raw) return new Date();
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return new Date();
  return d;
}

/**
 * @param {string} url
 * @param {{ timeoutMs?: number, headers?: Record<string,string> }} options
 */
async function fetchText(url, options = {}) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      headers: {
        'user-agent': USER_AGENT,
        'accept': 'application/rss+xml, application/atom+xml, text/xml;q=0.9, */*;q=0.8',
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} ${body ? `- ${body.substring(0, 120)}` : ''}`.trim());
    }

    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Load sources manifest from the repo, preferring `data/news-sources.json`.
 * Falls back to legacy `config/rss-sources.json`.
 *
 * @returns {{ sources: NewsSourceManifestItem[], categoryByFeedUrl: Map<string, string>, territoryByFeedUrl: Map<string, string> }}
 */
function loadSourcesManifest() {
  const candidates = [
    path.join(process.cwd(), 'data', 'news-sources.json'),
    path.join(process.cwd(), 'config', 'rss-sources.json'),
  ];

  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) continue;
    try {
      const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const list = Array.isArray(raw) ? raw : [];
      const categoryByFeedUrl = new Map();
      const territoryByFeedUrl = new Map();

      for (const item of list) {
        const feedUrl = safeString(item?.feedUrl) || safeString(item?.url);
        if (!feedUrl) continue;
        const category = safeString(item?.category);
        const territory = safeString(item?.territory);
        if (category) categoryByFeedUrl.set(feedUrl, category);
        if (territory) territoryByFeedUrl.set(feedUrl, territory);
      }

      return { sources: list, categoryByFeedUrl, territoryByFeedUrl };
    } catch {
      // ignore malformed manifest
    }
  }

  return { sources: [], categoryByFeedUrl: new Map(), territoryByFeedUrl: new Map() };
}

/**
 * Pure ingestion logic for RSS/Atom Actualites.
 *
 * IMPORTANT: This function is used by the cron pipeline and by the local script.
 * It must not log secrets and must avoid throwing on single-item errors.
 *
 * @param {{ limit?: number, runId?: string }} params
 * @returns {Promise<{ fetched: number, processed: number, created: number, updated: number, skippedExisting: number, errors: string[], durationByStage: { fetchMs: number, processingMs: number } }>}
 */
export async function runIngestActualitesRss({ limit, runId } = {}) {
  /** @type {{ fetched: number, processed: number, created: number, updated: number, skippedExisting: number, errors: string[], durationByStage: { fetchMs: number, processingMs: number } }} */
  const stats = {
    fetched: 0,
    processed: 0,
    created: 0,
    updated: 0,
    skippedExisting: 0,
    errors: [],
    durationByStage: {
      fetchMs: 0,
      processingMs: 0,
    },
  };

  const effectiveRunId = runId || crypto.randomUUID();

  const { sources: manifestSources, categoryByFeedUrl, territoryByFeedUrl } = loadSourcesManifest();

  // Seed/refresh sources in DB so admin can manage them.
  for (const src of manifestSources) {
    const feedUrl = safeString(src?.feedUrl) || safeString(src?.url);
    if (!feedUrl) continue;

    const name = safeString(src?.name) || guessDomain(feedUrl) || 'RSS source';
    const domain = safeString(src?.domain) || guessDomain(feedUrl) || 'unknown';
    const trustLevel = safeString(src?.trustLevel) || safeString(src?.trust_level) || 'OFFICIAL';
    const enabled = typeof src?.enabled === 'boolean' ? src.enabled : true;

    try {
      await prisma.rssSource.upsert({
        where: { feed_url: feedUrl },
        update: { name, domain, trust_level: trustLevel, enabled },
        create: { name, feed_url: feedUrl, domain, trust_level: trustLevel, enabled },
      });
    } catch (e) {
      stats.errors.push(`${name}: seed failed - ${getErrorMessage(e)}`);
    }
  }

  let dbSources = [];
  try {
    dbSources = await prisma.rssSource.findMany({ where: { enabled: true } });
  } catch (e) {
    stats.errors.push(`rssSource.findMany failed - ${getErrorMessage(e)}`);
    return stats;
  }

  const parser = new Parser();
  let processedCount = 0;

  for (const source of dbSources) {
    if (limit && processedCount >= limit) break;

    const feedUrl = safeString(source?.feed_url);
    if (!feedUrl) continue;

    const isOfficial = String(source?.trust_level || '').toUpperCase() === 'OFFICIAL';
    const category = categoryByFeedUrl.get(feedUrl) || null;
    const territory = territoryByFeedUrl.get(feedUrl) || null;

    let feedItems = [];

    try {
      const startFetch = Date.now();
      const xml = await fetchText(feedUrl);
      const feed = await parser.parseString(xml);
      stats.durationByStage.fetchMs += (Date.now() - startFetch);

      const items = Array.isArray(feed?.items) ? feed.items : [];
      const remaining = limit ? Math.max(0, limit - processedCount) : DEFAULT_MAX_ITEMS_PER_SOURCE;
      const perSourceLimit = Math.min(DEFAULT_MAX_ITEMS_PER_SOURCE, remaining);
      feedItems = perSourceLimit ? items.slice(0, perSourceLimit) : [];

      stats.fetched += feedItems.length;
    } catch (e) {
      stats.errors.push(`${source.name}: fetch/parse failed - ${getErrorMessage(e)}`);
      continue;
    }

    const startProc = Date.now();
    for (const item of feedItems) {
      stats.processed += 1;

      const title = safeString(item?.title) || 'Sans titre';
      const canonicalUrl = safeString(item?.link) || safeString(item?.guid);
      if (!canonicalUrl) {
        stats.errors.push(`${source.name}: missing item link/guid (skipped)`);
        continue;
      }

      const publishedAt = parsePublishedAt(item?.isoDate || item?.pubDate);
      const now = new Date();

      const snippet =
        safeString(item?.contentSnippet) ||
        safeString(item?.summary) ||
        safeString(item?.content) ||
        null;
      const resume = snippet ? snippet.substring(0, 600) : null;
      const contenu = safeString(item?.content) || resume || null;

      const hash = sha256(canonicalUrl);
      const baseSlug = slugify(title) || 'actu';
      const computedSlug = `${baseSlug.substring(0, 80)}-${hash.substring(0, 6)}`;

      let existing = null;
      try {
        existing = await prisma.actualite.findFirst({
          where: { canonical_url: canonicalUrl },
          select: { id: true, slug: true, statut: true, published_at: true },
        });
      } catch (e) {
        stats.errors.push(`${source.name}: findFirst failed - ${getErrorMessage(e)}`);
        continue;
      }

      const shouldPublish = isOfficial;
      const updatePublication = shouldPublish
        ? {
            statut: 'publie',
            auto_publish: true,
            published_at: publishedAt,
          }
        : {};

      try {
        await prisma.actualite.upsert({
          where: { canonical_url: canonicalUrl },
          update: {
            titre: title,
            slug: existing?.slug || computedSlug,
            contenu,
            resume,
            canonical_url: canonicalUrl,
            lien_url: canonicalUrl,
            url: canonicalUrl,
            source_url: canonicalUrl,
            guid: safeString(item?.guid) || canonicalUrl,
            source_id: source.id,
            source_name: source.name,
            source_nom: source.name,
            fetched_at: now,
            date_publication: publishedAt,
            raw_data_hash: hash,
            dedupe_hash: hash,
            ingest_batch: effectiveRunId,
            categorie: category || undefined,
            territoire: territory || undefined,
            type_actu: 'info',
            quality_score: shouldPublish ? 60 : 40,
            score_fiabilite: shouldPublish ? 95 : 40,
            ...updatePublication,
          },
          create: {
            titre: title,
            slug: computedSlug,
            contenu,
            resume,
            canonical_url: canonicalUrl,
            lien_url: canonicalUrl,
            url: canonicalUrl,
            source_url: canonicalUrl,
            guid: safeString(item?.guid) || canonicalUrl,
            source_id: source.id,
            source_name: source.name,
            source_nom: source.name,
            fetched_at: now,
            date_publication: publishedAt,
            raw_data_hash: hash,
            dedupe_hash: hash,
            ingest_batch: effectiveRunId,
            categorie: category || undefined,
            territoire: territory || undefined,
            type_actu: 'info',
            statut: shouldPublish ? 'publie' : 'brouillon',
            auto_publish: shouldPublish,
            published_at: shouldPublish ? publishedAt : null,
            falc_status: 'pending',
            quality_score: shouldPublish ? 60 : 40,
            score_fiabilite: shouldPublish ? 95 : 40,
            tags: [],
          },
        });

        if (existing) {
          stats.updated += 1;
        } else {
          stats.created += 1;
        }

        processedCount += 1;
      } catch (e) {
        stats.errors.push(`${source.name}: upsert failed - ${getErrorMessage(e)}`);
      }
    }
    stats.durationByStage.processingMs += (Date.now() - startProc);
  }

  return stats;
}
