import { NextResponse } from "next/server";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const list = await db
      .select({
        id: clients.id,
        businessName: clients.businessName,
        portalSlug: clients.portalSlug,
        dashboardUsername: clients.dashboardUsername,
        location: clients.location,
        routerIp: clients.routerIp,
        status: clients.status,
      })
      .from(clients)
      .where(eq(clients.status, "active"));

    return NextResponse.json(list);
  } catch (err) {
    console.error("Public hotspots list error:", err);
    return NextResponse.json([]);
  }
}
