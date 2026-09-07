import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  auditLogs,
  clients,
  connectionTokens,
  mpesaConfig,
  passwordResetTokens,
  payments,
  portalOrders,
  sessions,
  users,
  vouchers,
  voucherProfiles,
} from "@/db/schema";
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

    if (typeof body.routerIp === "string" && body.routerIp.trim()) {
      const routerIp = body.routerIp.trim();
      const lastOctet = routerIp.match(/^\d+\.\d+\.\d+\.\d+$/)?.[0]
        ?.split(".")[3];
      if (lastOctet === "0" || lastOctet === "255") {
        return NextResponse.json(
          {
            error: `${routerIp} ni network/broadcast address, si IP ya router. Tumia IP halisi ya router, kwa kawaida 192.168.88.1.`,
          },
          { status: 400 }
        );
      }
    }

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

/** Kufuta mteja pamoja na taarifa zake zote zinazomtegemea (admin pekee). */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const clientId = Number.parseInt(id, 10);
    if (!Number.isInteger(clientId)) {
      return NextResponse.json({ error: "Kitambulisho cha mteja si sahihi" }, { status: 400 });
    }

    const [client] = await db
      .select({
        id: clients.id,
        userId: clients.userId,
        businessName: clients.businessName,
      })
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);

    if (!client) {
      return NextResponse.json({ error: "Mteja hajapatikana" }, { status: 404 });
    }

    await db.transaction(async (tx) => {
      // Futa watoto kwanza kwa sababu foreign keys za database hazina cascade.
      await tx.delete(portalOrders).where(eq(portalOrders.clientId, clientId));
      await tx.delete(vouchers).where(eq(vouchers.clientId, clientId));
      await tx.delete(voucherProfiles).where(eq(voucherProfiles.clientId, clientId));
      await tx.delete(payments).where(eq(payments.clientId, clientId));
      await tx.delete(mpesaConfig).where(eq(mpesaConfig.clientId, clientId));
      await tx
        .update(connectionTokens)
        .set({ clientId: null })
        .where(eq(connectionTokens.clientId, clientId));
      await tx.delete(clients).where(eq(clients.id, clientId));

      const remainingClients = await tx
        .select({ id: clients.id })
        .from(clients)
        .where(eq(clients.userId, client.userId))
        .limit(1);

      if (remainingClients.length === 0) {
        await tx.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, client.userId));
        await tx.delete(sessions).where(eq(sessions.userId, client.userId));
        await tx
          .update(connectionTokens)
          .set({ createdBy: null })
          .where(eq(connectionTokens.createdBy, client.userId));
        await tx
          .update(auditLogs)
          .set({ userId: null })
          .where(eq(auditLogs.userId, client.userId));
        await tx.delete(users).where(eq(users.id, client.userId));
      }
    });

    await logAudit({
      userId: session.userId,
      action: "delete_client",
      details: `Mteja "${client.businessName}" amefutwa pamoja na taarifa zake zote`,
    });

    return NextResponse.json({
      success: true,
      message: `Mteja "${client.businessName}" amefutwa`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kosa la ndani";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
