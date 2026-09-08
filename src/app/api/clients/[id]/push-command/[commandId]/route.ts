import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clients, routerCommands } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; commandId: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, commandId } = await params;
  const clientId = Number.parseInt(id, 10);
  const idValue = Number.parseInt(commandId, 10);
  if (!Number.isInteger(clientId) || !Number.isInteger(idValue)) {
    return NextResponse.json({ error: "Kitambulisho si sahihi" }, { status: 400 });
  }

  const [command] = await db
    .select({
      id: routerCommands.id,
      status: routerCommands.status,
      result: routerCommands.result,
    })
    .from(routerCommands)
    .innerJoin(clients, eq(routerCommands.clientId, clients.id))
    .where(and(eq(routerCommands.id, idValue), eq(routerCommands.clientId, clientId)))
    .limit(1);

  if (!command) return NextResponse.json({ error: "Command haipatikani" }, { status: 404 });
  return NextResponse.json({
    commandId: command.id,
    status: command.status,
    result: command.result ? JSON.parse(command.result) : null,
  });
}
