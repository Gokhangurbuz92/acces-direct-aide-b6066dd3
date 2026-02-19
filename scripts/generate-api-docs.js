import fs from 'fs';

const ROUTES_FILE = 'api/routes.js';
const OUTPUT_FILE = 'docs/ROUTES_API.md';

function generateApiDocs() {
  const content = fs.readFileSync(ROUTES_FILE, 'utf8');

  // 1. Extract imports
  // import name from './path.js';
  const imports = {};
  const importRegex = /import\s+(\w+)\s+from\s+'([^']+)';/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports[match[1]] = match[2];
  }

  // 2. Extract routes
  // { path: 'path', match: 'match', handler: name },
  const routes = [];
  const routeRegex = /{\s*path:\s*'([^']+)',\s*match:\s*'([^']+)',\s*handler:\s*(\w+)\s*}/g;
  while ((match = routeRegex.exec(content)) !== null) {
    routes.push({
      path: match[1],
      matchType: match[2],
      handlerVar: match[3]
    });
  }

  // 3. Generate Markdown
  let md = '# Documentation API Routes\n\n';
  md += 'Ce fichier est généré automatiquement à partir de `api/routes.js`.\n';
  md += 'Il liste les routes définies et leurs gestionnaires.\n\n';
  md += '| Path | Match | Handler File | Auth (Estimé) | Description |\n';
  md += '|---|---|---|---|---|\n';

  routes.forEach(r => {
    const handlerFile = imports[r.handlerVar] || 'Unknown';

    // Auth Guess
    let auth = 'Public';
    if (r.path.startsWith('admin/') || handlerFile.includes('/admin/')) auth = 'Admin';
    else if (r.path.startsWith('pro/') || handlerFile.includes('/pro/')) auth = 'Pro';
    else if (r.path.startsWith('auth/')) auth = 'Public/Auth';

    // Description
    let desc = '-';

    md += `| \`/api/${r.path}\` | \`${r.matchType}\` | \`${handlerFile}\` | ${auth} | ${desc} |\n`;
  });

  fs.writeFileSync(OUTPUT_FILE, md);
  console.log(`Generated ${OUTPUT_FILE}`);
}

generateApiDocs();
