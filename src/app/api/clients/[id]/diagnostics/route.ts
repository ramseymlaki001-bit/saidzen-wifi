import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { testConnection, getHotspotUsers } from "@/lib/mikrotik";

/**
 * Admin kupima muunganisho na router ya mteja
 * Inarudishi info: router online/offline, active users, latency
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

    const conn = {
      host: client.vpnIp || client.routerIp,
      username: client.routerUsername,
      encryptedPassword: client.routerPasswordEncrypted,
      port: client.routerPort,
    };

    const startTime = Date.now();
    const testResult = await testConnection(conn);
    const latency = Date.now() - startTime;

    let activeUsers: { name: string; profile: string; uptime: string; address: string }[] = [];
    let hotspotUsers = 0;

    if (testResult.success) {
      try {
        activeUsers = await getHotspotUsers(conn);
        hotspotUsers = activeUsers.length;
      } catch {
        // Couldn't get active users, but router is online
      }
    }

    return NextResponse.json({
      success: true,
      routerOnline: testResult.success,
      message: testResult.message,
      latency: `${latency}ms`,
      activeUsers: hotspotUsers,
      activeUserList: activeUsers.slice(0, 10),
      businessName: client.businessName,
      routerIp: client.routerIp,
      vpnIp: client.vpnIp,
      status: client.status,
      subscriptionEnd: client.subscriptionEnd,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Kosa la ndani";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
