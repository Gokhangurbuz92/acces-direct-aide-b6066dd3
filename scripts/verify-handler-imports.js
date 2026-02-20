import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set dummy env vars to prevent crashes during import due to missing config
process.env.DATABASE_URL = 'postgresql://dummy:dummy@localhost:5432/dummy';
process.env.ADA_ENCRYPTION_KEY = '0000000000000000000000000000000000000000000000000000000000000000'; // 64 hex chars
process.env.JWT_SECRET = 'dummy_jwt_secret';
process.env.CRON_SECRET = 'dummy_cron_secret';
process.env.UPSTASH_REDIS_REST_URL = 'https://dummy.upstash.io';
process.env.UPSTASH_REDIS_REST_TOKEN = 'dummy_token';

async function verify() {
  console.log('Verifying API routes imports...');

  try {
    // Dynamic import of the routes file.
    // This will fail if any imported file in api/routes.js is missing or has syntax errors.
    const routesPath = path.resolve(__dirname, '../api/routes.js');
    const routesModule = await import(routesPath);

    console.log('Successfully imported api/routes.js');

    if (!routesModule.routes || !Array.isArray(routesModule.routes)) {
        throw new Error('api/routes.js does not export a "routes" array.');
    }

    console.log(`Found ${routesModule.routes.length} routes defined.`);

    // Check if handlers are functions
    const invalidRoutes = routesModule.routes.filter(r => typeof r.handler !== 'function');
    if (invalidRoutes.length > 0) {
        console.error('Invalid routes found (handler is not a function):', invalidRoutes.map(r => r.path));
        process.exit(1);
    }

    console.log('All handlers are valid functions.');
    process.exit(0);

  } catch (error) {
    console.error('Failed to verify api/routes.js:', error);
    process.exit(1);
  }
}

verify();
