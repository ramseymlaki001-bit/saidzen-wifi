import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { configureHotspot } from "@/lib/mikrotik";
import { getAppUrl } from "@/lib/settings";

export async function POST(
  _request: NextRequest,
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
      .where(eq(clients.id, parseInt(id, 10)))
      .limit(1);

    if (!client) {
      return NextResponse.json({ error: "Mteja hajapatikana" }, { status: 404 });
    }

    const appUrl = getAppUrl();
    const portalHost = new URL(appUrl).hostname;
    const result = await configureHotspot(
      {
        host: client.vpnIp || client.routerIp,
        username: client.routerUsername,
        encryptedPassword: client.routerPasswordEncrypted,
        port: client.routerPort,
      },
      portalHost
    );

    return NextResponse.json(result, { status: result.success ? 200 : 503 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Kosa la ndani";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
