import { db } from "@/db";
import { eq } from "drizzle-orm";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Ingiza rekodi moja na uirudishe */
export async function insertReturning<T = any>(
  table: any,
  values: any,
  database: any = db
): Promise<T> {
  try {
    // MySQL haina returning; fallback ya insertId iko hapa chini.
    const rows: any = await (database.insert(table) as any).values(values).returning();
    return rows[0] as T;
  } catch {
    // Katika MySQL, chukua insertId kisha select
    const res: any = await database.insert(table).values(values);
    const insertId = Number(res?.[0]?.insertId ?? res?.insertId ?? 0);
    const rows: any[] = await database
      .select()
      .from(table)
      .where(eq(table.id, insertId))
      .limit(1);
    return rows[0] as T;
  }
}

/** Sasisha rekodi kwa id kisha uirudishe */
export async function updateReturning<T = any>(
  table: any,
  values: any,
  id: number
): Promise<T> {
  try {
    const rows: any = await (db.update(table) as any).set(values).where(eq(table.id, id)).returning();
    if (rows && rows.length > 0) return rows[0] as T;
  } catch {
    // MySQL fallback ya kawaida.
  }
  await db.update(table).set(values).where(eq(table.id, id));
  const rows: any[] = await db
    .select()
    .from(table)
    .where(eq(table.id, id))
    .limit(1);
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
}
