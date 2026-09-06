import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clients, vouchers, voucherProfiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getHotspotUsers } from "@/lib/mikrotik";

/**
 * KUINGIZA VOCHA — Mteja wa mwisho
 *
 * Mteja aliyenyekwa WiFi anaingiza code ya vocha. Mfumo:
 *   1. Unathibitisha code ipo na haijatumiwa
 *   2. Unakagua kwenye router kama iko aktifi
 *   3. Unamrudishia muda uliobaki na kifurushi chake
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const slug = String(body.slug || "").trim().toLowerCase();
    const code = String(body.code || "").trim().toUpperCase();

    if (!slug || !code) {
      return NextResponse.json(
        { error: "Weka code ya vocha" },
        { status: 400 }
      );
    }

    // ── 1. Pata hotspot ───────────────────────────────────────
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.portalSlug, slug))
      .limit(1);

    if (!client) {
      return NextResponse.json({ error: "Hotspot haipatikani" }, { status: 404 });
    }

    // ── 2. Tafuta vocha ───────────────────────────────────────
    const [voucher] = await db
      .select({
        id: vouchers.id,
        code: vouchers.code,
        password: vouchers.password,
        status: vouchers.status,
        usedAt: vouchers.usedAt,
        createdAt: vouchers.createdAt,
        profileName: voucherProfiles.name,
        profileDuration: voucherProfiles.duration,
        profilePrice: voucherProfiles.price,
        mikrotikProfile: voucherProfiles.mikrotikProfile,
      })
      .from(vouchers)
      .innerJoin(voucherProfiles, eq(vouchers.profileId, voucherProfiles.id))
      .where(and(eq(vouchers.code, code), eq(vouchers.clientId, client.id)))
      .limit(1);

    if (!voucher) {
      return NextResponse.json(
        {
          valid: false,
          error:
            "Vocha haipatikani. Hakikisha umeandika code sahihi, au nunua vocha mpya hapa chini.",
        },
        { status: 404 }
      );
    }

    // ── 3. Hali ya vocha ──────────────────────────────────────
    if (voucher.status === "expired") {
      return NextResponse.json({
        valid: false,
        error: "Vocha hii imepitwa na muda. Nunua nyingine hapa chini.",
      });
    }

    // ── 4. Kagua kwenye router (muda uliobaki halisi) ─────────
    let isActive = false;
    let uptime = "00:00:00";

    try {
      const conn = {
        host: client.vpnIp || client.routerIp,
        username: client.routerUsername,
        encryptedPassword: client.routerPasswordEncrypted,
        port: client.routerPort,
      };

      const activeUsers = await getHotspotUsers(conn);
      const match = activeUsers.find(
        (u) => u.name.toUpperCase() === code
      );
      if (match) {
        isActive = true;
        uptime = match.uptime;
      }
    } catch {
      // Router haipatikani — tunarudi kwenye taarifa za database
    }

    // ── 5. Hesabu muda (kwa kifurushi) ────────────────────────
    const durationHours = parseDurationHours(voucher.profileDuration);
    const usedHours = voucher.status === "used" && voucher.usedAt
      ? (Date.now() - new Date(voucher.usedAt).getTime()) / 3600000
      : 0;
    const remainingHours = Math.max(0, durationHours - usedHours);

    // ── 6. Rekodi kama imetumika ──────────────────────────────
    // MUHIMU: Tunaweka "used" TU ikiwa router inathibitisha mteja
    // anaotumia vocha hiyo SASA HIVI. Awali tulikuwa tunaiweka "used"
    // kwa mtu yeyote anayeANGALIA code tu — hivyo vocha zote zilikuwa
    // zinaonekana "zimetumika" na mteja alipoteza vocha yake.
    if (voucher.status === "unused" && isActive) {
      await db
        .update(vouchers)
        .set({ status: "used", usedAt: new Date() })
        .where(eq(vouchers.id, voucher.id));
    }

    return NextResponse.json({
      valid: true,
      isActive,
      voucher: {
        code: voucher.code,
        password: voucher.password,
        package: voucher.profileName,
        duration: voucher.profileDuration,
        price: Number(voucher.profilePrice),
      },
      session: {
        active: isActive,
        uptime,
        remainingHours: Number(remainingHours.toFixed(1)),
        remainingText:
          remainingHours >= 24
            ? `Siku ${Math.floor(remainingHours / 24)} (saa ${Math.round(remainingHours % 24)})`
            : `Saa ${remainingHours.toFixed(1)}`,
        expired: remainingHours <= 0 && voucher.status === "used",
      },
      message: isActive
        ? "✅ Vocha yako inafanya kazi sasa hivi!"
        : "✅ Vocha ni sahihi. Unganisha kwenye WiFi ukitumia code hii kama password.",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kosa la ndani";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** Kubadilisha muda ("1h", "24h", "7d") kuwa masaa */
function parseDurationHours(d: string): number {
  const s = d.toLowerCase().trim();
  const num = parseFloat(s) || 1;
  if (s.includes("d")) return num * 24;
  if (s.includes("w")) return num * 24 * 7;
  if (s.includes("m")) return num * 24 * 30;
  return num; // "1h" au namba tupu = masaa
}
