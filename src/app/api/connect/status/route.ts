import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { connectionTokens, clients } from "@/db/schema";
import { eq, gt } from "drizzle-orm";

/**
 * KUANGALIA HALI YA MUUNGANISHO
 *
 * Baada ya mteja kubandika command, anafungua URL hii kuona kama
 * router yake imejiunganisha kikamilifu.
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const token = (url.searchParams.get("token") || "").trim();

    if (!token) {
      return NextResponse.json(
        { error: "Token inahitajika" },
        {
          status: 400,
          headers: { "Cache-Control": "no-store, max-age=0" },
        }
      );
    }

    const [entry] = await db
      .select({
        status: connectionTokens.status,
        businessName: connectionTokens.businessName,
        dashboardUsername: connectionTokens.dashboardUsername,
        assignedVpnIp: connectionTokens.assignedVpnIp,
        detectedRouterIp: connectionTokens.detectedRouterIp,
        connectedAt: connectionTokens.connectedAt,
        expiresAt: connectionTokens.expiresAt,
        createdAt: connectionTokens.createdAt,
        clientId: connectionTokens.clientId,
      })
      .from(connectionTokens)
      .where(eq(connectionTokens.token, token))
      .limit(1);

    if (!entry) {
      return NextResponse.json(
        {
          status: "not_found",
          message: "Token haipatikani. Omba command mpya.",
        },
        {
          status: 404,
          headers: { "Cache-Control": "no-store, max-age=0" },
        }
      );
    }

    // Ikiwa imeshaunganishwa, onyesha maelezo ya router
    if (entry.status === "connected" && entry.clientId) {
      const [client] = await db
        .select({
          id: clients.id,
          businessName: clients.businessName,
          routerIp: clients.routerIp,
          vpnIp: clients.vpnIp,
          status: clients.status,
          subscriptionEnd: clients.subscriptionEnd,
        })
        .from(clients)
        .where(eq(clients.id, entry.clientId))
        .limit(1);

      return NextResponse.json({
        status: "connected",
        message: "Imeunganishwa kikamilifu! Sasa unaweza kuingia na kuzalisha vocha.",
        businessName: entry.businessName,
        username: entry.dashboardUsername,
        assignedVpnIp: entry.assignedVpnIp,
        detectedRouterIp: entry.detectedRouterIp,
        connectedAt: entry.connectedAt,
        client,
      }, { headers: { "Cache-Control": "no-store, max-age=0" } });
    }

    // Bado inasubiri
    const isExpired = new Date() > entry.expiresAt;

    return NextResponse.json({
      status: isExpired ? "expired" : "pending",
      message: isExpired
        ? "Muda wa command umeisha. Omba command mpya."
        : "Inasubiri router yako ijiunganishe. Hakikisha umebandika command kwenye WinBox → New Terminal.",
      businessName: entry.businessName,
      username: entry.dashboardUsername,
      assignedVpnIp: entry.assignedVpnIp,
      expiresAt: entry.expiresAt,
      secondsLeft: Math.max(
        0,
        Math.floor((new Date(entry.expiresAt).getTime() - Date.now()) / 1000)
      ),
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kosa la ndani";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
