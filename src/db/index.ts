import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

/**
 * Muunganisho wa Database (PostgreSQL)
 *
 * Mfumo unaunganishwa na PostgreSQL kupitia pg.Pool na Drizzle ORM.
 */
const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@127.0.0.1:5432/app_db";

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 5000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);

export function getConnectionInfo() {
  return {
    host: "127.0.0.1",
    port: 5432,
    database: "app_db",
    ssl: false,
    provider: "PostgreSQL (Local / Cloud)",
  };
}
