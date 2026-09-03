import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, sessions } from "@/db/schema";
import { eq, ne } from "drizzle-orm";
import { getSession, verifyPassword, hashPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { RateLimiterMemory } from "rate-limiter-flexible";

/**
 * KUBADILISHA NENOSIRI (Admin na Vendor)
 *
 * Inatumika na:
 *   - Admin: /dashboard/settings → "🔑 Badilisha Nenosiri Lako"
 *   - Vendor: /vendor/settings → "🔒 Badilisha Nenosiri"
 *
 * Ulinzi:
 *   - Lazima uwe umeingia (session)
 *   - Lazima uthibitishe nenosiri la sasa
 *   - Rate limit: majaribio 5 kwa dakika 15
 *   - Kila mabadiliko yanarekodiwa kwenye kumbukumbu
 *   - Vikao vyote vingine vinafutwa (usalama)
 */

const pwLimiter = new RateLimiterMemory({
  points: 5,
  duration: 900,
  blockDuration: 900,
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Rate limit ────────────────────────────────────────────
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    try {
      await pwLimiter.consume(ip);
    } catch {
      return NextResponse.json(
        {
          error:
            "Umejaribu mara nyingi sana. Subiri dakika 15 kabla ya kujaribu tena.",
        },
        { status: 429 }
      );
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Nenosiri la sasa na jipya vinahitajika" },
        { status: 400 }
      );
    }

    // ── Thibitisha urefu wa nenosiri jipya ────────────────────
    if (String(newPassword).length < 6) {
      return NextResponse.json(
        { error: "Nenosiri jipya liwe na herufi 6 au zaidi" },
        { status: 400 }
      );
    }

    // ── Pata mtumiaji ─────────────────────────────────────────
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "Mtumiaji hajapatikana" }, { status: 404 });
    }

    // ── Thibitisha nenosiri la sasa ───────────────────────────
    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      await logAudit({
        userId: session.userId,
        action: "failed_login",
        details: `Jaribio la kubadilisha nenosiri lilishindikana (nenosiri la sasa si sahihi) kutoka ${ip}`,
        ipAddress: ip,
      });
      return NextResponse.json(
        { error: "Nenosiri la sasa si sahihi" },
        { status: 401 }
      );
    }

    // ── Usiruhusu nenosiri lile lile ──────────────────────────
    const isSame = await verifyPassword(newPassword, user.passwordHash);
    if (isSame) {
      return NextResponse.json(
        { error: "Nenosiri jipya lisifanane na la zamani" },
        { status: 400 }
      );
    }

    // ── Sasisha nenosiri ──────────────────────────────────────
    const newHash = await hashPassword(newPassword);
    await db
      .update(users)
      .set({ passwordHash: newHash })
      .where(eq(users.id, session.userId));

    // ── Futa vikao vingine vyote (usalama) ────────────────────
    // Vikao vya kifaa vingine vitaondolewa; hiki cha sasa kinabaki.
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      const currentToken = cookieStore.get("session_token")?.value;
      if (currentToken) {
        await db
          .delete(sessions)
          .where(ne(sessions.token, currentToken));
      }
    } catch {
      /* usalama wa ziada — usivunje mtiririko */
    }

    // ── Rekodi kwenye kumbukumbu ──────────────────────────────
    await logAudit({
      userId: session.userId,
      action: "change_password",
      details: `Nenosiri limebadilishwa na ${user.name} (${user.role}) kutoka ${ip}`,
      ipAddress: ip,
    });

    return NextResponse.json({
      success: true,
      message:
        "Nenosiri limebadilishwa kikamilifu. Vikao vya vifaa vingine vimeondolewa.",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kosa la ndani";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
