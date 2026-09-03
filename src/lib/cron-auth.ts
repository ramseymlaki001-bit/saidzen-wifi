import { NextRequest } from "next/server";

/**
 * ULINZI WA CRON JOBS
 *
 * KWA NINI: Awali njia za cron zilikuwa wazi — mtu yeyote aliyejua anwani
 * angeweza kuzima huduma za wateja WOTE au kusababisha vurugu.
 *
 * Sasa zinahitaji moja ya:
 *   1. Kichwa `x-cron-secret` kinacholingana na CRON_SECRET
 *   2. Au kuitwa kutoka ndani ya seva (localhost)
 *
 * Weka kwenye .env:  CRON_SECRET=funguo-yako-ya-siri
 * Kwenye crontab:
 *   0 0 * * * curl -s -H "x-cron-secret: funguo" http://localhost:3000/api/cron/check-payments
 */
export function verifyCronAccess(request: NextRequest): {
  allowed: boolean;
  reason?: string;
} {
  const secret = process.env.CRON_SECRET;

  // 1. Njia ya kichwa (inapendekezwa)
  const headerSecret = request.headers.get("x-cron-secret");
  if (secret && headerSecret === secret) {
    return { allowed: true };
  }

  // 2. Njia ya query param (rahisi kwa crontab)
  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");
  if (secret && querySecret === secret) {
    return { allowed: true };
  }

  // 3. Katika UZALISHAJI: CRON_SECRET ni LAZIMA (hakuna njia ya mkato)
  //    Hii inazuia mtu yeyote kuzima huduma za wateja wako.
  if (!secret && process.env.NODE_ENV === "production") {
    return {
      allowed: false,
      reason:
        "CRON_SECRET haijawekwa. Weka kwenye .env kwa ulinzi wa kazi za kiotomatiki.",
    };
  }

  // 4. Katika maendeleo tu: ruhusu kutoka localhost
  if (!secret) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "";
    const isLocal =
      ip === "" ||
      ip === "127.0.0.1" ||
      ip === "::1" ||
      ip.startsWith("10.") ||
      ip.startsWith("192.168.") ||
      ip.startsWith("172.");

    if (isLocal) {
      return { allowed: true };
    }
  }

  return {
    allowed: false,
    reason: secret
      ? "Ulinzi umeshindikana. Weka kichwa 'x-cron-secret' sahihi."
      : "Weka CRON_SECRET kwenye .env kwa ulinzi wa kazi za kiotomatiki.",
  };
}
