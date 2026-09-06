import { RateLimiterMemory } from "rate-limiter-flexible";

/**
<<<<<<< HEAD
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
=======
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
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
});

export async function checkLoginRateLimit(
  ip: string,
  identifier: string
): Promise<{ allowed: boolean; message: string; retryAfter?: number }> {
  try {
<<<<<<< HEAD
    const cleanId = (identifier || "").toLowerCase().trim();

    // Check IP limit
    const ipResult = await loginRateLimiterIP.get(ip);
    if (ipResult && ipResult.consumedPoints >= 100) {
      return {
        allowed: false,
        message: `Majaribio mengi mno kutoka kwenye mtandao huu. Subiri dakika ${Math.ceil((ipResult.msBeforeNext / 1000 / 60))}.`,
=======
    // Check IP limit
    const ipResult = await loginRateLimiterIP.get(ip);
    if (ipResult && ipResult.consumedPoints >= 10) {
      return {
        allowed: false,
        message: `Umepita idadi ya majaribio. Subiri dakika ${Math.ceil((ipResult.msBeforeNext / 1000 / 60))}.`,
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
        retryAfter: ipResult.msBeforeNext,
      };
    }

    // Check username limit
<<<<<<< HEAD
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
=======
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
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
