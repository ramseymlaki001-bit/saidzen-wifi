import { NextResponse } from "next/server";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

/**
 * ROUTER ZANGU — Vendor anaona router zake pekee
 *
 * Inatumika kwenye Mipangilio ya vendor ili aweze kuweka API credentials
 * za kila router (hasa zile zilizojiunga kwa command ya /connect, ambazo
 * huanza bila nenosiri la API).
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fields = {
      id: clients.id,
      businessName: clients.businessName,
      portalSlug: clients.portalSlug,
      routerIp: clients.routerIp,
      routerUsername: clients.routerUsername,
      routerPort: clients.routerPort,
      vpnIp: clients.vpnIp,
      status: clients.status,
      subscriptionEnd: clients.subscriptionEnd,
      location: clients.location,
    };

    // Admin anaweza kuona zote; vendor anaona zake pekee
    const rows =
      session.role === "admin"
        ? await db.select(fields).from(clients)
        : await db
            .select(fields)
            .from(clients)
            .where(eq(clients.userId, session.userId));

    return NextResponse.json(rows);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kosa la ndani";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
