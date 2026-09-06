import { db } from "@/db";
import { eq } from "drizzle-orm";

<<<<<<< HEAD
/* eslint-disable @typescript-eslint/no-explicit-any */

/** Ingiza rekodi moja na uirudishe */
=======
/**
 * WASAIDIZI WA MYSQL
 *
 * MySQL haina `RETURNING` (kama PostgreSQL). Wasaidizi hawa wanaziba pengo:
 *   - insertReturning: inaingiza rekodi kisha inairudisha kwa kutumia insertId
 *   - updateReturning: inasasisha kisha inarudisha rekodi mpya
 *   - affectedRows:    inahesabu safu zilizoathiriwa na UPDATE/DELETE
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Ingiza rekodi moja na uirudishe (badala ya .returning() ya PostgreSQL) */
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
export async function insertReturning<T = any>(
  table: any,
  values: any
): Promise<T> {
<<<<<<< HEAD
  try {
    // Katika PostgreSQL, .returning() inafanya kazi moja kwa moja
    const rows: any = await (db.insert(table) as any).values(values).returning();
    return rows[0] as T;
  } catch {
    // Katika MySQL, chukua insertId kisha select
    const res: any = await db.insert(table).values(values);
    const insertId = Number(res?.[0]?.insertId ?? res?.insertId ?? 0);
    const rows: any[] = await db
      .select()
      .from(table)
      .where(eq(table.id, insertId))
      .limit(1);
    return rows[0] as T;
  }
=======
  const res: any = await db.insert(table).values(values);
  const insertId = Number(res?.[0]?.insertId ?? res?.insertId ?? 0);

  const rows: any[] = await db
    .select()
    .from(table)
    .where(eq(table.id, insertId))
    .limit(1);

  return rows[0] as T;
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
}

/** Sasisha rekodi kwa id kisha uirudishe */
export async function updateReturning<T = any>(
  table: any,
  values: any,
  id: number
): Promise<T> {
<<<<<<< HEAD
  try {
    const rows: any = await (db.update(table) as any).set(values).where(eq(table.id, id)).returning();
    if (rows && rows.length > 0) return rows[0] as T;
  } catch {
    // fallback ya kawaida
  }
  await db.update(table).set(values).where(eq(table.id, id));
=======
  await db.update(table).set(values).where(eq(table.id, id));

>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
  const rows: any[] = await db
    .select()
    .from(table)
    .where(eq(table.id, id))
    .limit(1);
<<<<<<< HEAD
  return rows[0] as T;
}

/** Hesabu safu zilizoathiriwa */
export function affectedRows(result: any): number {
  return Number(
    result?.rowCount ??
      result?.[0]?.affectedRows ??
      result?.affectedRows ??
      0
  );
=======

  return rows[0] as T;
}

/** Hesabu safu zilizoathiriwa na UPDATE/DELETE ya MySQL */
export function affectedRows(result: any): number {
  return Number(result?.[0]?.affectedRows ?? result?.affectedRows ?? 0);
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
}
