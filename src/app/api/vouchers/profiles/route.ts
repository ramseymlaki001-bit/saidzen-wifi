import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { voucherProfiles, clients } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const clientId = url.searchParams.get("clientId");

    if (session.role === "vendor") {
      // Vendor: get profiles from ALL their routers (multi-router support)
      const vendorClients = await db
        .select({ id: clients.id })
        .from(clients)
        .where(eq(clients.userId, session.userId));

      const clientIds = vendorClients.map((c) => c.id);

      if (clientIds.length === 0) {
        return NextResponse.json([]);
      }

      if (clientId && clientIds.includes(parseInt(clientId))) {
        // Specific router's profiles
        const profiles = await db
          .select()
          .from(voucherProfiles)
          .where(eq(voucherProfiles.clientId, parseInt(clientId)));
        return NextResponse.json(profiles);
      }

      // All profiles from all vendor's routers
      const profiles = await db
        .select()
        .from(voucherProfiles)
        .where(inArray(voucherProfiles.clientId, clientIds));
      return NextResponse.json(profiles);
    }

    // Admin
    if (clientId) {
      const profiles = await db
        .select()
        .from(voucherProfiles)
        .where(eq(voucherProfiles.clientId, parseInt(clientId)));
      return NextResponse.json(profiles);
    }

    const profiles = await db.select().from(voucherProfiles);
    return NextResponse.json(profiles);
  } catch {
    return NextResponse.json({ error: "Kosa la ndani" }, { status: 500 });
  }
}
