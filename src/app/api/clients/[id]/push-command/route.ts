import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clients, routerCommands } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

const ALLOWED_COMMANDS = new Set(["diagnostics", "disable_hotspot", "enable_hotspot"]);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const clientId = Number.parseInt(id, 10);
  const body = (await request.json()) as { command?: unknown; payload?: unknown };
  const command = typeof body.command === "string" ? body.command : "";
  if (!Number.isInteger(clientId) || !ALLOWED_COMMANDS.has(command)) {
    return NextResponse.json({ error: "Command si sahihi" }, { status: 400 });
  }

  const [client] = await db
    .select({ id: clients.id, routerLastSeen: clients.routerLastSeen })
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1);
  if (!client) return NextResponse.json({ error: "Mteja hajapatikana" }, { status: 404 });

  const result = await db.insert(routerCommands).values({
    clientId,
    command,
    payload: JSON.stringify(body.payload ?? {}),
    status: "pending",
  });

  return NextResponse.json(
    {
      success: true,
      pending: true,
      commandId: Number(result[0].insertId),
      message: client.routerLastSeen
        ? "Command imetumwa; router itatekeleza kwenye POST inayofuata."
        : "Command imehifadhiwa, lakini router bado haijafanya push. Hakikisha scheduler ya push imewashwa.",
    },
    { status: 202 }
  );
}
