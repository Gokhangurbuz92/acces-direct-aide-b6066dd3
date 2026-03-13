import fs from 'fs';
import path from 'path';

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function convertPrismaToDrizzle(content) {
  let newContent = content;

  // Add imports if missing
  if (newContent.includes('prisma') && !newContent.includes('import { db } from')) {
    const importStr = "import { db } from '../../src/db/index.js';\nimport * as schema from '../../src/db/schema.js';\nimport { eq, inArray, and, or, sql } from 'drizzle-orm';\n";
    
    // Insert after the last import or at top
    const lastImportIndex = newContent.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      const endOfLine = newContent.indexOf('\n', lastImportIndex);
      newContent = newContent.slice(0, endOfLine + 1) + importStr + newContent.slice(endOfLine + 1);
    } else {
      newContent = importStr + newContent;
    }
  }

  // Remove prisma imports
  newContent = newContent.replace(/import\s*\{\s*prisma\s*\}\s*from\s*['"]?[^'"]+prisma(?:-client)?[^'"]*['"]?;?\n?/g, '');
  newContent = newContent.replace(/import\s*prisma\s*from\s*['"]?[^'"]+prisma(?:-client)?[^'"]*['"]?;?\n?/g, '');
  newContent = newContent.replace(/const\s+\{\s*prisma\s*\}\s*=\s*require\([^)]+\);?\n?/g, '');
  newContent = newContent.replace(/const\s+prisma\s*=\s*require\([^)]+\);?\n?/g, '');



  // 1. Transactions: prisma.$transaction([ ... ]) -> db.transaction(async (tx) => { ... })
  newContent = newContent.replace(/prisma\.\$transaction\(\s*\[/g, '/* TODO: MANUAL DRIZZLE TX */ prisma.$transaction([');

  // 2. deleteMany
  newContent = newContent.replace(/prisma\.([a-zA-Z0-9_]+)\.deleteMany\(\s*(?:{[^}]*})?\s*\)/g, (match, model) => {
    return `db.delete(schema.${capitalize(model)})`;
  });

  // 3. delete
  newContent = newContent.replace(/prisma\.([a-zA-Z0-9_]+)\.delete\(\s*{\s*where:\s*{\s*([a-zA-Z0-9_]+)\s*:\s*([^}]+)\s*}\s*}\s*\)/g, (match, model, key, val) => {
    return `db.delete(schema.${capitalize(model)}).where(eq(schema.${capitalize(model)}.${key}, ${val}))`;
  });

  // 4. create
  newContent = newContent.replace(/prisma\.([a-zA-Z0-9_]+)\.create\(\s*{\s*data:\s*({[^}]*})\s*}\s*\)/g, (match, model, dataObj) => {
    return `(await db.insert(schema.${capitalize(model)}).values(${dataObj}).returning())[0]`;
  });

  // 5. count
  newContent = newContent.replace(/prisma\.([a-zA-Z0-9_]+)\.count\(\s*(?:{[^}]*})?\s*\)/g, (match, model) => {
    return `Number((await db.select({ count: sql\`count(*)\` }).from(schema.${capitalize(model)}))[0].count)`;
  });

  // 6. Prisma array inserts (createMany)
  newContent = newContent.replace(/prisma\.([a-zA-Z0-9_]+)\.createMany\(\s*{\s*data:\s*(\[[^\]]*\])\s*}\s*\)/g, (match, model, dataArray) => {
    return `db.insert(schema.${capitalize(model)}).values(${dataArray})`;
  });

  // 7. Find methods -> db.query
  newContent = newContent.replace(/prisma\.([a-zA-Z0-9_]+)\.(findMany|findFirst|findUnique)\(/g, (match, model, method) => {
    const dMethod = method === 'findUnique' ? 'findFirst' : method;
    return `db.query.${capitalize(model)}.${dMethod}(`;
  });

  // 8. Vi mocks 
  newContent = newContent.replace(/vi\.mock\(['"]\.\.\/\.\.\/src\/lib\/prisma['"]\);?/g, "/* vi.mock('../../src/lib/prisma'); // REPLACED */");
  newContent = newContent.replace(/vi\.mock\(['"]@prisma\/client['"][\s\S]*?\}\);?/g, "/* vi.mock('@prisma/client'); // REPLACED */");
  newContent = newContent.replace(/import\s*prisma\s*from\s*['"]\.\.\/\.\.\/src\/lib\/prisma['"];?\n?/g, "import { db } from '../../src/db/index.js';\nimport * as schema from '../../src/db/schema.js';\n");
  newContent = newContent.replace(/const\s+prisma\s*=\s*new\s*PrismaClient\(\);?/g, "");

  // 9. Cleanup lingering `prisma.`
  newContent = newContent.replace(/prisma\.([a-zA-Z0-9_]+)/g, (match, model) => {
    if (['$transaction', '$disconnect', '$connect', '$queryRaw'].includes(model)) return match;
    return `db.query.${capitalize(model)}`;
  });

  return newContent;
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  let modifiedCount = 0;

  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      modifiedCount += processDirectory(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('prisma.')) {
        const migrated = convertPrismaToDrizzle(content);
        if (migrated !== content) {
          fs.writeFileSync(fullPath, migrated, 'utf8');
          console.log(`Migrated: ${fullPath}`);
          modifiedCount++;
        }
      }
    }
  }
  return modifiedCount;
}

const targetDir = process.argv[2];
if (!targetDir) {
  console.error("Please provide a target directory.");
  process.exit(1);
}

console.log(`Starting migration in ${targetDir}...`);
const updated = processDirectory(targetDir);
console.log(`Completed. Modified ${updated} files.`);
