import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const checkedAt = new Date().toISOString();

  try {
    if (!process.env.DATABASE_URL) {
      console.error("Health check failed: DATABASE_URL is not configured");
      return Response.json(
        { ok: false, status: "degraded", database: "unavailable", checkedAt },
        { status: 503, headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }

    await db.execute(sql`select 1`);
    return Response.json(
      { ok: true, status: "ok", database: "ok", checkedAt },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("Health check failed:", error);
    return Response.json(
      { ok: false, status: "degraded", database: "unavailable", checkedAt },
      {
        status: 503,
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  }
}
