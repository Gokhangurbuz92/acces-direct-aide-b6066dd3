import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local', override: false, quiet: true });
dotenv.config({ path: '.env', override: false, quiet: true });

// Provide safe defaults so import checks do not fail because env is incomplete.
process.env.ADA_ENCRYPTION_KEY ||= '0'.repeat(64);
process.env.JWT_SECRET ||= 'dev-jwt-secret';
process.env.ADMIN_TOKEN ||= 'dev-admin-token';
process.env.CRON_SECRET ||= 'dev-cron-secret';

const repoRoot = process.cwd();
const routesFile = path.resolve(repoRoot, 'api/routes.js');
const apiDir = path.resolve(repoRoot, 'api');

function parseRoutesImports(source) {
  const importRegex = /import\s+([A-Za-z0-9_$]+)\s+from\s+'([^']+)'/g;
  const imports = [];
  let match;

  while ((match = importRegex.exec(source))) {
    imports.push({
      symbolName: match[1],
      relativePath: match[2],
    });
  }

  return imports;
}

async function verifyImports() {
  const source = fs.readFileSync(routesFile, 'utf8');
  const imports = parseRoutesImports(source);

  console.log(`Checking ${imports.length} handler imports from api/routes.js...`);

  const importedHandlers = new Map();
  const errors = [];

  for (const { symbolName, relativePath } of imports) {
    const absolutePath = path.resolve(apiDir, relativePath);
    if (!fs.existsSync(absolutePath)) {
      errors.push(`❌ MISSING FILE: ${symbolName} -> ${relativePath}`);
      continue;
    }

    try {
      const module = await import(pathToFileURL(absolutePath).href);
      if (typeof module.default !== 'function') {
        errors.push(`❌ INVALID DEFAULT EXPORT: ${symbolName} -> ${relativePath} (expected function)`);
        continue;
      }
      importedHandlers.set(symbolName, module.default);
      console.log(`✅ OK: ${symbolName} (${relativePath})`);
    } catch (error) {
      errors.push(`❌ IMPORT ERROR: ${symbolName} -> ${relativePath} (${error.message})`);
    }
  }

  let routes = [];
  try {
    const routesModule = await import(pathToFileURL(routesFile).href);
    routes = Array.isArray(routesModule.routes) ? routesModule.routes : [];
  } catch (error) {
    errors.push(`❌ ROUTES IMPORT ERROR: ${error.message}`);
  }

  if (routes.length > 0) {
    console.log(`\nValidating ${routes.length} routes...`);
  }

  routes.forEach((route, index) => {
    const routeLabel = route?.path || `index ${index}`;
    if (!route || typeof route.path !== 'string') {
      errors.push(`❌ INVALID ROUTE SHAPE at ${index}: missing string path`);
      return;
    }
    if (typeof route.handler !== 'function') {
      errors.push(`❌ INVALID HANDLER TYPE for route "${routeLabel}"`);
      return;
    }

    const isKnownHandler = Array.from(importedHandlers.values()).includes(route.handler);
    if (!isKnownHandler) {
      errors.push(`❌ UNKNOWN HANDLER REFERENCE for route "${routeLabel}"`);
      return;
    }

    console.log(`✅ ROUTE: ${route.path}`);
  });

  if (errors.length > 0) {
    console.error('\nFAILED CHECKS:');
    errors.forEach((error) => console.error(error));
    process.exit(1);
  }

  console.log('\nSUCCESS: All route handlers import correctly and routes are valid.');
  process.exit(0);
}

await verifyImports();
