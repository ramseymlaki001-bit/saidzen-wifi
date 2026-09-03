import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq, and, inArray, isNotNull, sql } from "drizzle-orm";
import { vouchers } from "@/db/schema";
import { getHotspotUsers, testConnection } from "@/lib/mikrotik";
import { verifyCronAccess } from "@/lib/cron-auth";
import { affectedRows } from "@/lib/db-mysql";

/**
 * CRON JOB: Kusawazisha Matumizi Halisi ya Vocha
 *
 * TATIZO: Vocha zinapozalishwa zimehifadhiwa "unused". Mteja akianza
 * kuitumia kwenye hotspot, database haikioni → ripoti za mauzo FEKI.
 *
 * SULUHISHO: Inaenda kwenye kila router kupitia MikroTik API,
 * inapata vocha zinazotumika HALISI, na kuzisasisha kwenye database.
 *
 * Kuendesha kiotomatiki kila dakika 5, weka kwenye crontab:
 *   Kila dakika 5: curl -s -H "x-cron-secret: FUNGUO_YAKO" http://localhost:3000/api/cron/sync-vouchers >> /var/log/saidzen-sync.log
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

    // Pata router zote zilizo active
    const targets = await db
      .select()
      .from(clients)
      .where(eq(clients.status, "active"));

    if (targets.length === 0) {
      return NextResponse.json({
        success: true,
        job: "sync-vouchers",
        message: "Hakuna router za kusawazisha",
        routersChecked: 0,
        routersOnline: 0,
        totalSynced: 0,
      });
    }

    const results = [];
    let routersOnline = 0;
    let totalSynced = 0;

    for (const client of targets) {
      const conn = {
        host: client.vpnIp || client.routerIp,
        username: client.routerUsername,
        encryptedPassword: client.routerPasswordEncrypted,
        port: client.routerPort,
      };

      // Pima kama router iko hewani
      const test = await testConnection(conn);

      if (!test.success) {
        results.push({
          clientId: client.id,
          businessName: client.businessName,
          online: false,
          synced: 0,
        });
        continue;
      }

      routersOnline++;

      // Pata watumiaji WALIO AKTIFI sasa hivi
      let activeUsers: { name: string }[] = [];
      try {
        activeUsers = await getHotspotUsers(conn);
      } catch {
        results.push({
          clientId: client.id,
          businessName: client.businessName,
          online: true,
          synced: 0,
          reason: "Imeshindikana kupata watumiaji",
        });
        continue;
      }

      const activeCodes = activeUsers
        .map((u) => u.name)
        .filter((n) => n && n.length > 0);

      let syncedHere = 0;

      if (activeCodes.length > 0) {
        const res = await db
          .update(vouchers)
          .set({ status: "used", usedAt: new Date() })
          .where(
            and(
              eq(vouchers.clientId, client.id),
              eq(vouchers.status, "unused"),
              inArray(vouchers.code, activeCodes)
            )
          );

        syncedHere = affectedRows(res);
      }

      totalSynced += syncedHere;

      results.push({
        clientId: client.id,
        businessName: client.businessName,
        online: true,
        synced: syncedHere,
        activeOnRouter: activeCodes.length,
      });
    }

    return NextResponse.json({
      success: true,
      job: "sync-vouchers",
      timestamp: now.toISOString(),
      routersChecked: targets.length,
      routersOnline,
      totalSynced,
      results,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kosa la ndani";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
