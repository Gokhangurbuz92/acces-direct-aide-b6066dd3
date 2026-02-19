import { Prisma } from '@prisma/client';
import { expandQueryWithSynonyms, normalizeSearchTerm } from './search-utils.js';
import { buildProvenance } from '../_utils/provenance.js';

/**
 * Builds and executes a search query for Aides.
 */
/**
 * @param {any} prisma
 * @param {any} params
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
    // Support both new AidSituation/Situation mapping and legacy LifeSituation mapping.
    conditions.push(Prisma.sql`(
      EXISTS (
        SELECT 1
        FROM "AidSituation" relation
        JOIN "Situation" situation ON situation.id = relation."situationId"
        WHERE relation."aidId" = "Aide".id
          AND situation.code = ${situation}
      )
      OR EXISTS (
        SELECT 1
        FROM "_AideToLifeSituation" relation
        JOIN "LifeSituation" situation ON situation.id = relation."B"
        WHERE relation."A" = "Aide".id
          AND situation.slug = ${situation}
      )
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

  // P2: external sort aliases (stable contract) -> internal implementation
  /** @type {Record<string, string>} */
  const sortAliases = {
    relevance: 'pertinence',
    recent: '-published_at',
    '-recent': 'published_at',
    quality: '-quality_score',
    '-quality': 'quality_score',
  };

  const effectiveSort = sortAliases[sort] || sort;

  // Parse sort parameter (handle prefix "-" for DESC)
  const sortDirection = effectiveSort?.startsWith('-') ? 'DESC' : 'ASC';
  const sortField = effectiveSort?.startsWith('-') ? effectiveSort.substring(1) : effectiveSort;

  // Safe column mapping (whitelist only)
  /** @type {Record<string, string>} */
  const SAFE_SORT_COLUMNS = {
    'date': 'published_at',
    'alpha': 'titre',
    'created_date': 'updatedAt',
    'updated_date': 'updatedAt',
    'published_at': 'published_at',
    'date_publication': 'published_at',
    'titre': 'titre',
    'quality_score': 'quality_score',
  };

  if (q && (effectiveSort === 'pertinence' || sortField === 'pertinence')) {
    selectRank = Prisma.sql`, ts_rank_cd("search_vector", plainto_tsquery('french', unaccent(${q}))) as rank`;
    orderBy = Prisma.sql`ORDER BY rank DESC, published_at DESC`;
  } else if (sortField === 'pertinence') {
    // Relevance sorting requires q. Without q we fallback to date.
    orderBy = Prisma.sql`ORDER BY published_at DESC, id ASC`;
  } else if (sortField && SAFE_SORT_COLUMNS[sortField]) {
    const dbColumn = SAFE_SORT_COLUMNS[sortField];
    const safeColumn = Prisma.raw(`"${dbColumn}"`);

    // P2: quality sort should remain stable and useful, even when many scores are equal.
    if (dbColumn === 'quality_score') {
      orderBy = sortDirection === 'DESC'
        ? Prisma.sql`ORDER BY ${safeColumn} DESC, published_at DESC, id ASC`
        : Prisma.sql`ORDER BY ${safeColumn} ASC, published_at DESC, id ASC`;
    } else {
      orderBy = sortDirection === 'DESC'
        ? Prisma.sql`ORDER BY ${safeColumn} DESC, id ASC`
        : Prisma.sql`ORDER BY ${safeColumn} ASC, id ASC`;
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
  const itemIds = items.map((/** @type {{ id: string }} */ i) => i.id);
  let enrichedItems = [];
  if (itemIds.length > 0) {
    // Keep the listing payload lightweight; detail endpoints fetch full objects separately.
    const listSelect = {
      id: true,
      slug: true,
      titre: true,
      categorie: true,
      theme: true,
      sub_theme: true,
      cest_quoi: true,
      summary_falc: true,
      est_urgent: true,
      territoires: true,
      date_verification: true,
      quality_score: true,
      published_at: true,
      updatedAt: true,
      providerName: true,
      source_name: true,
      source_org: true,
      source_url: true,
      fetched_at: true,
      sourceDocument: {
        select: {
          fetched_at: true,
          source_url: true,
        },
      },
    };

    const fullItems = await prisma.aide.findMany({
      where: { id: { in: itemIds } },
      select: listSelect,
    });

    const itemMap = new Map(fullItems.map((/** @type {{ id: string }} */ i) => [i.id, i]));
    enrichedItems = items.map((/** @type {{ id: string, rank?: number }} */ raw) => {
      const full = itemMap.get(raw.id);
      if (!full) return null;
      const { sourceDocument, ...safeFull } = full;
      const baseItem = {
        ...safeFull,
        provenance: buildProvenance({
          verifiedAt: safeFull.date_verification,
          fetchedAt: sourceDocument?.fetched_at || safeFull.fetched_at,
          sourceUrl: sourceDocument?.source_url || safeFull.source_url,
        }),
      };
      if (q) {
        return { ...baseItem, rank: raw.rank };
      }
      return baseItem;
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
/**
 * @param {any} prisma
 * @param {any} params
 */
export async function searchDemarches(prisma, params) {
  const {
    q,
    category,
    theme,
    situation,
    geo,
    territoire,
    territory,
    audience,
    online,
    statut = 'publie',
    sort,
    page,
    pageSize,
    hideTestContent = false,
  } = params;

  const effectiveCategory = theme || category;
  const effectiveGeo = geo || territoire || territory;
  const LIMIT = pageSize;
  const OFFSET = (page - 1) * LIMIT;

  const conditions = [Prisma.sql`statut = ${statut}`];

  if (q) {
    conditions.push(Prisma.sql`"search_vector" @@ plainto_tsquery('french', unaccent(${q}))`);
  }

  if (effectiveCategory) {
    conditions.push(Prisma.sql`("categoryId" = ${effectiveCategory} OR EXISTS (SELECT 1 FROM "AidCategory" c WHERE c.id = "Demarche"."categoryId" AND c.slug = ${effectiveCategory}))`);
  }

  if (situation) {
     conditions.push(Prisma.sql`EXISTS (
      SELECT 1 FROM "_DemarcheToSituation" j
      JOIN "LifeSituation" s ON s.id = j."B"
      WHERE j."A" = "Demarche".id AND s.slug = ${situation}
    )`);
  }

  if (effectiveGeo) {
    conditions.push(Prisma.sql`${effectiveGeo} = ANY("departements")`);
  }

  if (audience) {
    conditions.push(Prisma.sql`${audience} = ANY("audiences")`);
  }

  if (online === 'true' || online === '1') {
    conditions.push(Prisma.sql`("lien_officiel" IS NOT NULL AND "lien_officiel" <> '')`);
  }

  if (hideTestContent) {
    conditions.push(Prisma.sql`NOT ("titre" ILIKE 'Test%' OR "titre" ILIKE 'Démarche Test%' OR "titre" ILIKE 'Demarche Test%')`);
  }

  const whereClause = conditions.length > 0
    ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
    : Prisma.empty;

  let orderBy;
  let selectRank = Prisma.empty;

  /** @type {Record<string, string>} */
  const sortAliases = {
    relevance: 'pertinence',
    recent: '-published_at',
    '-recent': 'published_at',
    quality: '-quality_score',
    '-quality': 'quality_score',
  };

  const effectiveSort = sortAliases[sort] || sort;
  const sortDirection = effectiveSort?.startsWith('-') ? 'DESC' : 'ASC';
  const sortField = effectiveSort?.startsWith('-') ? effectiveSort.substring(1) : effectiveSort;

  /** @type {Record<string, string>} */
  const SAFE_SORT_COLUMNS = {
    'date': 'published_at',
    'alpha': 'titre',
    'created_date': 'updatedAt',
    'updated_date': 'updatedAt',
    'published_at': 'published_at',
    'date_publication': 'published_at',
    'titre': 'titre',
    'quality_score': 'quality_score',
  };

  if (q && (effectiveSort === 'pertinence' || sortField === 'pertinence')) {
    selectRank = Prisma.sql`, ts_rank_cd("search_vector", plainto_tsquery('french', unaccent(${q}))) as rank`;
    orderBy = Prisma.sql`ORDER BY rank DESC, published_at DESC, id ASC`;
  } else if (sortField === 'pertinence') {
    // Relevance sorting requires q. Without q we fallback to date.
    orderBy = Prisma.sql`ORDER BY published_at DESC, id ASC`;
  } else if (sortField && SAFE_SORT_COLUMNS[sortField]) {
    const dbColumn = SAFE_SORT_COLUMNS[sortField];
    const safeColumn = Prisma.raw(`"${dbColumn}"`);

    if (dbColumn === 'quality_score') {
      orderBy = sortDirection === 'DESC'
        ? Prisma.sql`ORDER BY ${safeColumn} DESC, published_at DESC, id ASC`
        : Prisma.sql`ORDER BY ${safeColumn} ASC, published_at DESC, id ASC`;
    } else {
      orderBy = sortDirection === 'DESC'
        ? Prisma.sql`ORDER BY ${safeColumn} DESC, id ASC`
        : Prisma.sql`ORDER BY ${safeColumn} ASC, id ASC`;
    }
  } else if (q) {
    selectRank = Prisma.sql`, ts_rank_cd("search_vector", plainto_tsquery('french', unaccent(${q}))) as rank`;
    orderBy = Prisma.sql`ORDER BY rank DESC, published_at DESC, id ASC`;
  } else {
    // Default without q: quality first, then recent.
    orderBy = Prisma.sql`ORDER BY "quality_score" DESC, published_at DESC, id ASC`;
  }

  const itemsQuery = Prisma.sql`SELECT id ${selectRank} FROM "Demarche" ${whereClause} ${orderBy} LIMIT ${LIMIT} OFFSET ${OFFSET}`;
  const countQuery = Prisma.sql`SELECT count(*) as total FROM "Demarche" ${whereClause}`;

  const [items, countResult] = await Promise.all([
    prisma.$queryRaw(itemsQuery),
    prisma.$queryRaw(countQuery)
  ]);

  const itemIds = items.map((/** @type {{ id: string }} */ i) => i.id);
  let enrichedItems = [];
  if (itemIds.length > 0) {
    // Keep the listing payload lightweight; detail endpoints fetch full objects separately.
    const listSelect = {
      id: true,
      slug: true,
      titre: true,
      categorie: true,
      description_courte: true,
      summary_falc: true,
      delai: true,
      lien_officiel: true,
      source_url: true,
      source_url_exact: true,
      date_verification: true,
      quality_score: true,
      published_at: true,
      updatedAt: true,
      sourceDocument: {
        select: {
          fetched_at: true,
          source_url: true,
        },
      },
      category: {
        select: {
          id: true,
          slug: true,
          label: true,
        },
      },
    };

    const fullItems = await prisma.demarche.findMany({
      where: { id: { in: itemIds } },
      select: listSelect,
    });
    const itemMap = new Map(fullItems.map((/** @type {{ id: string }} */ i) => [i.id, i]));
    enrichedItems = items.map((/** @type {{ id: string, rank?: number }} */ raw) => {
      const full = itemMap.get(raw.id);
      if (!full) return null;
      const { sourceDocument, ...safeFull } = full;
      const baseItem = {
        ...safeFull,
        provenance: buildProvenance({
          verifiedAt: safeFull.date_verification,
          fetchedAt: sourceDocument?.fetched_at,
          sourceUrl: sourceDocument?.source_url || safeFull.source_url || safeFull.source_url_exact,
        }),
      };
      if (q) return { ...baseItem, rank: raw.rank };
      return baseItem;
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
/**
 * @param {any} prisma
 * @param {any} params
 */
export async function searchStructures(prisma, params) {
  const { q, city, zip, type, departement, pmr, sort, page, pageSize } = params;
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

  if (departement) {
    conditions.push(Prisma.sql`"departement" = ${departement}`);
  }

  if (type && type !== '_all') {
    // Handle legacy values like "Association" vs "association"
    conditions.push(Prisma.sql`LOWER("type_structure") = LOWER(${type})`);
  }

  const wantsPmr = pmr === 'true' || pmr === '1';
  if (wantsPmr) {
    conditions.push(Prisma.sql`"accessibilite_pmr" = true`);
  }

  const whereClause = conditions.length > 0
    ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
    : Prisma.empty;

  let orderBy;
  let selectRank = Prisma.empty;

  // P4: external sort aliases (stable contract) -> internal implementation
  /** @type {Record<string, string>} */
  const sortAliases = {
    relevance: 'pertinence',
    recent: '-updated_date',
    '-recent': 'updated_date',
    quality: '-quality_score',
    '-quality': 'quality_score',
    alpha: 'nom',
    '-alpha': '-nom',
  };

  const effectiveSort = sortAliases[sort] || sort;
  const sortDirection = effectiveSort?.startsWith('-') ? 'DESC' : 'ASC';
  const sortField = effectiveSort?.startsWith('-') ? effectiveSort.substring(1) : effectiveSort;

  /** @type {Record<string, string>} */
  const SAFE_SORT_COLUMNS = {
    updated_date: 'updatedAt',
    nom: 'nom',
    quality_score: 'quality_score',
  };

  if (q && (effectiveSort === 'pertinence' || sortField === 'pertinence')) {
    selectRank = Prisma.sql`, ts_rank_cd("search_vector", plainto_tsquery('french', unaccent(${q}))) as rank`;
    orderBy = Prisma.sql`ORDER BY rank DESC, quality_score DESC, nom ASC, id ASC`;
  } else if (sortField === 'pertinence') {
    // Relevance sorting requires q. Without q we fallback to quality.
    orderBy = Prisma.sql`ORDER BY quality_score DESC, "updatedAt" DESC, id ASC`;
  } else if (sortField && SAFE_SORT_COLUMNS[sortField]) {
    const dbColumn = SAFE_SORT_COLUMNS[sortField];
    const safeColumn = Prisma.raw(`"${dbColumn}"`);

    if (dbColumn === 'quality_score') {
      orderBy = sortDirection === 'DESC'
        ? Prisma.sql`ORDER BY ${safeColumn} DESC, "updatedAt" DESC, nom ASC, id ASC`
        : Prisma.sql`ORDER BY ${safeColumn} ASC, "updatedAt" DESC, nom ASC, id ASC`;
    } else if (dbColumn === 'updatedAt') {
      orderBy = sortDirection === 'DESC'
        ? Prisma.sql`ORDER BY ${safeColumn} DESC, id ASC`
        : Prisma.sql`ORDER BY ${safeColumn} ASC, id ASC`;
    } else {
      orderBy = sortDirection === 'DESC'
        ? Prisma.sql`ORDER BY ${safeColumn} DESC, id ASC`
        : Prisma.sql`ORDER BY ${safeColumn} ASC, id ASC`;
    }
  } else {
    // Default fallback (stable & useful): quality first, then most recent
    orderBy = Prisma.sql`ORDER BY quality_score DESC, "updatedAt" DESC, id ASC`;
  }

  const itemsQuery = Prisma.sql`SELECT id ${selectRank} FROM "Structure" ${whereClause} ${orderBy} LIMIT ${LIMIT} OFFSET ${OFFSET}`;
  const countQuery = Prisma.sql`SELECT count(*) as total FROM "Structure" ${whereClause}`;

  const [items, countResult] = await Promise.all([
    prisma.$queryRaw(itemsQuery),
    prisma.$queryRaw(countQuery)
  ]);

  // Keep the listing payload lightweight; detail endpoints fetch full objects separately.
  const itemIds = items.map((/** @type {{ id: string }} */ i) => i.id);
  let enrichedItems = [];
  if (itemIds.length > 0) {
    const listSelect = {
      id: true,
      slug: true,
      nom: true,
      type_structure: true,
      accessibilite_pmr: true,
      description_courte: true,
      date_verification: true,
      source_url: true,
      source_url_exact: true,
      adresse: true,
      code_postal: true,
      ville: true,
      departement: true,
      telephone: true,
      email: true,
      site_web: true,
      horaires: true,
      updatedAt: true,
      published_at: true,
      quality_score: true,
      statut: true,
      status: true,
      is_pro_enabled: true,
      sourceDocument: {
        select: {
          fetched_at: true,
          source_url: true,
        },
      },
    };

    const fullItems = await prisma.structure.findMany({
      where: { id: { in: itemIds } },
      select: listSelect,
    });
    const itemMap = new Map(fullItems.map((/** @type {{ id: string }} */ i) => [i.id, i]));
    enrichedItems = items.map((/** @type {{ id: string, rank?: number }} */ raw) => {
      const full = itemMap.get(raw.id);
      if (!full) return null;
      const { sourceDocument, ...safeFull } = full;
      const baseItem = {
        ...safeFull,
        provenance: buildProvenance({
          verifiedAt: safeFull.date_verification,
          fetchedAt: sourceDocument?.fetched_at,
          sourceUrl: sourceDocument?.source_url || safeFull.source_url || safeFull.source_url_exact,
        }),
      };
      if (q) return { ...baseItem, rank: raw.rank };
      return baseItem;
    }).filter(Boolean);
  }

  return {
    items: enrichedItems,
    total: Number(countResult[0].total || 0)
  };
}
