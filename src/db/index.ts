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
