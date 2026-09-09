import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  connectionTokens,
  users,
  clients,
  voucherProfiles,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { logAudit } from "@/lib/audit";
import { allocatePortalSlug } from "@/lib/portal-slug";
import { insertReturning } from "@/lib/db-mysql";

/**
 * KUTEKELEZA MUUNGANISHO (Inaitwa na ROUTER yenyewe)
 *
 * Baada ya mteja kubandika command kwenye WinBox, router inatumia
 * `/tool fetch` kuita njia hii. Token ndiyo uthibitisho — haiwezi
 * kukisiwa (herufi 48 za nasibu).
 *
 * Inafanya:
 *   1. Kutafuta token inayosubiri
 *   2. Kutengeneza akaunti ya mtumiaji
 *   3. Kusajili router
 *   4. Kutengeneza vifurushi vya vocha
 *   5. Kuweka alama "imeunganishwa"
 */

/** Kusoma body kwa njia imara (RouterOS hutuma form-data, si JSON) */
async function readBody(
  request: NextRequest
): Promise<Record<string, string>> {
  const out: Record<string, string> = {};

  try {
    const contentType = request.headers.get("content-type") || "";
    const raw = await request.text();

    if (!raw) return out;

    // Jaribu JSON kwanza
    if (contentType.includes("application/json") || raw.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(raw);
        for (const [k, v] of Object.entries(parsed)) {
          out[k] = String(v);
        }
        return out;
      } catch {
        // si JSON — endelea kwa form-data
      }
    }

    // Form-encoded: token=abc&vpnIp=10.8.0.2
    const params = new URLSearchParams(raw);
    for (const [k, v] of params.entries()) {
      out[k] = v;
    }
  } catch {
    // endelea na tupu
  }

  return out;
}

/** Kupata IP ya router kutoka kwenye vichwa vya ombi */
function detectRouterIp(request: NextRequest): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "haijulikani"
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await readBody(request);
    const token = (body.token || "").trim();
    const reportedVpnIp = (body.vpnIp || "").trim();
    const reportedRouterIp = (body.routerIp || "").trim();
    const routerOsVersion = (body.routerOsVersion || "").trim();
    const routerBoard = (body.routerBoard || "").trim();
    const routerIdentity = (body.routerIdentity || "").trim();
    const routerPublicKey = (body.publicKey || "").trim();

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token haijapatikana" },
        { status: 400 }
      );
    }

    // Token iliyokamilika inaweza kurudiwa na RouterOS; usitengeneze akaunti mara mbili.
    const [tokenEntry] = await db
      .select()
      .from(connectionTokens)
      .where(eq(connectionTokens.token, token))
      .limit(1);

    if (!tokenEntry) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Token si halali, imetumika tayari, au imeisha muda. Omba command mpya.",
        },
        { status: 400 }
      );
    }

    if (tokenEntry.status === "connected" && tokenEntry.clientId) {
      return NextResponse.json({
        success: true,
        alreadyConnected: true,
        message: "Router hii tayari imesajiliwa kikamilifu.",
        clientId: tokenEntry.clientId,
      });
    }

    if (tokenEntry.status !== "pending" || tokenEntry.expiresAt <= new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: "Token imeisha muda. Rudi kwenye website utengeneze command mpya.",
        },
        { status: 400 }
      );
    }

    const pending = tokenEntry;

    const detectedIp = detectRouterIp(request);
    // Tumia IP iliyotengwa na seva (si ile inayojiripoti, kwa usalama)
    const vpnIp =
      pending.assignedVpnIp && pending.assignedVpnIp !== "0.0.0.0"
        ? pending.assignedVpnIp
        : reportedVpnIp || null;

    // ── 1. Tengeneza akaunti ya mtumiaji ──────────────────────
    const newUser = await insertReturning<typeof users.$inferSelect>(users, {
        name: pending.businessName,
        username: pending.dashboardUsername,
        phone: pending.contactPhone,
      passwordHash: pending.dashboardPasswordHash,
      role: "vendor",
    });

    // ── 2. Sajili router ──────────────────────────────────────
    // Command ya WireGuard huunda saidzen-api kwa password ya token.
    // Hifadhi token ikiwa encrypted ili server itumie API kupitia VPN.
    const { encrypt } = await import("@/lib/encryption");

    const subscriptionEnd = new Date();
    subscriptionEnd.setDate(subscriptionEnd.getDate() + 30); // majaribio ya bure

    // Slug ya kipekee kwa portal ya mteja wa mwisho
    const portalSlug = await allocatePortalSlug(
      pending.businessName || pending.dashboardUsername
    );

    const newClient = await insertReturning<typeof clients.$inferSelect>(clients, {
        userId: newUser.id,
        dashboardUsername: pending.dashboardUsername,
        portalSlug,
        businessName: pending.businessName,
        location: pending.location,
        routerIp: vpnIp || reportedRouterIp || (detectedIp !== "haijulikani" ? detectedIp : "0.0.0.0"),
        routerUsername: "saidzen-api",
        routerPasswordEncrypted: encrypt(token),
        routerPort: 8728,
        vpnIp,
        routerPushToken: token,
        contactPhone: pending.contactPhone,
        status: "active",
      monthlyFee: "50000",
      subscriptionEnd,
    });

    // ── 3. Tengeneza vifurushi vya vocha ──────────────────────
    await db.insert(voucherProfiles).values([
      {
        clientId: newClient.id,
        name: "Saa 1",
        duration: "1h",
        price: "500",
        speedLimit: "2M/2M",
        mikrotikProfile: "Saa_1",
      },
      {
        clientId: newClient.id,
        name: "Saa 2",
        duration: "2h",
        price: "800",
        speedLimit: "3M/3M",
        mikrotikProfile: "Saa_2",
      },
      {
        clientId: newClient.id,
        name: "Saa 6",
        duration: "6h",
        price: "1500",
        speedLimit: "4M/4M",
        mikrotikProfile: "Saa_6",
      },
      {
        clientId: newClient.id,
        name: "Siku 1 (Saa 24)",
        duration: "24h",
        price: "2000",
        speedLimit: "5M/5M",
        mikrotikProfile: "Saa_24",
      },
      {
        clientId: newClient.id,
        name: "Wiki 1",
        duration: "7d",
        price: "8000",
        speedLimit: "5M/5M",
        mikrotikProfile: "Wiki_1",
      },
    ]);

    // ── 4. Weka alama "imeunganishwa" ─────────────────────────
    await db
      .update(connectionTokens)
      .set({
        status: "connected",
        clientId: newClient.id,
        detectedRouterIp: detectedIp,
        routerPublicKey: routerPublicKey || null,
        connectedAt: new Date(),
      })
      .where(eq(connectionTokens.id, pending.id));

    await logAudit({
      userId: newUser.id,
      action: "create_client",
      details: `Router "${pending.businessName}" imejiunganisha yenyewe kwa command (VPN: ${vpnIp || "direct"}, IP: ${detectedIp})`,
      ipAddress: detectedIp,
    });

    return NextResponse.json({
      success: true,
      message:
        "Hongera! Router yako imeunganishwa kikamilifu na SaidZen WiFi.",
      businessName: pending.businessName,
      username: pending.dashboardUsername,
      assignedVpnIp: vpnIp,
      detectedRouterIp: detectedIp,
      clientId: newClient.id,
      portalSlug,
      portalUrl: `/wifi/${portalSlug}`,
      subscriptionEnd: subscriptionEnd.toISOString(),
      voucherProfiles: 5,
      nextStep:
        `Router imetambuliwa: ${routerOsVersion || "version haikutumwa"}${routerBoard ? ` (${routerBoard})` : ""}. Weka nenosiri la API kwenye Mipangilio, kisha anza kuzalisha vocha.`,
      router: {
        osVersion: routerOsVersion || null,
        board: routerBoard || null,
        identity: routerIdentity || null,
        family: routerOsVersion.startsWith("7.") ? "routeros7" : "routeros6-or-older",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kosa la ndani";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
