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

    return NextResponse.json({
      success: true,
      job: "check-payments",
      checked: expiredClients.length,
      disabled,
      timestamp: now.toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kosa la ndani";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
