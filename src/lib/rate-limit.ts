import { RateLimiterMemory } from "rate-limiter-flexible";

/**
 * Rate limiter kwa majaribio ya kuingia (login attempts)
 * Inalinda dhidi ya brute-force attack
 */

// Per IP rate limiter: majaribio 100 kwa dakika 15
export const loginRateLimiterIP = new RateLimiterMemory({
  points: 100,
  duration: 60 * 15,
  blockDuration: 60 * 15,
});

// Per username rate limiter: majaribio 50 kwa dakika 15
export const loginRateLimiterUser = new RateLimiterMemory({
  points: 50,
  duration: 60 * 15,
  blockDuration: 60 * 15,
});

export async function checkLoginRateLimit(
  ip: string,
  identifier: string
): Promise<{ allowed: boolean; message: string; retryAfter?: number }> {
  try {
    const cleanId = (identifier || "").toLowerCase().trim();

    // Check IP limit
    const ipResult = await loginRateLimiterIP.get(ip);
    if (ipResult && ipResult.consumedPoints >= 100) {
      return {
        allowed: false,
        message: `Majaribio mengi mno kutoka kwenye mtandao huu. Subiri dakika ${Math.ceil((ipResult.msBeforeNext / 1000 / 60))}.`,
        retryAfter: ipResult.msBeforeNext,
      };
    }

    // Check username limit
    if (cleanId) {
      const userResult = await loginRateLimiterUser.get(cleanId);
      if (userResult && userResult.consumedPoints >= 50) {
        return {
          allowed: false,
          message: `Akaunti '${identifier}' imefungwa kwa muda kwa majaribio mengi. Subiri dakika ${Math.ceil((userResult.msBeforeNext / 1000 / 60))}.`,
          retryAfter: userResult.msBeforeNext,
        };
      }
    }

    return { allowed: true, message: "" };
  } catch {
    // Fail-open
    return { allowed: true, message: "" };
  }
}

/**
 * Tumia pointi pale TU mtumiaji anapoweka nenosiri lisilo sahihi
 */
export async function recordFailedLogin(ip: string, identifier: string) {
  try {
    const cleanId = (identifier || "").toLowerCase().trim();
    await loginRateLimiterIP.consume(ip).catch(() => {});
    if (cleanId) {
      await loginRateLimiterUser.consume(cleanId).catch(() => {});
    }
  } catch {
    // ignore
  }
}

/**
 * Futa rekodi mtumiaji anapoingia kikamilifu
 */
export async function resetLoginRateLimit(ip: string, identifier: string) {
  try {
    const cleanId = (identifier || "").toLowerCase().trim();
    await loginRateLimiterIP.delete(ip).catch(() => {});
    if (cleanId) {
      await loginRateLimiterUser.delete(cleanId).catch(() => {});
      await loginRateLimiterUser.delete(identifier).catch(() => {});
    }
  } catch {
    // ignore
  }
}
