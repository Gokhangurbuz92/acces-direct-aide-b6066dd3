/* eslint-disable no-undef */
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL || process.env.DATABASE_URL_TEST;

// In E2E / dev-preview environments (no real DB), silently skip initialization.
// The API handlers won't be called because USE_MOCKS is set.
// In all other environments (CI integration tests, production),
// crash loudly if DATABASE_URL is missing.
let db: ReturnType<typeof drizzle<typeof schema>>;

if (connectionString) {
  const pool = new pg.Pool({
    connectionString,
    ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
      ? false
      : { rejectUnauthorized: false },
  });
  db = drizzle(pool, { schema });
} else if (process.env.USE_MOCKS === 'true' || process.env.VITE_SKIP_DB === 'true') {
  // E2E / Storybook / dev-preview: provide a dummy that won't be used at runtime
  db = {} as ReturnType<typeof drizzle<typeof schema>>;
} else {
  throw new Error('DATABASE_URL is not set for Drizzle ORM');
}

export { db };
