import { db } from "@/db";
import { eq } from "drizzle-orm";

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
export async function insertReturning<T = any>(
  table: any,
  values: any
): Promise<T> {
  const res: any = await db.insert(table).values(values);
  const insertId = Number(res?.[0]?.insertId ?? res?.insertId ?? 0);

  const rows: any[] = await db
    .select()
    .from(table)
    .where(eq(table.id, insertId))
    .limit(1);

  return rows[0] as T;
}

/** Sasisha rekodi kwa id kisha uirudishe */
export async function updateReturning<T = any>(
  table: any,
  values: any,
  id: number
): Promise<T> {
  await db.update(table).set(values).where(eq(table.id, id));

  const rows: any[] = await db
    .select()
    .from(table)
    .where(eq(table.id, id))
    .limit(1);

  return rows[0] as T;
}

/** Hesabu safu zilizoathiriwa na UPDATE/DELETE ya MySQL */
export function affectedRows(result: any): number {
  return Number(result?.[0]?.affectedRows ?? result?.affectedRows ?? 0);
}
