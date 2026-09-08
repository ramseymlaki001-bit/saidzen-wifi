import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clients, routerCommands } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getAppUrl } from "@/lib/settings";

type PushBody = {
  token?: unknown;
  commandId?: unknown;
  result?: unknown;
  success?: unknown;
  routerIp?: unknown;
};

function resultScript(
  appUrl: string,
  token: string,
  commandId: number,
  command: string
): string {
  const endpoint = `${appUrl}/api/router/push`;
  const mode = appUrl.startsWith("https://") ? "https" : "http";
  const action =
    command === "disable_hotspot"
      ? `/ip hotspot disable [find]`
      : command === "enable_hotspot"
        ? `/ip hotspot enable [find]`
        : `:put "SaidZen command ${command} haijaungwa"`;

  return `:do {
${action}
/tool fetch url="${endpoint}" http-method=post http-data="token=${token}&commandId=${commandId}&success=true&result=ok" mode=${mode} output=none
} on-error={
/tool fetch url="${endpoint}" http-method=post http-data="token=${token}&commandId=${commandId}&success=false&result=router_error" mode=${mode} output=none
}`;
}

export async function POST(request: NextRequest) {
  let body: PushBody;
  try {
    const raw = await request.text();
    if (request.headers.get("content-type")?.includes("application/json")) {
      body = JSON.parse(raw) as PushBody;
    } else {
      body = Object.fromEntries(new URLSearchParams(raw).entries()) as PushBody;
    }
  } catch {
    return NextResponse.json({ error: "Body ya POST si sahihi" }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!token || token.length < 32) {
    return NextResponse.json({ error: "Push token si sahihi" }, { status: 401 });
  }

  const [client] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(eq(clients.routerPushToken, token))
    .limit(1);
  if (!client) return NextResponse.json({ error: "Router haijasajiliwa" }, { status: 401 });

  await db
    .update(clients)
    .set({ routerLastSeen: new Date() })
    .where(eq(clients.id, client.id));

  const commandId = Number(body.commandId);
  if (Number.isInteger(commandId) && commandId > 0) {
    const success = body.success === true || body.success === "true";
    await db
      .update(routerCommands)
      .set({
        status: success ? "completed" : "failed",
        result: JSON.stringify({ success, result: body.result ?? null, routerIp: body.routerIp ?? null }),
        completedAt: new Date(),
      })
      .where(and(eq(routerCommands.id, commandId), eq(routerCommands.clientId, client.id)));
  }

  const [pending] = await db
    .select()
    .from(routerCommands)
    .where(and(eq(routerCommands.clientId, client.id), eq(routerCommands.status, "pending")))
    .limit(1);

  if (!pending) {
    return NextResponse.json({ success: true, pending: false });
  }

  await db
    .update(routerCommands)
    .set({ status: "delivered", deliveredAt: new Date() })
    .where(eq(routerCommands.id, pending.id));

  if (pending.command === "diagnostics") {
    const mode = getAppUrl().startsWith("https://") ? "https" : "http";
    return new NextResponse(
      `:local saidzenUrl "${getAppUrl()}/api/router/push"\n` +
        `:local saidzenToken "${token}"\n` +
        `:local saidzenCommandId "${pending.id}"\n` +
        `:local saidzenUsers [/ip hotspot active print count-only]\n` +
        `:local saidzenIdentity [/system identity get name]\n` +
        `:local saidzenPayload ("token=" . $saidzenToken . "&commandId=" . $saidzenCommandId . "&success=true&result=online&activeUsers=" . $saidzenUsers . "&identity=" . $saidzenIdentity)\n` +
        `/tool fetch url=$saidzenUrl http-method=post http-data=$saidzenPayload mode=${mode} output=none`,
      { status: 200, headers: { "content-type": "text/plain; charset=utf-8" } }
    );
  }

  return new NextResponse(resultScript(getAppUrl(), token, pending.id, pending.command), {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
