import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { enableHotspot, disableHotspot } from "@/lib/mikrotik";
import { isRouterPushEnabled, queueRouterCommand } from "@/lib/router-push";

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
    const { action } = await request.json();

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
      const command = action === "suspend" ? "disable_hotspot" : "enable_hotspot";
      const commandId = await queueRouterCommand(client.id, command);
      return NextResponse.json(
        { success: true, pending: true, commandId, message: "Ombi limewekwa; router itatekeleza kupitia outbound POST." },
        { status: 202 }
      );
    }

    const conn = {
      host: client.vpnIp || client.routerIp,
      username: client.routerUsername,
      encryptedPassword: client.routerPasswordEncrypted,
      port: client.routerPort,
    };

    let result;
    let newStatus: "active" | "suspended";

    if (action === "suspend") {
      result = await disableHotspot(conn);
      newStatus = "suspended";
    } else {
      result = await enableHotspot(conn);
      newStatus = "active";
    }

    await db
      .update(clients)
      .set({ status: newStatus })
      .where(eq(clients.id, parseInt(id)));

    return NextResponse.json({
      success: true,
      status: newStatus,
      mikrotik: result,
    });
  } catch {
    return NextResponse.json({ error: "Kosa la ndani" }, { status: 500 });
  }
}
