import { Prisma } from '@prisma/client';
import { expandQueryWithSynonyms, normalizeSearchTerm } from './search-utils.js';

/**
 * Builds and executes a search query for Aides.
 */
export async function searchAides(prisma, params) {
  const {
    q,
    theme, sousTheme,
    public: audience,
    territoire: geo,
    organisme: provider,
    urgent,
    statut = 'publie',
    sort,
    page, pageSize,
    // Legacy mapping
    category, situation, providerType
  } = params;

  const LIMIT = pageSize;
  const OFFSET = (page - 1) * LIMIT;

  const conditions = [Prisma.sql`statut = ${statut}`];

  // 1. Full Text Search with Synonym Expansion
  if (q) {
    const expandedTerms = expandQueryWithSynonyms(q);

    // If we have expanded terms, create an OR condition for all variants
    if (expandedTerms.length > 1) {
      const searchConditions = expandedTerms.map(term =>
        Prisma.sql`"search_vector" @@ plainto_tsquery('french', unaccent(${term}))`
      );
      conditions.push(Prisma.sql`(${Prisma.join(searchConditions, ' OR ')})`);
    } else {
      // Single term or no expansion
      conditions.push(Prisma.sql`"search_vector" @@ plainto_tsquery('french', unaccent(${q}))`);
    }
  }

  // 2. Filters
  const effectiveTheme = theme || category;
  if (effectiveTheme) {
    // Match new 'theme' column OR legacy category relation
    conditions.push(Prisma.sql`("theme" = ${effectiveTheme} OR "categoryId" = ${effectiveTheme} OR EXISTS (SELECT 1 FROM "AidCategory" c WHERE c.id = "Aide"."categoryId" AND c.slug = ${effectiveTheme}))`);
  }

  if (sousTheme) {
    conditions.push(Prisma.sql`"sub_theme" = ${sousTheme}`);
  }

  const effectiveAudience = audience; // 'public' alias
  if (effectiveAudience) {
    conditions.push(Prisma.sql`${effectiveAudience} = ANY("audiences")`);
  }

  if (situation) {
    conditions.push(Prisma.sql`EXISTS (
      SELECT 1 FROM "_AideToLifeSituation" j
      JOIN "LifeSituation" s ON s.id = j."B"
      WHERE j."A" = "Aide".id AND s.slug = ${situation}
    )`);
  }

  const effectiveGeo = geo; // 'territoire' alias
  if (effectiveGeo) {
    conditions.push(Prisma.sql`${effectiveGeo} = ANY("territoires")`);
  }

  if (provider) {
     conditions.push(Prisma.sql`"providerName" = ${provider}`);
  }

  if (providerType) {
    conditions.push(Prisma.sql`"providerType" = ${providerType}`);
  }

  if (urgent === 'true') {
      conditions.push(Prisma.sql`"est_urgent" = true`);
  }

  const whereClause = conditions.length > 0
    ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
    : Prisma.empty;

  // 3. Sorting - Safe mapping with whitelist
  let orderBy;
  let selectRank = Prisma.empty;

  // Parse sort parameter (handle prefix "-" for DESC)
  const sortDirection = sort?.startsWith('-') ? 'DESC' : 'ASC';
  const sortField = sort?.startsWith('-') ? sort.substring(1) : sort;

  // Safe column mapping (whitelist only)
  const SAFE_SORT_COLUMNS = {
    'pertinence': 'rank',
    'date': 'published_at',
    'alpha': 'titre',
    'created_date': 'updatedAt',
    'published_at': 'published_at',
    'date_publication': 'published_at',
    'titre': 'titre'
  };

  if (q && (sort === 'pertinence' || sortField === 'pertinence')) {
    selectRank = Prisma.sql`, ts_rank_cd("search_vector", plainto_tsquery('french', unaccent(${q}))) as rank`;
    orderBy = Prisma.sql`ORDER BY rank DESC, published_at DESC`;
  } else if (sortField === 'pertinence') {
    // Relevance sorting requires q. Without q we fallback to date.
    orderBy = Prisma.sql`ORDER BY published_at DESC, id ASC`;
  } else if (sortField && SAFE_SORT_COLUMNS[sortField]) {
    const dbColumn = SAFE_SORT_COLUMNS[sortField];
    if (sortDirection === 'DESC') {
      orderBy = Prisma.sql`ORDER BY ${Prisma.raw(`"${dbColumn}"`)} DESC, id ASC`;
    } else {
      orderBy = Prisma.sql`ORDER BY ${Prisma.raw(`"${dbColumn}"`)} ASC, id ASC`;
    }
  } else {
    // Default fallback
    orderBy = Prisma.sql`ORDER BY published_at DESC, id ASC`;
  }

  // 4. Execution
  const itemsQuery = Prisma.sql`
    SELECT id ${selectRank}
    FROM "Aide"
    ${whereClause}
    ${orderBy}
    LIMIT ${LIMIT} OFFSET ${OFFSET}
  `;

  const countQuery = Prisma.sql`
    SELECT count(*) as total
    FROM "Aide"
    ${whereClause}
  `;

  // Facets Query (Aggregation)
  // We want counts for themes, organismes, territoires, publics
  // This can be heavy, so we might want to cache or simplify.
  // For now, let's do simple GROUP BYs on the filtered set (except the filter itself? No, standard is filtered set).
  // Actually, standard facet behavior is "drill down", so facets show counts within current results.

  // To avoid huge SQL complexity, we'll fetch basic stats.
  // Note: Aggregating arrays (audiences, territoires) requires UNNEST.

  const facetsQuery = Prisma.sql`
    SELECT
        (SELECT json_object_agg(t, c) FROM (SELECT "theme" as t, count(*) as c FROM "Aide" ${whereClause} AND "theme" IS NOT NULL GROUP BY "theme") t) as themes,
        (SELECT json_object_agg(p, c) FROM (SELECT "providerName" as p, count(*) as c FROM "Aide" ${whereClause} AND "providerName" IS NOT NULL GROUP BY "providerName") p) as organismes,
        (SELECT json_object_agg(a, c) FROM (SELECT unnest("audiences") as a, count(*) as c FROM "Aide" ${whereClause} GROUP BY a) a) as publics,
        (SELECT json_object_agg(ter, c) FROM (SELECT unnest("territoires") as ter, count(*) as c FROM "Aide" ${whereClause} GROUP BY ter) t) as territoires
  `;

  const [items, countResult, facetsResult] = await Promise.all([
    prisma.$queryRaw(itemsQuery),
    prisma.$queryRaw(countQuery),
    prisma.$queryRaw(facetsQuery)
  ]);

  // Enrich items
  const itemIds = items.map(i => i.id);
  let enrichedItems = [];
  if (itemIds.length > 0) {
    const fullItems = await prisma.aide.findMany({
      where: { id: { in: itemIds } },
      include: { category: true, situations: true }
    });

    const itemMap = new Map(fullItems.map(i => [i.id, i]));
    enrichedItems = items.map(raw => {
        const full = itemMap.get(raw.id);
        if (q) {
            return { ...full, rank: raw.rank };
        }
        return full;
    }).filter(Boolean);
  }

  const rawFacets = (facetsResult && facetsResult[0]) ? facetsResult[0] : {};

  return {
    items: enrichedItems,
    total: Number(countResult[0].total || 0),
    facets: {
        themes: rawFacets.themes || {},
        organismes: rawFacets.organismes || {},
        publics: rawFacets.publics || {},
        territoires: rawFacets.territoires || {}
    }
  };
}

/**
 * Builds and executes a search query for Demarches.
 */
export async function searchDemarches(prisma, params) {
  const { q, category, situation, geo, page, pageSize } = params;
  const LIMIT = pageSize;
  const OFFSET = (page - 1) * LIMIT;

  const conditions = [Prisma.sql`statut = 'publie'`];

  if (q) {
    conditions.push(Prisma.sql`"search_vector" @@ plainto_tsquery('french', unaccent(${q}))`);
  }

  if (category) {
    conditions.push(Prisma.sql`("categoryId" = ${category} OR EXISTS (SELECT 1 FROM "AidCategory" c WHERE c.id = "Demarche"."categoryId" AND c.slug = ${category}))`);
  }

  if (situation) {
     conditions.push(Prisma.sql`EXISTS (
      SELECT 1 FROM "_DemarcheToSituation" j
      JOIN "LifeSituation" s ON s.id = j."B"
      WHERE j."A" = "Demarche".id AND s.slug = ${situation}
    )`);
  }

  if (geo) {
    conditions.push(Prisma.sql`${geo} = ANY("departements")`);
  }

  const whereClause = conditions.length > 0
    ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
    : Prisma.empty;

  let orderBy;
  let selectRank = Prisma.empty;

  if (q) {
    selectRank = Prisma.sql`, ts_rank_cd("search_vector", plainto_tsquery('french', unaccent(${q}))) as rank`;
    orderBy = Prisma.sql`ORDER BY rank DESC, published_at DESC`;
  } else {
    orderBy = Prisma.sql`ORDER BY published_at DESC, id ASC`;
  }

  const itemsQuery = Prisma.sql`SELECT id ${selectRank} FROM "Demarche" ${whereClause} ${orderBy} LIMIT ${LIMIT} OFFSET ${OFFSET}`;
  const countQuery = Prisma.sql`SELECT count(*) as total FROM "Demarche" ${whereClause}`;

  const [items, countResult] = await Promise.all([
    prisma.$queryRaw(itemsQuery),
    prisma.$queryRaw(countQuery)
  ]);

  const itemIds = items.map(i => i.id);
  let enrichedItems = [];
  if (itemIds.length > 0) {
    const fullItems = await prisma.demarche.findMany({
      where: { id: { in: itemIds } },
      include: { category: true, situations: true }
    });
    const itemMap = new Map(fullItems.map(i => [i.id, i]));
    enrichedItems = items.map(raw => {
        const full = itemMap.get(raw.id);
        if (q) return { ...full, rank: raw.rank };
        return full;
    }).filter(Boolean);
  }

  return {
    items: enrichedItems,
    total: Number(countResult[0].total || 0)
  };
}

/**
 * Builds and executes a search query for Structures.
 */
export async function searchStructures(prisma, params) {
  const { q, city, zip, type, page, pageSize } = params;
  const LIMIT = pageSize;
  const OFFSET = (page - 1) * LIMIT;

  const conditions = [Prisma.sql`statut = 'actif'`];

  if (q) {
    conditions.push(Prisma.sql`"search_vector" @@ plainto_tsquery('french', unaccent(${q}))`);
  }

  if (city) {
    // ILIKE for city
    conditions.push(Prisma.sql`"ville" ILIKE ${'%' + city + '%'}`);
  }

  if (zip) {
    conditions.push(Prisma.sql`"code_postal" = ${zip}`);
  }

  if (type && type !== '_all') {
    conditions.push(Prisma.sql`"type_structure" = ${type}`);
  }

  const whereClause = conditions.length > 0
    ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
    : Prisma.empty;

  let orderBy;
  let selectRank = Prisma.empty;

  if (q) {
    selectRank = Prisma.sql`, ts_rank_cd("search_vector", plainto_tsquery('french', unaccent(${q}))) as rank`;
    orderBy = Prisma.sql`ORDER BY rank DESC, nom ASC`;
  } else {
    orderBy = Prisma.sql`ORDER BY nom ASC, id ASC`;
  }

  const itemsQuery = Prisma.sql`SELECT id ${selectRank} FROM "Structure" ${whereClause} ${orderBy} LIMIT ${LIMIT} OFFSET ${OFFSET}`;
  const countQuery = Prisma.sql`SELECT count(*) as total FROM "Structure" ${whereClause}`;

  const [items, countResult] = await Promise.all([
    prisma.$queryRaw(itemsQuery),
    prisma.$queryRaw(countQuery)
  ]);

  // Structures usually don't need heavy relation fetching, but let's check current implementation.
  // It included `proServices: true`.
  const itemIds = items.map(i => i.id);
  let enrichedItems = [];
  if (itemIds.length > 0) {
    const fullItems = await prisma.structure.findMany({
      where: { id: { in: itemIds } },
      include: { proServices: true }
    });
    const itemMap = new Map(fullItems.map(i => [i.id, i]));
    enrichedItems = items.map(raw => {
        const full = itemMap.get(raw.id);
        if (q) return { ...full, rank: raw.rank };
        return full;
    }).filter(Boolean);
  }

  return {
    items: enrichedItems,
    total: Number(countResult[0].total || 0)
  };
}
