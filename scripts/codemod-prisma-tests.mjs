import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const testFiles = [];
walkDir(path.join(projectRoot, 'tests'), (filePath) => {
  if (filePath.endsWith('.js') || filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
    testFiles.push(filePath);
  }
});

let modifiedFiles = 0;

for (const file of testFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  if (!content.includes('prisma')) continue;

  // 1. Replace imports
  content = content.replace(/import prisma from ['"]\.\.\/\.\.\/api\/_utils\/prisma\.js['"];?/g, "import { db } from '../../src/db/index.js';\nimport * as schema from '../../src/db/schema.js';\nimport { eq, sql } from 'drizzle-orm';");
  content = content.replace(/import prisma from ['"]\.\.\/api\/_utils\/prisma\.js['"];?/g, "import { db } from '../src/db/index.js';\nimport * as schema from '../src/db/schema.js';\nimport { eq, sql } from 'drizzle-orm';");
  
  // Replace direct @prisma/client imports if any
  content = content.replace(/import \{.*?PrismaClient.*?\} from ['"]@prisma\/client['"];?\n?/g, "");

  // Replace mocks for prisma
  content = content.replace(/vi\.mock\(['"]\.\.\/\.\.\/api\/_utils\/prisma\.js['"]\);?/g, "vi.mock('../../src/db/index.js');");
  content = content.replace(/vi\.mock\(['"]\.\.\/api\/_utils\/prisma\.js['"]\);?/g, "vi.mock('../src/db/index.js');");

  // Replace mPrisma -> db mock mentions
  content = content.replace(/const mPrisma = vi\.hoisted/g, "const db = vi.hoisted");

  // 2. Replace prisma.model.create({ data: ... })
  content = content.replace(/prisma\.([a-zA-Z0-9_]+)\.create\(\s*\{\s*data:\s*([\s\S]*?)\}\s*\)/g, (match, model, dataMatch) => {
    const dModel = model.charAt(0).toUpperCase() + model.slice(1);
    return `(await db.insert(schema.${dModel}).values(${dataMatch}).returning())[0]`;
  });

  // 3. Replace prisma.model.findUnique({ where: ... })
  content = content.replace(/prisma\.([a-zA-Z0-9_]+)\.(findUnique|findFirst)\(\s*\{\s*where:\s*([\s\S]*?)\}\s*\)/g, (match, model, method, whereMatch) => {
    const dModel = model.charAt(0).toUpperCase() + model.slice(1);
    return `db.query.${dModel}.findFirst({ where: eq(schema.${dModel}.id, "TODO_FIX_WHERE") /* AUTOMIGRATED: ${whereMatch.replace(/\n/g, ' ')} */ })`;
  });

  // 4. Replace prisma.model.deleteMany
  content = content.replace(/prisma\.([a-zA-Z0-9_]+)\.deleteMany\([\s\S]*?\)/g, (match, model) => {
    const dModel = model.charAt(0).toUpperCase() + model.slice(1);
    return `await db.delete(schema.${dModel})`;
  });

  // 5. count
  content = content.replace(/prisma\.([a-zA-Z0-9_]+)\.count\([\s\S]*?\)/g, (match, model) => {
    const dModel = model.charAt(0).toUpperCase() + model.slice(1);
    return `(await db.select({ count: sql\`count(*)\` }).from(schema.${dModel}))[0].count`;
  });

  // 6. queries
  content = content.replace(/prisma\.([a-zA-Z0-9_]+)\.findMany\(\s*([\s\S]*?)\s*\)/g, (match, model, arg) => {
    const dModel = model.charAt(0).toUpperCase() + model.slice(1);
    return `db.query.${dModel}.findMany(${arg})`;
  });
  
  content = content.replace(/prisma\.\$queryRaw`/g, 'db.execute(sql`');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedFiles++;
    console.log(`Migrated: ${file.replace(projectRoot, '')}`);
  }
}

console.log(`\nFinished codemod. Modified ${modifiedFiles} files.`);
