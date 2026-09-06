<<<<<<< HEAD
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
=======
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

/**
 * Muunganisho wa database (MySQL / MariaDB).
 *
 * Kwa usalama wa deployment: kama DATABASE_URL haipo, tunatumia thamani
 * chaguo-msingi (localhost) ili:
 *   - Mchakato wa "next build" usianguke (build inaweza kufanyika bila database)
 *   - Ujumbe wa hitilafu uwe wazi wakati wa kuendesha (runtime)
 *
 * Muundo wa DATABASE_URL:
 *   mysql://mtumiaji:nenosiri@anwani:3306/jina_la_db
 */
const databaseUrl =
  process.env.DATABASE_URL || "mysql://root:@127.0.0.1:3306/app_db";

if (!process.env.DATABASE_URL) {
  console.warn(
    "⚠️  TAHADHARI: DATABASE_URL haijawekwa kwenye .env. " +
      "Inatumia thamani chaguo-msingi (mysql://localhost:3306). " +
      "Weka DATABASE_URL sahihi kwenye faili la .env kabla ya kuanza."
  );
}

const globalForDb = globalThis as typeof globalThis & {
  __saidzenMysqlPool?: mysql.Pool;
};

export const pool =
  globalForDb.__saidzenMysqlPool ??
  mysql.createPool({
    uri: databaseUrl,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Rudisha DECIMAL/BIGINT kama string ili kuepuka kupoteza usahihi wa pesa
    decimalNumbers: false,
    timezone: "Z",
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__saidzenMysqlPool = pool;
}

export const db = drizzle(pool);
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
