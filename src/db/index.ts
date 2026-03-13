import { neon } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';
import { env } from '../../api/_utils/env.js'; // Adjust path if needed

const connectionString = env.db.databaseUrl;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set for Drizzle ORM');
}

let dbInstance;

if (connectionString.includes('localhost') || connectionString.includes('127.0.0.1')) {
  const pool = new pg.Pool({ connectionString });
  dbInstance = drizzlePg(pool, { schema });
} else {
  const sql = neon(connectionString);
  dbInstance = drizzleNeon(sql, { schema });
}

export const db = dbInstance;
