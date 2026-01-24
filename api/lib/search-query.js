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

  const itemsQuery = Prisma.sql`SELECT * ${selectRank} FROM "Demarche" ${whereClause} ${orderBy} LIMIT ${LIMIT} OFFSET ${OFFSET}`;
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
