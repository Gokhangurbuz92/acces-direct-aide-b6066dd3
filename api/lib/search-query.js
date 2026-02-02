import { Prisma } from '@prisma/client';

/**
 * Builds and executes a search query for Aides.
 */
export async function searchAides(prisma, params) {
  const { q, category, situation, geo, audience, providerType, page, pageSize } = params;
  const LIMIT = pageSize;
  const OFFSET = (page - 1) * LIMIT;

  const conditions = [Prisma.sql`statut = 'publie'`];

  // 1. Full Text Search
  if (q) {
    // We use unaccent(q) to match the unaccented vector.
    // We rely on the unaccent extension being present.
    // We use websearch_to_tsquery for better user experience (handling quotes etc)
    // or plainto_tsquery if websearch is too strict. Current code used plainto_tsquery.
    conditions.push(Prisma.sql`"search_vector" @@ plainto_tsquery('french', unaccent(${q}))`);
  }

  // 2. Filters
  if (category) {
    conditions.push(Prisma.sql`("categoryId" = ${category} OR EXISTS (SELECT 1 FROM "AidCategory" c WHERE c.id = "Aide"."categoryId" AND c.slug = ${category}))`);
  }

  if (situation) {
    // Many-to-Many relation via _AideToLifeSituation
    // "A" is Aide.id, "B" is LifeSituation.id
    conditions.push(Prisma.sql`EXISTS (
      SELECT 1 FROM "_AideToLifeSituation" j
      JOIN "LifeSituation" s ON s.id = j."B"
      WHERE j."A" = "Aide".id AND s.slug = ${situation}
    )`);
  }

  if (geo) {
    // Postgres Array check: val = ANY(array)
    conditions.push(Prisma.sql`${geo} = ANY("territoires")`);
  }

  if (audience) {
    conditions.push(Prisma.sql`${audience} = ANY("audiences")`);
  }

  if (providerType) {
    conditions.push(Prisma.sql`"providerType" = ${providerType}`);
  }

  const whereClause = conditions.length > 0
    ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
    : Prisma.empty;

  // 3. Sorting and Selection
  let orderBy;
  let selectRank = Prisma.empty;

  if (q) {
    selectRank = Prisma.sql`, ts_rank_cd("search_vector", plainto_tsquery('french', unaccent(${q}))) as rank`;
    orderBy = Prisma.sql`ORDER BY rank DESC, published_at DESC`;
  } else {
    orderBy = Prisma.sql`ORDER BY published_at DESC, id ASC`;
  }

  // 4. Execution
  // We need to fetch items and count.

  // Query for items
  const itemsQuery = Prisma.sql`
    SELECT * ${selectRank}
    FROM "Aide"
    ${whereClause}
    ${orderBy}
    LIMIT ${LIMIT} OFFSET ${OFFSET}
  `;

  // Query for total count
  const countQuery = Prisma.sql`
    SELECT count(*) as total
    FROM "Aide"
    ${whereClause}
  `;

  const [items, countResult] = await Promise.all([
    prisma.$queryRaw(itemsQuery),
    prisma.$queryRaw(countQuery)
  ]);

  // Transform items if necessary (Prisma Raw returns everything as is)
  // We might want to fetch related entities (category, situations) like findMany does.
  // Using $queryRaw, we don't get relations automatically.
  // We can:
  // A) Fetch relations in a second step using IDs.
  // B) JSON_AGG in SQL (complex).
  // C) Return bare items and let frontend fetch details if needed?
  //    The current implementation returns `include: { category: true, situations: true }`.

  // Strategy A is best for consistency.
  const itemIds = items.map(i => i.id);

  let enrichedItems = [];
  if (itemIds.length > 0) {
    // Fetch with relations using Prisma Client (preserves types and relations)
    // AND preserve the order from the search!
    const fullItems = await prisma.aide.findMany({
      where: { id: { in: itemIds } },
      include: { category: true, situations: true }
    });

    // Re-order based on the raw query result
    const itemMap = new Map(fullItems.map(i => [i.id, i]));
    enrichedItems = items.map(raw => {
        const full = itemMap.get(raw.id);
        if (q) {
            return { ...full, rank: raw.rank };
        }
        return full;
    }).filter(Boolean);
  }

  return {
    items: enrichedItems,
    total: Number(countResult[0].total || 0)
  };
}

/**
 * Builds and executes a search query for Demarches with facets support.
 */
export async function searchDemarches(prisma, params) {
  const {
    q, category, situation, geo, organisme, canal, territoire_niveau, territoire_code,
    public: publicFilter, statut, sort, page, pageSize
  } = params;

  const LIMIT = pageSize;
  const OFFSET = (page - 1) * LIMIT;

  const conditions = [];

  // Status filter (default: publie)
  conditions.push(Prisma.sql`statut = ${statut || 'publie'}`);

  // Full-text search
  if (q) {
    conditions.push(Prisma.sql`"search_vector" @@ plainto_tsquery('french', unaccent(${q}))`);
  }

  // Category filter (support both ID and slug)
  if (category) {
    conditions.push(Prisma.sql`("categoryId" = ${category} OR EXISTS (SELECT 1 FROM "AidCategory" c WHERE c.id = "Demarche"."categoryId" AND c.slug = ${category}))`);
  }

  // Situation filter (many-to-many)
  if (situation) {
     conditions.push(Prisma.sql`EXISTS (
      SELECT 1 FROM "_DemarcheToSituation" j
      JOIN "LifeSituation" s ON s.id = j."B"
      WHERE j."A" = "Demarche".id AND s.slug = ${situation}
    )`);
  }

  // Geo filter (legacy departements field)
  if (geo) {
    conditions.push(Prisma.sql`${geo} = ANY("departements")`);
  }

  // Organisme filter (NEW)
  if (organisme) {
    conditions.push(Prisma.sql`"organisme" = ${organisme}`);
  }

  // Canal filter (NEW)
  if (canal) {
    conditions.push(Prisma.sql`"canal" = ${canal}`);
  }

  // Territoire niveau filter (NEW)
  if (territoire_niveau) {
    conditions.push(Prisma.sql`"territoire_niveau" = ${territoire_niveau}`);
  }

  // Territoire code filter (NEW)
  if (territoire_code) {
    conditions.push(Prisma.sql`${territoire_code} = ANY("territoire_codes")`);
  }

  // Public filter (NEW)
  if (publicFilter) {
    conditions.push(Prisma.sql`${publicFilter} = ANY("public")`);
  }

  const whereClause = conditions.length > 0
    ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
    : Prisma.empty;

  // Sorting
  let orderBy;
  let selectRank = Prisma.empty;

  const sortParam = sort || 'pertinence';

  if (q && sortParam === 'pertinence') {
    selectRank = Prisma.sql`, ts_rank_cd("search_vector", plainto_tsquery('french', unaccent(${q}))) as rank`;
    orderBy = Prisma.sql`ORDER BY rank DESC, published_at DESC`;
  } else if (sortParam === '-created_date') {
    orderBy = Prisma.sql`ORDER BY published_at DESC, id ASC`;
  } else if (sortParam === 'title') {
    orderBy = Prisma.sql`ORDER BY titre ASC, id ASC`;
  } else if (sortParam === '-fetched_at') {
    orderBy = Prisma.sql`ORDER BY fetched_at DESC NULLS LAST, published_at DESC`;
  } else {
    orderBy = Prisma.sql`ORDER BY published_at DESC, id ASC`;
  }

  // Main query
  const itemsQuery = Prisma.sql`SELECT * ${selectRank} FROM "Demarche" ${whereClause} ${orderBy} LIMIT ${LIMIT} OFFSET ${OFFSET}`;
  const countQuery = Prisma.sql`SELECT count(*) as total FROM "Demarche" ${whereClause}`;

  const [items, countResult] = await Promise.all([
    prisma.$queryRaw(itemsQuery),
    prisma.$queryRaw(countQuery)
  ]);

  // Enrich with relations
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
        if (q && sortParam === 'pertinence') return { ...full, rank: raw.rank };
        return full;
    }).filter(Boolean);
  }

  // Compute facets (aggregations)
  const facets = await computeDemarchesFacets(prisma, conditions);

  return {
    items: enrichedItems,
    total: Number(countResult[0].total || 0),
    facets
  };
}

/**
 * Compute facets for Demarches (aggregation counts)
 */
async function computeDemarchesFacets(prisma, baseConditions) {
  // Build WHERE clause from base conditions (excluding current facet)
  const whereClause = baseConditions.length > 0
    ? Prisma.sql`WHERE ${Prisma.join(baseConditions, ' AND ')}`
    : Prisma.empty;

  // Categories facet
  const categoriesQuery = Prisma.sql`
    SELECT c.slug as key, c.label, COUNT(d.id) as count
    FROM "AidCategory" c
    LEFT JOIN "Demarche" d ON d."categoryId" = c.id AND d.statut = 'publie'
    GROUP BY c.id, c.slug, c.label
    HAVING COUNT(d.id) > 0
    ORDER BY c.label ASC
  `;

  // Situations facet
  const situationsQuery = Prisma.sql`
    SELECT s.slug as key, s.label, COUNT(DISTINCT j."A") as count
    FROM "LifeSituation" s
    LEFT JOIN "_DemarcheToSituation" j ON j."B" = s.id
    LEFT JOIN "Demarche" d ON d.id = j."A" AND d.statut = 'publie'
    GROUP BY s.id, s.slug, s.label
    HAVING COUNT(DISTINCT j."A") > 0
    ORDER BY s.label ASC
  `;

  // Organismes facet
  const organismesQuery = Prisma.sql`
    SELECT "organisme" as key, "organisme" as label, COUNT(*) as count
    FROM "Demarche"
    ${whereClause}
    AND "organisme" IS NOT NULL
    GROUP BY "organisme"
    ORDER BY count DESC, "organisme" ASC
    LIMIT 20
  `;

  // Canaux facet
  const canauxQuery = Prisma.sql`
    SELECT "canal" as key, "canal" as label, COUNT(*) as count
    FROM "Demarche"
    ${whereClause}
    AND "canal" IS NOT NULL
    GROUP BY "canal"
    ORDER BY count DESC
  `;

  // Territoires facet
  const territoiresQuery = Prisma.sql`
    SELECT "territoire_niveau" as key, "territoire_niveau" as label, COUNT(*) as count
    FROM "Demarche"
    ${whereClause}
    AND "territoire_niveau" IS NOT NULL
    GROUP BY "territoire_niveau"
    ORDER BY count DESC
  `;

  const [categories, situations, organismes, canaux, territoires] = await Promise.all([
    prisma.$queryRaw(categoriesQuery),
    prisma.$queryRaw(situationsQuery),
    prisma.$queryRaw(organismesQuery),
    prisma.$queryRaw(canauxQuery),
    prisma.$queryRaw(territoiresQuery)
  ]);

  return {
    categories: categories.map(c => ({ key: c.key, label: c.label, count: Number(c.count) })),
    situations: situations.map(s => ({ key: s.key, label: s.label, count: Number(s.count) })),
    organismes: organismes.map(o => ({ key: o.key, label: o.label, count: Number(o.count) })),
    canaux: canaux.map(c => ({ key: c.key, label: c.label, count: Number(c.count) })),
    territoires: territoires.map(t => ({ key: t.key, label: t.label, count: Number(t.count) }))
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

  const itemsQuery = Prisma.sql`SELECT * ${selectRank} FROM "Structure" ${whereClause} ${orderBy} LIMIT ${LIMIT} OFFSET ${OFFSET}`;
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
