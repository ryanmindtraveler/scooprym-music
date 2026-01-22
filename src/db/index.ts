/**
 * Connect to PostgreSQL Database (Supabase/Neon/Local PostgreSQL)
 * https://orm.drizzle.team/docs/tutorials/drizzle-with-supabase
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Prevent multiple connections in development
const globalForDb = globalThis as unknown as {
  conn: ReturnType<typeof drizzle<typeof schema>> | undefined;
};

let db: ReturnType<typeof drizzle<typeof schema>>;

export function getDb() {
  if (db) return db;
  if (globalForDb.conn) return globalForDb.conn;

  const connectionString = process.env.DATABASE_URL!;
  const client = postgres(connectionString, { prepare: false });
  db = drizzle(client, { schema });

  if (process.env.NODE_ENV !== 'production') {
    globalForDb.conn = db;
  }

  return db;
}

/**
 * Connect to Neon Database
 * https://orm.drizzle.team/docs/tutorials/drizzle-with-neon
 */


/**
 * Database connection with Drizzle
 * https://orm.drizzle.team/docs/connect-overview
 *
 * Drizzle <> PostgreSQL
 * https://orm.drizzle.team/docs/get-started-postgresql
 *
 * Get Started with Drizzle and Neon
 * https://orm.drizzle.team/docs/get-started/neon-new
 *
 * Drizzle with Neon Postgres
 * https://orm.drizzle.team/docs/tutorials/drizzle-with-neon
 *
 * Drizzle <> Neon Postgres
 * https://orm.drizzle.team/docs/connect-neon
 *
 * Drizzle with Supabase Database
 * https://orm.drizzle.team/docs/tutorials/drizzle-with-supabase
 */
