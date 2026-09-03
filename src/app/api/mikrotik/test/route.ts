import { NextRequest, NextResponse } from "next/server";
import { testConnection } from "@/lib/mikrotik";
import { encrypt } from "@/lib/encryption";
import { RateLimiterMemory } from "rate-limiter-flexible";

/**
 * Kupima muunganisho na router.
 *
 * USALAMA: Kuna rate limiting ili kuzuia mtu kutumia endpoint hii
 * kupima IP za ndani za mtandao wetu (SSRF).
 */
const testLimiter = new RateLimiterMemory({
  points: 10,
  duration: 600,
  blockDuration: 600,
});

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    try {
      await testLimiter.consume(ip);
    } catch {
      return NextResponse.json(
        { error: "Umejaribu mara nyingi. Subiri dakika 10." },
        { status: 429 }
      );
    }

    const { host, username = "admin", password = "", port = 8728 } =
      await request.json();

    if (!host) {
      return NextResponse.json(
        { error: "Tafadhali weka IP ya router au VPN" },
        { status: 400 }
      );
    }

    // Zuia kupima anwani nyeti za ndani (SSRF)
    const h = String(host).trim();
    const blocked = [
      "localhost",
      "127.0.0.1",
      "::1",
      "169.254.169.254", // metadata ya cloud
      "0.0.0.0",
    ];
    if (blocked.includes(h.toLowerCase())) {
      return NextResponse.json(
        { error: "Anwani hii hairuhusiwi" },
        { status: 400 }
      );
    }

    const result = await testConnection({
      host: h,
      username: String(username).trim(),
      encryptedPassword: encrypt(String(password)),
      port: parseInt(String(port), 10) || 8728,
    });

    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kosa la kupima muunganisho";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
