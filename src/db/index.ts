import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';
import { env } from '../../api/_utils/env.js';

const connectionString = env.db.databaseUrl;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set for Drizzle ORM');
}

// Always use node-postgres Pool — it supports transactions on all connection
// types (local Postgres, Neon, Supabase, etc.).  The previous neon-http driver
// was incompatible with db.transaction() which is required by the booking and
// auth handlers.
const pool = new pg.Pool({ connectionString, ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1') ? false : { rejectUnauthorized: false } });
export const db = drizzle(pool, { schema });
