import fs from 'fs';

function refactorHybridSearch() {
  let content = fs.readFileSync('api/lib/hybrid-search.js', 'utf8');

  content = content.replace(/import \{ Prisma \} from '@prisma\/client';/g, "import { sql } from 'drizzle-orm';\nimport { db } from '../../src/db/index.js';");
  content = content.replace(/Prisma\.sql/g, 'sql');
  content = content.replace(/Prisma\.join\(([^,]+)(?:,\s*'([^']+)')?\)/g, (match, array, sep) => {
    if (sep) return `sql.join(${array}, sql.raw('${sep}'))`;
    return `sql.join(${array}, sql.raw(','))`;
  });
  content = content.replace(/async function getSearchCapabilities\(prisma\)/g, 'async function getSearchCapabilities()');
  content = content.replace(/await prisma\.\$queryRaw`/g, 'await db.execute(sql`');
  
  // Fix the backtick closing for db.execute(sql`...`)
  content = content.replace(/has_unaccent_extension\n    `;/g, 'has_unaccent_extension\n    `);');

  content = content.replace(/export async function searchAidesHybrid\(prisma, params\)/g, 'export async function searchAidesHybrid(params)');
  content = content.replace(/const rows = await prisma\.\$queryRaw\(fusionSql\);/g, 'const result = await db.execute(fusionSql);\n  const rows = result.rows || result;');
  content = content.replace(/const row = rows\?\.\[0\] \|\| \{\};/g, 'const actualRows = rows.rows || rows;\n    const row = actualRows?.[0] || {};');
  content = content.replace(/const capabilities = await getSearchCapabilities\(prisma\);/g, 'const capabilities = await getSearchCapabilities();');

  fs.writeFileSync('api/lib/hybrid-search.js', content);
  console.log('Hybrid search refactored');
}

function refactorSearchQuery() {
  let content = fs.readFileSync('api/lib/search-query.js', 'utf8');

  content = content.replace(/import \{ Prisma \} from '@prisma\/client';/g, "import { sql } from 'drizzle-orm';\nimport { db } from '../../src/db/index.js';");
  content = content.replace(/Prisma\.sql/g, 'sql');
  content = content.replace(/Prisma\.empty/g, 'sql``');
  content = content.replace(/Prisma\.raw/g, 'sql.raw');
  content = content.replace(/Prisma\.join\(([^,]+)(?:,\s*'([^']+)')?\)/g, (match, array, sep) => {
    if (sep) return `sql.join(${array}, sql.raw('${sep}'))`;
    return `sql.join(${array}, sql.raw(','))`;
  });
  
  content = content.replace(/export async function searchAides\(prisma, params\)/g, 'export async function searchAides(params)');
  content = content.replace(/export async function searchDemarches\(prisma, params\)/g, 'export async function searchDemarches(params)');
  content = content.replace(/export async function searchStructures\(prisma, params\)/g, 'export async function searchStructures(params)');
  content = content.replace(/prisma\.\$queryRaw\(/g, 'db.execute(');

  // Fix where items are returned from promise.all
  content = content.replace(/const items = await prisma\.\$queryRaw\(itemsQuery\);/g, 'const itemsRes = await db.execute(itemsQuery);\n  const items = itemsRes.rows || itemsRes;');

  content = content.replace(
    /const \[items, countResult, facetsResult\] = await Promise\.all\(\[\n    db\.execute\(itemsQuery\),\n    db\.execute\(countQuery\),\n    db\.execute\(facetsQuery\)\n  \]\);/g,
    `const [itemsRes, countRes, facetsRes] = await Promise.all([
    db.execute(itemsQuery),
    db.execute(countQuery),
    db.execute(facetsQuery)
  ]);
  const items = itemsRes.rows || itemsRes;
  const countResult = countRes.rows || countRes;
  const facetsResult = facetsRes.rows || facetsRes;`
  );

  content = content.replace(
    /const \[items, countResult\] = await Promise\.all\(\[\n    db\.execute\(itemsQuery\),\n    db\.execute\(countQuery\)\n  \]\);/g,
    `const [itemsRes, countRes] = await Promise.all([
    db.execute(itemsQuery),
    db.execute(countQuery)
  ]);
  const items = itemsRes.rows || itemsRes;
  const countResult = countRes.rows || countRes;`
  );
  
  content = content.replace(/await prisma\.aide\./g, 'await db.query.Aide.');
  
  fs.writeFileSync('api/lib/search-query.js', content);
  console.log('Search query refactored partially, needs findMany replacing');
}

refactorHybridSearch();
refactorSearchQuery();
