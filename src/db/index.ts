import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema.js';
import { env } from '../../api/_utils/env.js'; // Adjust path if needed

const connectionString = env.db.databaseUrl;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set for Drizzle ORM');
}

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
