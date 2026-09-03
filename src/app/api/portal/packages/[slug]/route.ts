import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clients, voucherProfiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getWireguardConfig } from "@/lib/settings";

/**
 * VIFURUSHI VYA HOTSPOT — Mteja wa mwisho
 *
 * Hii ni API ya UMMA (haitaji kuingia). Mteja aliyenyekwa WiFi anafungua
 * ukurasa wa portal na kuona vifurushi vinavyopatikana kwenye hotspot hiyo.
 *
 * Slug = dashboard_username ya router (kipekee kwa kila hotspot).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const cleanSlug = decodeURIComponent(slug).trim().toLowerCase();

    if (!cleanSlug) {
      return NextResponse.json(
        { error: "Taja hotspot (slug)" },
        { status: 400 }
      );
    }

    // Pata router kwa slug
    const [client] = await db
      .select({
        id: clients.id,
        businessName: clients.businessName,
        location: clients.location,
        contactPhone: clients.contactPhone,
        dashboardUsername: clients.dashboardUsername,
        portalSlug: clients.portalSlug,
        status: clients.status,
        subscriptionEnd: clients.subscriptionEnd,
      })
      .from(clients)
      .where(eq(clients.portalSlug, cleanSlug))
      .limit(1);

    if (!client) {
      return NextResponse.json(
        { error: "Hotspot haipatikani. Hakikisha anwani ni sahihi." },
        { status: 404 }
      );
    }

    // Ikiwa huduma imezimwa (ada haijalipiwa), mteja asiweze kununua
    const isSuspended =
      client.status !== "active" || new Date() > client.subscriptionEnd;

    // Vifurushi vinavyopatikana
    const packages = await db
      .select({
        id: voucherProfiles.id,
        name: voucherProfiles.name,
        duration: voucherProfiles.duration,
        price: voucherProfiles.price,
        speedLimit: voucherProfiles.speedLimit,
      })
      .from(voucherProfiles)
      .where(and(eq(voucherProfiles.clientId, client.id)))
      .orderBy(voucherProfiles.price);

    const cfg = await getWireguardConfig();

    return NextResponse.json({
      success: true,
      hotspot: {
        id: client.id,
        name: client.businessName,
        location: client.location,
        phone: client.contactPhone || cfg.businessPhone,
        username: client.dashboardUsername,
        slug: client.portalSlug,
        suspended: isSuspended,
      },
      packages: packages.map((p) => ({
        ...p,
        price: Number(p.price),
      })),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kosa la ndani";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
