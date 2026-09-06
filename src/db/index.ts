import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

/**
 * Muunganisho wa Database (MySQL)
 *
 * Mfumo unaunganishwa na MySQL kupitia mysql2 na Drizzle ORM.
 */
const databaseUrl =
  process.env.DATABASE_URL ||
  "mysql://saidzen:saidzen_secure_db_pass_2026@127.0.0.1:3306/saidzen_db";

const globalForDb = globalThis as typeof globalThis & {
  __saidzenMysqlPool?: mysql.Pool;
};

export const pool =
  globalForDb.__saidzenMysqlPool ??
  mysql.createPool(databaseUrl);

if (process.env.NODE_ENV !== "production") {
  globalForDb.__saidzenMysqlPool = pool;
}

export const db = drizzle(pool);

export function getConnectionInfo() {
  return {
    host: "127.0.0.1",
    port: 3306,
    database: "saidzen_db",
    ssl: false,
    provider: "MySQL (Local / Cloud)",
  };
}
