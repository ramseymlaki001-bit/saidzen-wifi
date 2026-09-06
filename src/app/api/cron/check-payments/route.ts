import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq, lt, and } from "drizzle-orm";
import { disableHotspot } from "@/lib/mikrotik";
import { verifyCronAccess } from "@/lib/cron-auth";

/**
 * CRON JOB: Ukaguzi wa Kila Siku
 *
 * Inazima huduma ya wateja waliochelewa kulipa.
 *
 * Kuendesha kiotomatiki, weka kwenye crontab:
 *   0 0 * * * curl -s -H "x-cron-secret: FUNGUO_YAKO" http://localhost:3000/api/cron/check-payments >> /var/log/saidzen-cron.log 2>&1
 */
export async function GET(request: NextRequest) {
  try {
    // ── ULINZI: hakikisha ni cron halali ──────────────────────
    const access = verifyCronAccess(request);
    if (!access.allowed) {
      return NextResponse.json(
        { success: false, error: access.reason },
        { status: 403 }
      );
    }

    const now = new Date();

    const expiredClients = await db
      .select()
      .from(clients)
      .where(and(eq(clients.status, "active"), lt(clients.subscriptionEnd, now)));

    const disabled = [];

    for (const client of expiredClients) {
      const conn = {
        host: client.vpnIp || client.routerIp,
        username: client.routerUsername,
        encryptedPassword: client.routerPasswordEncrypted,
        port: client.routerPort,
      };

      const result = await disableHotspot(conn);

      await db
        .update(clients)
        .set({ status: "expired" })
        .where(eq(clients.id, client.id));

      disabled.push({
        clientId: client.id,
        businessName: client.businessName,
        mikrotik: result,
      });
    }

<<<<<<< HEAD
    // ── Usafi: futa vikao na token zilizoisha muda (kuzuia jedwali kujaa) ──
    const { sessions, passwordResetTokens, connectionTokens } = await import("@/db/schema");
    const { lt: ltOp } = await import("drizzle-orm");
    let cleanedSessions = 0;
    let cleanedTokens = 0;
    try {
      const r1: any = await db.delete(sessions).where(ltOp(sessions.expiresAt, now));
      cleanedSessions = Number(r1?.[0]?.affectedRows ?? 0);
      const r2: any = await db
        .delete(passwordResetTokens)
        .where(ltOp(passwordResetTokens.expiresAt, now));
      cleanedTokens += Number(r2?.[0]?.affectedRows ?? 0);
      // Token za kuunganisha zilizoisha → weka alama "expired" (usifute, kwa kumbukumbu)
      const { eq: eqOp, and: andOp } = await import("drizzle-orm");
      await db
        .update(connectionTokens)
        .set({ status: "expired" })
        .where(
          andOp(
            eqOp(connectionTokens.status, "pending"),
            ltOp(connectionTokens.expiresAt, now)
          )
        );
    } catch (e) {
      console.error("Cleanup error:", e);
    }

=======
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
    return NextResponse.json({
      success: true,
      job: "check-payments",
      checked: expiredClients.length,
      disabled,
<<<<<<< HEAD
      cleanup: { expiredSessions: cleanedSessions, expiredResetTokens: cleanedTokens },
=======
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
      timestamp: now.toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kosa la ndani";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
