import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq, ne } from "drizzle-orm";

/**
 * KUTENGENEZA SLUG YA KIKEPEKEE YA PORTAL
 *
 * KWA NINI: Awali router zote za mmiliki mmoja zilikuwa na
 * `dashboard_username` moja — hivyo portal ya mteja wa mwisho
 * (/wifi/<slug>) ilichagua router isiyo sahihi na mteja hakupata vocha.
 *
 * Sasa kila router ina slug yake ya kipekee:
 *   juma_wifi, juma_wifi-2, juma_wifi-3, ...
 */
export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "") || "hotspot"
  );
}

/** Tafuta slug ambayo haijatumiwa (inaongeza -2, -3... ikiwa inahitajika) */
export async function allocatePortalSlug(
  base: string,
  excludeId?: number
): Promise<string> {
  const clean = slugify(base);
  let candidate = clean;
  let n = 2;

  for (;;) {
    const rows = excludeId
      ? await db
          .select({ id: clients.id })
          .from(clients)
          .where(eq(clients.portalSlug, candidate))
          .limit(5)
      : await db
          .select({ id: clients.id })
          .from(clients)
          .where(eq(clients.portalSlug, candidate))
          .limit(5);

    const taken = rows.some((r) => r.id !== excludeId);
    if (!taken) return candidate;

    candidate = `${clean}-${n}`;
    n += 1;
    if (n > 500) return `${clean}-${Date.now()}`;
  }
}
