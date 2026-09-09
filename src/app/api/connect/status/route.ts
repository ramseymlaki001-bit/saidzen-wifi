import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { connectionTokens, clients } from "@/db/schema";
import { eq } from "drizzle-orm";

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

    let [entry] = await db
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

    // Ikiwa callback ilitengeneza client lakini ikashindwa kuweka token status,
    // tumia routerPushToken ileile kurekebisha hali bila kuhitaji command mpya.
    if (entry.status === "pending" && !entry.clientId) {
      try {
        const [registeredClient] = await db
          .select({ id: clients.id })
          .from(clients)
          .where(eq(clients.routerPushToken, token))
          .limit(1);

        if (registeredClient) {
          const connectedAt = new Date();
          await db
            .update(connectionTokens)
            .set({
              status: "connected",
              clientId: registeredClient.id,
              connectedAt,
            })
            .where(eq(connectionTokens.token, token));

          entry = {
            ...entry,
            status: "connected",
            clientId: registeredClient.id,
            connectedAt,
          };
        }
      } catch (reconcileError) {
        console.error("Connection status reconciliation failed", {
          token: `${token.slice(0, 8)}...`,
          error: reconcileError,
        });
      }
    }

    // Ikiwa imeshaunganishwa, token tayari ina taarifa zote zinazohitajika
    // na ukurasa wa kuunganisha. Usifanye query ya ziada ya clients hapa:
    // status endpoint inapaswa kufanya kazi hata schema ya clients ikiwa nyuma
    // ya schema ya token.
    if (entry.status === "connected" && entry.clientId) {
      return NextResponse.json({
        status: "connected",
        message: "Imeunganishwa kikamilifu! Sasa unaweza kuingia na kuzalisha vocha.",
        businessName: entry.businessName,
        username: entry.dashboardUsername,
        assignedVpnIp: entry.assignedVpnIp,
        detectedRouterIp: entry.detectedRouterIp,
        connectedAt: entry.connectedAt,
        clientId: entry.clientId,
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
    console.error("Connection status failed", {
      error: err,
      url: request.url,
    });
    return NextResponse.json(
      { status: "error", error: "Hali ya muunganisho haijasomeka. Jaribu refresh." },
      { status: 503, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }
}
