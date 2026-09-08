import { NextResponse } from "next/server";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { and, eq, isNotNull } from "drizzle-orm";

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
        subscriptionEnd: clients.subscriptionEnd,
      })
      .from(clients)
      .where(and(eq(clients.status, "active"), isNotNull(clients.portalSlug)))
      .orderBy(clients.businessName);

    const activePortals = list.filter(
      (client) => !!client.portalSlug && new Date(client.subscriptionEnd) > new Date()
    );

    return NextResponse.json(
      activePortals.map((client) => ({
        id: client.id,
        businessName: client.businessName,
        portalSlug: client.portalSlug,
        dashboardUsername: client.dashboardUsername,
        location: client.location,
        routerIp: client.routerIp,
        status: client.status,
      }))
    );
  } catch (err) {
    console.error("Public hotspots list error:", err);
    return NextResponse.json([]);
  }
}
