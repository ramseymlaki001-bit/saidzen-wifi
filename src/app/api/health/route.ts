import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      console.error("Health check failed: DATABASE_URL is not configured");
      return Response.json(
        { ok: false, error: "DATABASE_URL is not configured" },
        { status: 503 }
      );
    }

    await db.execute(sql`select 1`);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Health check failed:", error);
    return Response.json({ ok: false }, { status: 500 });
  }
}
