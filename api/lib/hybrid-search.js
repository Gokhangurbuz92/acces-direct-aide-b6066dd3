import { Prisma } from '@prisma/client';

const RRF_K = 60;
const LEXICAL_CANDIDATE_MULTIPLIER = 5;
const SEMANTIC_CANDIDATE_MULTIPLIER = 5;
const CAPABILITY_CACHE_TTL_MS = 5 * 60 * 1000;

let capabilityCache = {
  checkedAt: 0,
  semanticReady: false,
};

function toVectorLiteral(values) {
  return `[${values.map((value) => Number(value).toFixed(8)).join(',')}]`;
}

function buildAideFilters({ category, situations, geoScope }) {
  const filters = [Prisma.sql`a."status_code" = 'PUBLISHED'::"AidStatus"`];

  if (category) {
    filters.push(Prisma.sql`a."category_code" = CAST(${category} AS "AidCategoryCode")`);
  }

  if (geoScope) {
    filters.push(Prisma.sql`a."geo_scope" = ${geoScope}`);
  }

  if (situations && situations.length > 0) {
    filters.push(Prisma.sql`
      EXISTS (
        SELECT 1
        FROM "AidSituation" relation
        JOIN "Situation" situation ON situation.id = relation."situationId"
        WHERE relation."aidId" = a.id
          AND situation.code IN (${Prisma.join(situations)})
      )
    `);
  }

  return Prisma.sql`${Prisma.join(filters, ' AND ')}`;
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

async function canRunSemanticSearch(prisma) {
  const now = Date.now();
  if (now - capabilityCache.checkedAt < CAPABILITY_CACHE_TTL_MS) {
    return capabilityCache.semanticReady;
  }

  try {
    const rows = await prisma.$queryRaw`
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
        ) AS has_vector_extension
    `;

    const row = rows?.[0] || {};
    capabilityCache = {
      checkedAt: now,
      semanticReady: Boolean(row.has_embedding_column && row.has_vector_extension),
    };
  } catch {
    capabilityCache = {
      checkedAt: now,
      semanticReady: false,
    };
  }

  return capabilityCache.semanticReady;
}

export async function searchAidesHybrid(prisma, params) {
  const { query, category, situations = [], geoScope, limit = 10, embedding = null } = params;
  const lexicalLimit = Math.max(limit * LEXICAL_CANDIDATE_MULTIPLIER, limit);
  const semanticLimit = Math.max(limit * SEMANTIC_CANDIDATE_MULTIPLIER, limit);
  const filters = buildAideFilters({ category, situations, geoScope });
  const vectorLiteral = Array.isArray(embedding) && embedding.length > 0 ? toVectorLiteral(embedding) : null;

  const lexicalCte = Prisma.sql`
    lexical AS (
      SELECT
        a.id,
        ts_rank_cd(a."ts_content", websearch_to_tsquery('french', unaccent(${query}))) AS lexical_score,
        ROW_NUMBER() OVER (
          ORDER BY ts_rank_cd(a."ts_content", websearch_to_tsquery('french', unaccent(${query}))) DESC, a.id ASC
        ) AS lexical_rank
      FROM "Aide" a
      WHERE ${filters}
        AND a."ts_content" @@ websearch_to_tsquery('french', unaccent(${query}))
      LIMIT ${lexicalLimit}
    )
  `;

  const semanticReady = vectorLiteral ? await canRunSemanticSearch(prisma) : false;

  const semanticCte = semanticReady
    ? Prisma.sql`
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
    : Prisma.sql`
      semantic AS (
        SELECT
          NULL::text AS id,
          NULL::double precision AS semantic_score,
          NULL::bigint AS semantic_rank
        WHERE FALSE
      )
    `;

  const fusionSql = Prisma.sql`
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

  const rows = await prisma.$queryRaw(fusionSql);
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
