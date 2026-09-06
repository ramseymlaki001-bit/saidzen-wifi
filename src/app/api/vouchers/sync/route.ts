import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { vouchers, clients } from "@/db/schema";
import { eq, and, inArray, isNull, ne } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { getHotspotUsers, testConnection } from "@/lib/mikrotik";

/**
 * KUSAWAZISHA (SYNC) MATUMIZI HALISI YA VOCHA
 *
 * TATIZO KUBWA: Vocha zinapozalishwa zinahifadhiwa kama "unused". Mteja
 * akianza kutumia vocha kwenye hotspot, database haikuoni — hivyo ripoti
 * za mauzo zilikuwa FEKI.
 *
 * SULUHISHO: Hii inaenda kwenye router kupitia MikroTik API
 * (/ip/hotspot/active/print na /ip/hotspot/user/print), inapata vocha
 * zinazotumika HALISI, na kuzisasisha kwenye database.
 *
 * Inaweza kuitwa na:
 *   - Kitufe kwenye dashboard ("Sawazisha Sasa")
 *   - Cron job (kila dakika 5)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const url = new URL(request.url);

    // Lazima uwe umeingia (njia ya cron iko kwenye /api/cron/sync-vouchers)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientId = url.searchParams.get("clientId");

    // ── 1. Pata router za kusawazisha ──────────────────────────
    let targets;

    if (clientId) {
      // ── USALAMA: hakikisha router ni ya mtumiaji huyu ──────
      const [one] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, parseInt(clientId)))
        .limit(1);

      if (!one) {
        return NextResponse.json(
          { error: "Router haipatikani" },
          { status: 404 }
        );
      }

      // Vendor anaruhusiwa kusawazisha router zake pekee
      if (session.role === "vendor" && one.userId !== session.userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      targets = [one];
    } else if (session.role === "vendor") {
      // Vendor: router zake tu
      targets = await db
        .select()
        .from(clients)
        .where(eq(clients.userId, session.userId));
    } else {
      // Admin: router zote
      targets = await db.select().from(clients);
    }

    if (targets.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Hakuna router za kusawazisha",
        routersChecked: 0,
        routersOnline: 0,
        totalSynced: 0,
        results: [],
      });
    }

    const results = [];
    let totalSynced = 0;
    let routersOnline = 0;

    // ── 2. Kwa kila router, angalia vocha halisi ───────────────
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
          reason: "Router haiko hewani",
        });
        continue;
      }

      routersOnline++;

      // Pata watumiaji WALIO AKTIFI sasa hivi
      let activeUsers: { name: string; profile: string; uptime: string; address: string }[] = [];
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

      // Jina za vocha zinazotumika sasa hivi
      const activeCodes = activeUsers
        .map((u) => u.name)
        .filter((n) => n && n.length > 0);

      let syncedHere = 0;

      if (activeCodes.length > 0) {
        // ── 3. Sasisha vocha zinazotumika ──────────────────────
        // MySQL haina RETURNING — tunachukua orodha kabla ya kusasisha
        const updated = await db
          .select({ id: vouchers.id, code: vouchers.code })
          .from(vouchers)
          .where(
            and(
              eq(vouchers.clientId, client.id),
              eq(vouchers.status, "unused"),
              inArray(vouchers.code, activeCodes)
            )
          );

        if (updated.length > 0) {
          await db
            .update(vouchers)
            .set({ status: "used", usedAt: new Date() })
            .where(
              and(
                eq(vouchers.clientId, client.id),
                eq(vouchers.status, "unused"),
                inArray(vouchers.code, activeCodes)
              )
            );
        }

        syncedHere = updated.length;

        // ── 4. Rekebisha vocha zilizoandikwa "used" kimakosa ────
        // (zinazoonekana active kwenye router lakini "unused" hapa)
        if (updated.length > 0) {
          // Wahusisho wa kina kwenye log ya audit kwa ukaguzi
          const { logAudit } = await import("@/lib/audit");
          await logAudit({
            ...(session?.userId ? { userId: session.userId } : {}),
            action: "update_client",
            details: `Router "${client.businessName}": vocha ${updated.length} zimesawazishwa kuwa 'used' (${updated.slice(0, 5).map((v: { code: string }) => v.code).join(", ")}${updated.length > 5 ? "..." : ""})`,
          });
        }
      }

      totalSynced += syncedHere;

      results.push({
        clientId: client.id,
        businessName: client.businessName,
        online: true,
        synced: syncedHere,
        activeUsersOnRouter: activeUsers.length,
        activeCodes: activeCodes.slice(0, 20),
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      routersChecked: targets.length,
      routersOnline,
      totalSynced,
      results,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kosa la ndani";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
