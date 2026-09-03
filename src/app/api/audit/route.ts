import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";

/**
 * KUMBUKUMBU ZA MATENDO (Audit Log) — Admin pekee
 *
 * Hii inaunganisha sehemu zote za mfumo: kila kitendo (kuingia, kuzalisha
 * vocha, kuzima router, kurekodi malipo, kusawazisha vocha) kinarekodiwa
 * hapa. Admin anaona "nani alifanya nini, lini, kutoka wapi".
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 200);
    const action = url.searchParams.get("action");
    const days = parseInt(url.searchParams.get("days") || "30", 10);

    const since = new Date();
    since.setDate(since.getDate() - days);

    const conditions = [gte(auditLogs.createdAt, since)];
    if (action) conditions.push(eq(auditLogs.action, action as never));

    const logs = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        details: auditLogs.details,
        ipAddress: auditLogs.ipAddress,
        createdAt: auditLogs.createdAt,
        userName: users.name,
        userRole: users.role,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);

    // Hesabu kwa aina ya tendo
    const byAction = await db
      .select({
        action: auditLogs.action,
        count: sql<number>`count(*)`,
      })
      .from(auditLogs)
      .where(gte(auditLogs.createdAt, since))
      .groupBy(auditLogs.action);

    // Jaribio lililoshindwa la kuingia (usalama)
    const [failedLogins] = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.action, "failed_login"),
          gte(auditLogs.createdAt, since)
        )
      );

    return NextResponse.json({
      success: true,
      logs,
      byAction,
      failedLogins: failedLogins.count,
      total: logs.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kosa la ndani";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
