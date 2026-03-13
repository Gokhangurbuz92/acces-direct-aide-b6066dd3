import { sql } from 'drizzle-orm';
import { db } from '../../src/db/index.js';

const RRF_K = 60;
const LEXICAL_CANDIDATE_MULTIPLIER = 5;
const SEMANTIC_CANDIDATE_MULTIPLIER = 5;
const CAPABILITY_CACHE_TTL_MS = 5 * 60 * 1000;

let capabilityCache = {
  checkedAt: 0,
  hasEmbeddingColumn: false,
  hasVectorExtension: false,
  hasTsContentColumn: false,
  hasSearchVectorColumn: false,
  hasUnaccentExtension: false,
};

function toVectorLiteral(values) {
  return `[${values.map((value) => Number(value).toFixed(8)).join(',')}]`;
}

async function getSearchCapabilities() {
  const now = Date.now();
  if (now - capabilityCache.checkedAt < CAPABILITY_CACHE_TTL_MS) {
    return capabilityCache;
  }

  try {
    const rows = await db.execute(sql`
      SELECT
        EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'Aide'
            AND column_name = 'embedding'
        ) AS has_embedding_column,
        EXISTS (
          SELECT 1
          FROM pg_extension
          WHERE extname = 'vector'
        ) AS has_vector_extension,
        EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'Aide'
            AND column_name = 'ts_content'
        ) AS has_ts_content_column,
        EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'Aide'
            AND column_name = 'search_vector'
        ) AS has_search_vector_column,
        EXISTS (
          SELECT 1
          FROM pg_extension
          WHERE extname = 'unaccent'
        ) AS has_unaccent_extension
    `);

    const actualRows = rows.rows || rows;
    const row = actualRows?.[0] || {};
    capabilityCache = {
      checkedAt: now,
      hasEmbeddingColumn: Boolean(row.has_embedding_column),
      hasVectorExtension: Boolean(row.has_vector_extension),
      hasTsContentColumn: Boolean(row.has_ts_content_column),
      hasSearchVectorColumn: Boolean(row.has_search_vector_column),
      hasUnaccentExtension: Boolean(row.has_unaccent_extension),
    };
  } catch {
    capabilityCache = {
      checkedAt: now,
      hasEmbeddingColumn: false,
      hasVectorExtension: false,
      hasTsContentColumn: false,
      hasSearchVectorColumn: false,
      hasUnaccentExtension: false,
    };
  }

  return capabilityCache;
}

function buildAideFilters({ category, situations, geoScope }) {
  const filters = [
    sql`
      (
        a."status_code" = 'PUBLISHED'::"AidStatus"
        OR (a."status_code" = 'DRAFT'::"AidStatus" AND a."statut" = 'publie')
      )
    `,
  ];

  if (category) {
    const categorySlug = String(category).toLowerCase();
    filters.push(sql`
      (
        a."category_code" = CAST(${category} AS "AidCategoryCode")
        OR a."theme" = ${categorySlug}
        OR a."categorie" = ${categorySlug}
        OR EXISTS (
          SELECT 1
          FROM "AidCategory" category
          WHERE category.id = a."categoryId"
            AND category.slug = ${categorySlug}
        )
      )
    `);
  }

  if (geoScope) {
    filters.push(sql`a."geo_scope" = ${geoScope}`);
  }

  if (situations && situations.length > 0) {
    filters.push(sql`
      (
        EXISTS (
          SELECT 1
          FROM "AidSituation" relation
          JOIN "Situation" situation ON situation.id = relation."situationId"
          WHERE relation."aidId" = a.id
            AND situation.code IN (${sql.join(situations)})
        )
        OR EXISTS (
          SELECT 1
          FROM "_AideToLifeSituation" relation
          JOIN "LifeSituation" situation ON situation.id = relation."B"
          WHERE relation."A" = a.id
            AND situation.slug IN (${Prisma.join(situations)})
        )
      )
    `);
  }

  return sql`${Prisma.join(filters, sql.raw(' AND '))}`;
}

function normalizeRows(rows) {
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    category: row.category,
    status: row.status,
    citations: row.citations || [],
    score: Number(row.rrf_score || 0),
    lexicalScore: row.lexical_score === null ? null : Number(row.lexical_score),
    semanticScore: row.semantic_score === null ? null : Number(row.semantic_score),
  }));
}

export async function searchAidesHybrid(params) {
  const { query, category, situations = [], geoScope, limit = 10, embedding = null } = params;
  const lexicalLimit = Math.max(limit * LEXICAL_CANDIDATE_MULTIPLIER, limit);
  const semanticLimit = Math.max(limit * SEMANTIC_CANDIDATE_MULTIPLIER, limit);
  const filters = buildAideFilters({ category, situations, geoScope });
  const vectorLiteral = Array.isArray(embedding) && embedding.length > 0 ? toVectorLiteral(embedding) : null;

  const capabilities = await getSearchCapabilities();
  const semanticReady = vectorLiteral
    ? capabilities.hasEmbeddingColumn && capabilities.hasVectorExtension
    : false;

  const tsQuery = capabilities.hasUnaccentExtension
    ? sql`websearch_to_tsquery('french', unaccent(${query}))`
    : sql`websearch_to_tsquery('french', ${query})`;

  const canUseTsContent = capabilities.hasTsContentColumn;
  const canUseSearchVector = capabilities.hasSearchVectorColumn;

  const lexicalVector = canUseTsContent && canUseSearchVector
    ? sql`(COALESCE(a."ts_content", to_tsvector('french', '')) || COALESCE(a."search_vector", to_tsvector('french', '')))`
    : canUseTsContent
      ? sql`COALESCE(a."ts_content", to_tsvector('french', ''))`
      : canUseSearchVector
        ? sql`COALESCE(a."search_vector", to_tsvector('french', ''))`
        : null;

  const lexicalCte = lexicalVector
    ? sql`
      lexical AS (
        SELECT
          a.id,
          ts_rank_cd(${lexicalVector}, ${tsQuery}) AS lexical_score,
          ROW_NUMBER() OVER (
            ORDER BY ts_rank_cd(${lexicalVector}, ${tsQuery}) DESC, a.id ASC
          ) AS lexical_rank
        FROM "Aide" a
        WHERE ${filters}
          AND ${lexicalVector} @@ ${tsQuery}
        LIMIT ${lexicalLimit}
      )
    `
    : sql`
      lexical AS (
        SELECT
          a.id,
          1.0 AS lexical_score,
          ROW_NUMBER() OVER (ORDER BY a.id ASC) AS lexical_rank
        FROM "Aide" a
        WHERE ${filters}
          AND (
            COALESCE(a."title", a.titre) ILIKE ${`%${query}%`}
            OR COALESCE(a."description", a.cest_quoi, a.summary_falc) ILIKE ${`%${query}%`}
          )
        LIMIT ${lexicalLimit}
      )
    `;

  const semanticCte = semanticReady
    ? sql`
      semantic AS (
        SELECT
          a.id,
          1 - (a."embedding" <=> CAST(${vectorLiteral} AS vector)) AS semantic_score,
          ROW_NUMBER() OVER (ORDER BY a."embedding" <=> CAST(${vectorLiteral} AS vector) ASC, a.id ASC) AS semantic_rank
        FROM "Aide" a
        WHERE ${filters}
          AND a."embedding" IS NOT NULL
        LIMIT ${semanticLimit}
      )
    `
    : sql`
      semantic AS (
        SELECT
          NULL::text AS id,
          NULL::double precision AS semantic_score,
          NULL::bigint AS semantic_rank
        WHERE FALSE
      )
    `;

  const fusionSql = sql`
    WITH
      ${lexicalCte},
      ${semanticCte},
      fused AS (
        SELECT
          COALESCE(lexical.id, semantic.id) AS id,
          lexical.lexical_score,
          semantic.semantic_score,
          (
            CASE WHEN lexical.lexical_rank IS NULL THEN 0 ELSE 1.0 / (${RRF_K} + lexical.lexical_rank) END +
            CASE WHEN semantic.semantic_rank IS NULL THEN 0 ELSE 1.0 / (${RRF_K} + semantic.semantic_rank) END
          ) AS rrf_score
        FROM lexical
        FULL OUTER JOIN semantic ON lexical.id = semantic.id
      )
    SELECT
      aide.id,
      aide.slug,
      COALESCE(aide."title", aide.titre) AS title,
      COALESCE(aide."description", aide.cest_quoi) AS description,
      aide."category_code"::text AS category,
      aide."status_code"::text AS status,
      aide.citations,
      fused.lexical_score,
      fused.semantic_score,
      fused.rrf_score
    FROM fused
    JOIN "Aide" aide ON aide.id = fused.id
    ORDER BY fused.rrf_score DESC, fused.lexical_score DESC NULLS LAST, fused.semantic_score DESC NULLS LAST
    LIMIT ${limit}
  `;

  const result = await db.execute(fusionSql);
  const rows = result.rows || result;
  const items = normalizeRows(rows);

  const topResult = items[0];
  const weakResult = topResult
    ? topResult.score < 0.01 && (topResult.lexicalScore ?? 0) < 0.01 && (topResult.semanticScore ?? 0) < 0.2
    : true;

  return {
    items,
    total: items.length,
    weakResult,
  };
}
