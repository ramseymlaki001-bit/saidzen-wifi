import { RateLimiterMemory } from "rate-limiter-flexible";

/**
 * Rate limiter kwa kujaribu kuingia (login attempts)
 * Inazuia mtu kujaribu maru elfu kwa sekunde (brute force)
 *
 * Mikataba:
 * - 10 attempts kwa dakika 15 kwa IP moja
 * - 5 attempts kwa dakika 60 kwa username moja
 */

// Per IP rate limiter
export const loginRateLimiterIP = new RateLimiterMemory({
  points: 10, // max attempts
  duration: 60 * 15, // 15 minutes
  blockDuration: 60 * 30, // block for 30 minutes after max attempts
});

// Per username rate limiter
export const loginRateLimiterUser = new RateLimiterMemory({
  points: 5, // max attempts per username
  duration: 60 * 60, // 1 hour
  blockDuration: 60 * 60, // block for 1 hour
});

export async function checkLoginRateLimit(
  ip: string,
  identifier: string
): Promise<{ allowed: boolean; message: string; retryAfter?: number }> {
  try {
    // Check IP limit
    const ipResult = await loginRateLimiterIP.get(ip);
    if (ipResult && ipResult.consumedPoints >= 10) {
      return {
        allowed: false,
        message: `Umepita idadi ya majaribio. Subiri dakika ${Math.ceil((ipResult.msBeforeNext / 1000 / 60))}.`,
        retryAfter: ipResult.msBeforeNext,
      };
    }

    // Check username limit
    const userResult = await loginRateLimiterUser.get(identifier);
    if (userResult && userResult.consumedPoints >= 5) {
      return {
        allowed: false,
        message: `Akaunti '${identifier}' imefungwa kwa majaribio mengi. Subiri dakika ${Math.ceil((userResult.msBeforeNext / 1000 / 60))}.`,
        retryAfter: userResult.msBeforeNext,
      };
    }

    // Consume points
    await loginRateLimiterIP.consume(ip);
    await loginRateLimiterUser.consume(identifier);

    return { allowed: true, message: "" };
  } catch (err: any) {
    if (err instanceof Error && err.message.includes("Too Many Requests")) {
      return {
        allowed: false,
        message: "Majaribio mengi sana. Tafadhali subiri kabla ya kujaribu tena.",
        retryAfter: (err as any).msBeforeNext || 60000,
      };
    }
    // On error, allow (fail open for availability)
    return { allowed: true, message: "" };
  }
}
