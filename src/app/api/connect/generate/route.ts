import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { connectionTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, getSession } from "@/lib/auth";
import {
  allocateVpnIp,
  buildMikrotikCommand,
  buildDirectApiCommand,
  generateConnectToken,
} from "@/lib/connect-command";
import { getWireguardConfig, getAppUrl } from "@/lib/settings";
import { RateLimiterMemory } from "rate-limiter-flexible";

// Zuia flood ya token: 5 kwa IP kwa saa 1
const connectLimiter = new RateLimiterMemory({
  points: 5,
  duration: 3600,
  blockDuration: 3600,
});

/**
 * KUZALISHA COMMAND YA KUUNGANISHA
 *
 * Mteja anaweka taarifa zake, na anapata command moja ya
 * kunakili-na-kubandika kwenye WinBox → New Terminal.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      businessName,
      dashboardUsername,
      dashboardPassword,
      location,
      phone,
      mode = "wireguard",
    } = body;

    // ── Rate limit ────────────────────────────────────────────
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    try {
      await connectLimiter.consume(ip);
    } catch {
      return NextResponse.json(
        { error: "Umeomba command mara nyingi. Jaribu tena baada ya saa 1." },
        { status: 429 }
      );
    }

    if (!businessName || !dashboardUsername || !dashboardPassword) {
      return NextResponse.json(
        {
          error:
            "Tafadhali jaza: Jina la Biashara, Username, na Nenosiri la Tovuti",
        },
        { status: 400 }
      );
    }

    if (mode !== "wireguard" && mode !== "direct") {
      return NextResponse.json(
        { error: "Njia ya kuunganisha si sahihi." },
        { status: 400 }
      );
    }

    const cleanUsername = String(dashboardUsername)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");

    // Hakikisha username haijatumiwa
    const { users } = await import("@/db/schema");
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, cleanUsername))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: `Username "${dashboardUsername}" tayari imetumika. Chagua nyingine.` },
        { status: 409 }
      );
    }

    // Futa token ya zamani ya username hii ili kuruhusu mpya
    await db
      .delete(connectionTokens)
      .where(eq(connectionTokens.dashboardUsername, cleanUsername));

    // Tengwa IP ya VPN (kwa WireGuard mode)
    let vpnIp = "";
    if (mode === "wireguard") {
      const wireguardConfig = await getWireguardConfig();
      if (!wireguardConfig.configured) {
        return NextResponse.json(
          {
            error:
              "WireGuard ya seva haijasanidiwa. Weka WIREGUARD_SERVER_PUBLIC_KEY na WIREGUARD_SERVER_ENDPOINT kwanza.",
          },
          { status: 503 }
        );
      }
      try {
        vpnIp = await allocateVpnIp();
      } catch (err) {
        return NextResponse.json(
          {
            error:
              err instanceof Error ? err.message : "Imeshindikana kutenga IP ya VPN",
          },
          { status: 500 }
        );
      }
    }

    const token = generateConnectToken();
    const passwordHash = await hashPassword(dashboardPassword);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // masaa 24

    const session = await getSession();

    await db.insert(connectionTokens).values({
      token,
      businessName: String(businessName).trim(),
      location: location || null,
      contactPhone: phone || null,
      dashboardUsername: cleanUsername,
      dashboardPasswordHash: passwordHash,
      assignedVpnIp: vpnIp || "0.0.0.0",
      status: "pending",
      expiresAt,
      createdBy: session?.userId || null,
    });

    // Zalisha command
    const built =
      mode === "wireguard"
        ? await buildMikrotikCommand({ token, vpnIp })
        : await buildDirectApiCommand({ token });

    const cfg = built.cfg;
    const appUrl = getAppUrl();

    return NextResponse.json({
      success: true,
      token,
      command: built.command,
      mode,
      assignedVpnIp: vpnIp || null,
      statusUrl: `${appUrl}/connect/status?token=${token}`,
      expiresAt: expiresAt.toISOString(),
      serverInfo: {
        endpoint: cfg.endpoint,
        publicKeySet: cfg.publicKeySet,
        endpointSet: cfg.endpointSet,
        configured: cfg.configured,
        businessPhone: cfg.businessPhone,
      },
      instructions: [
        "Nakili command yote kwa kutumia kitufe cha NAKILI",
        "Fungua WinBox, ingia kwenye router yako",
        "Bonyeza New Terminal",
        "Bandika (Ctrl+V) kisha bonyeza Enter",
        "Rudi hapa — hali itabadilika kuwa IMEUNGANISHWA chini ya sekunde 10",
      ],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kosa la ndani";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
