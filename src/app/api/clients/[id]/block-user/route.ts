import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { disableHotspot } from "@/lib/mikrotik";
import { logAudit } from "@/lib/audit";
import { isRouterPushEnabled, queueRouterCommand } from "@/lib/router-push";

/**
 * Admin kuzuia mteja mahususi kwenye router yake
 * Inazima hotspot ya mteja na kubadilisha status
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { reason } = await request.json();

    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, parseInt(id)))
      .limit(1);

    if (!client) {
      return NextResponse.json(
        { error: "Mteja hajapatikana" },
        { status: 404 }
      );
    }

    if (isRouterPushEnabled()) {
      if (!client.routerPushToken) {
        return NextResponse.json(
          { error: "Router hii haijasetiwa outbound push. Tengeneza command mpya ya /connect." },
          { status: 503 }
        );
      }
      const commandId = await queueRouterCommand(client.id, "disable_hotspot", { reason });
      return NextResponse.json(
        { success: true, pending: true, commandId, message: "Ombi la kuzima limewekwa; router itatekeleza kupitia outbound POST." },
        { status: 202 }
      );
    }

    // Disable hotspot on router
    const conn = {
      host: client.vpnIp || client.routerIp,
      username: client.routerUsername,
      encryptedPassword: client.routerPasswordEncrypted,
      port: client.routerPort,
    };

    const result = await disableHotspot(conn);

    // Update client status
    await db
      .update(clients)
      .set({ status: "suspended" })
      .where(eq(clients.id, parseInt(id)));

    await logAudit({
      userId: session.userId,
      action: "toggle_router",
      details: `Mteja "${client.businessName}" amezuiwa. Sababu: ${reason || "Malipo hayajalipwa"}`,
    });

    return NextResponse.json({
      success: true,
      message: `Huduma ya "${client.businessName}" imezimwa`,
      mikrotik: result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Kosa la ndani";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
