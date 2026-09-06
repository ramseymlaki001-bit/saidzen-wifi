import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, clients, passwordResetTokens } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import crypto from "crypto";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { logAudit } from "@/lib/audit";

/**
 * KUOMBA KUREJESHA NENOSIRI
 *
 * USALAMA (umebadilishwa):
 * Awali endpoint hii ILIRUDISHA TOKEN moja kwa moja kwenye jibu — hivyo
 * mtu yeyote angeweza kuomba reset kwa username ya MTU MWINGINE na
 * kubadilisha nenosiri lake. Hii ilikuwa hatari kubwa.
 *
 * Sasa:
 *   - Token HAIRUDISHWI katika uzalishaji (production)
 *   - Inarudishwa tu katika maendeleo (NODE_ENV != production)
 *   - Kuna rate limiting (maombi 3 kwa IP kwa saa 1)
 *   - Kila ombi linarekodiwa kwenye kumbukumbu
 *
 * Kwa uzalishaji halisi: unganisha SMS (Africa's Talking) au email
 * ili kutuma token kwa mteja.
 */

const resetLimiter = new RateLimiterMemory({
  points: 3,
  duration: 3600,
  blockDuration: 3600,
});

export async function POST(request: NextRequest) {
  try {
    // ── Rate limit ────────────────────────────────────────────
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    try {
      await resetLimiter.consume(ip);
    } catch {
      return NextResponse.json(
        { error: "Umeomba mara nyingi. Jaribu tena baada ya saa 1." },
        { status: 429 }
      );
    }

    const { identifier } = await request.json();

    if (!identifier) {
      return NextResponse.json(
        { error: "Weka username au IP ya router" },
        { status: 400 }
      );
    }

    const trimmed = String(identifier).trim();

    // ── Tafuta mtumiaji ───────────────────────────────────────
    let userId: number | null = null;
    let userName = "";

    const directUser = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(
        or(eq(users.username, trimmed), eq(users.email, trimmed.toLowerCase()))
      )
      .limit(1);

    if (directUser.length > 0) {
      userId = directUser[0].id;
      userName = directUser[0].name;
    } else {
      const viaClient = await db
        .select({ userId: clients.userId, name: users.name })
        .from(clients)
        .innerJoin(users, eq(clients.userId, users.id))
        .where(eq(clients.routerIp, trimmed))
        .limit(1);

      if (viaClient.length > 0) {
        userId = viaClient[0].userId;
        userName = viaClient[0].name;
      }
    }

    const isProduction = process.env.NODE_ENV === "production";

    // ── Usifichue kama akaunti ipo (usalama) ──────────────────
    if (!userId) {
      return NextResponse.json({
        success: true,
        message:
          "Ikiwa akaunti ipo, maagizo ya kurejesha nenosiri yametumwa. " +
          "Ikiwa hujapata, wasiliana na msaada: 0777 378 300",
      });
    }

    // ── Tengeneza token (saa 1) ───────────────────────────────
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.insert(passwordResetTokens).values({
      userId,
      token,
      expiresAt,
    });

    await logAudit({
      userId,
      action: "password_reset_request",
      details: `Ombi la kurejesha nenosiri kwa "${userName}" kutoka ${ip}`,
      ipAddress: ip,
    });

    // ── Katika uzalishaji: USIRUDISHE token ───────────────────
    if (isProduction) {
      return NextResponse.json({
        success: true,
        message:
          "Ombi limesajiliwa. Kwa sasa mfumo haujatumia SMS/email — " +
          "tafadhali wasiliana na msaada ili kupata nenosiri jipya: 0777 378 300",
        requiresSupport: true,
      });
    }

    // ── Katika maendeleo: rudisha token kwa urahisi ───────────
    return NextResponse.json({
      success: true,
      message:
        "Token imetengenezwa (hali ya maendeleo). Katika uzalishaji hii ingetumwa kwa SMS/email.",
      developmentOnly: true,
      resetToken: token,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kosa la ndani";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
