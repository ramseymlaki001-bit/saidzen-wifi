import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clients, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, hashPassword } from "@/lib/auth";
import { encrypt } from "@/lib/encryption";
import { logAudit } from "@/lib/audit";

/**
 * KUSASISHA MTEJA / ROUTER
 *
 * Inaruhusu admin kurekebisha taarifa zote za router ya mteja — hasa
 * API credentials (kama mteja amebadilisha nenosiri la router yake na
 * mfumo umeshindwa kuongea nayo).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const clientId = parseInt(id);
    const body = await request.json();

    // ── 1. Pata mteja ─────────────────────────────────────────
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);

    if (!client) {
      return NextResponse.json({ error: "Mteja hajapatikana" }, { status: 404 });
    }

    // ── 2. Ruhusa ─────────────────────────────────────────────
    // Admin anaweza kuhariri yoyote; vendor anaweza kuhariri zake tu
    const isOwner = session.role === "vendor" && client.userId === session.userId;
    if (session.role !== "admin" && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── 3. Andaa uwanja wa kusasisha ──────────────────────────
    const updateData: Record<string, unknown> = {};

    // Taarifa za biashara
    if (typeof body.businessName === "string" && body.businessName.trim())
      updateData.businessName = body.businessName.trim();
    if (typeof body.location === "string")
      updateData.location = body.location.trim() || null;
    if (typeof body.contactPhone === "string")
      updateData.contactPhone = body.contactPhone.trim() || null;

    // Taarifa za router (MikroTik API) — muhimu kwa utatuzi
    if (typeof body.routerIp === "string" && body.routerIp.trim())
      updateData.routerIp = body.routerIp.trim();
    if (typeof body.routerUsername === "string" && body.routerUsername.trim())
      updateData.routerUsername = body.routerUsername.trim();
    if (typeof body.routerPort !== "undefined") {
      const port = parseInt(String(body.routerPort), 10);
      if (port > 0 && port <= 65535) updateData.routerPort = port;
    }
    // Nenosiri la router: liafanye encryption kabla ya kuhifadhi
    if (typeof body.routerPassword === "string" && body.routerPassword.length > 0) {
      updateData.routerPasswordEncrypted = encrypt(body.routerPassword);
    }
    if (typeof body.vpnIp === "string")
      updateData.vpnIp = body.vpnIp.trim() || null;

    // Malipo
    if (body.monthlyFee !== undefined && body.monthlyFee !== null && body.monthlyFee !== "")
      updateData.monthlyFee = String(body.monthlyFee);
    if (body.subscriptionEnd)
      updateData.subscriptionEnd = new Date(body.subscriptionEnd);
    if (body.status && ["active", "suspended", "expired"].includes(body.status))
      updateData.status = body.status;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Hakuna kigezo cha kusasisha kilichotumwa" },
        { status: 400 }
      );
    }

    // ── 4. Sasaisha ───────────────────────────────────────────
    await db.update(clients).set(updateData).where(eq(clients.id, clientId));

    const [updated] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);

    // ── 5. Kumbukumbu ─────────────────────────────────────────
    const changed = Object.keys(updateData).join(", ");
    await logAudit({
      userId: session.userId,
      action: "update_client",
      details: `Router "${updated.businessName}" imesasishwa (uwanja: ${changed})`,
    });

    return NextResponse.json({
      success: true,
      message: `Router "${updated.businessName}" imesasishwa`,
      updatedFields: Object.keys(updateData),
      client: {
        id: updated.id,
        businessName: updated.businessName,
        routerIp: updated.routerIp,
        routerPort: updated.routerPort,
        vpnIp: updated.vpnIp,
        status: updated.status,
        monthlyFee: updated.monthlyFee,
        subscriptionEnd: updated.subscriptionEnd,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kosa la ndani";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** Kusoma taarifa kamili za mteja mmoja */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [row] = await db
      .select({
        id: clients.id,
        userId: clients.userId,
        businessName: clients.businessName,
        dashboardUsername: clients.dashboardUsername,
        location: clients.location,
        routerIp: clients.routerIp,
        routerUsername: clients.routerUsername,
        routerPort: clients.routerPort,
        vpnIp: clients.vpnIp,
        contactPhone: clients.contactPhone,
        status: clients.status,
        monthlyFee: clients.monthlyFee,
        subscriptionEnd: clients.subscriptionEnd,
        createdAt: clients.createdAt,
        ownerName: users.name,
        ownerPhone: users.phone,
      })
      .from(clients)
      .innerJoin(users, eq(clients.userId, users.id))
      .where(eq(clients.id, parseInt(id)))
      .limit(1);

    if (!row) {
      return NextResponse.json({ error: "Mteja hajapatikana" }, { status: 404 });
    }

    // Vendor aone zake tu
    if (session.role === "vendor" && row.userId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Usirudishe nenosiri la router (limefichwa)
    return NextResponse.json({
      ...row,
      hasRouterPassword: true,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kosa la ndani";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
