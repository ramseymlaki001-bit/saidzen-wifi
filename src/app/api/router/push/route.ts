import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clients, routerCommands } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { getAppUrl } from "@/lib/settings";
import { waitForRouterCommand } from "@/lib/router-push";
import { parseRouterPayload, readRouterBoolean, readRouterString } from "@/lib/router-payload";

export const maxDuration = 30;

const NOOP_SCRIPT = ':put "SaidZen: hakuna command mpya"';

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
  const body = parseRouterPayload(await request.text(), request.headers.get("content-type")) as PushBody;

  const token = readRouterString(body, "token");
  if (!token || token.length < 32) {
    return NextResponse.json({ error: "Push token si sahihi" }, { status: 401 });
  }

  try {
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

    const commandId = Number(readRouterString(body, "commandId"));
    if (Number.isInteger(commandId) && commandId > 0) {
      const success = readRouterBoolean(body, "success");
      await db
        .update(routerCommands)
        .set({
          status: success ? "completed" : "failed",
          result: JSON.stringify({ success, result: body.result ?? null, routerIp: body.routerIp ?? null }),
          completedAt: new Date(),
        })
        .where(
          and(
            eq(routerCommands.id, commandId),
            eq(routerCommands.clientId, client.id),
            inArray(routerCommands.status, ["pending", "delivered"])
          )
        );
    }

    let pending: (typeof routerCommands.$inferSelect) | undefined = (
      await db
        .select()
        .from(routerCommands)
        .where(and(eq(routerCommands.clientId, client.id), eq(routerCommands.status, "pending")))
        .limit(1)
    )[0];

    if (!pending) {
      pending = await waitForRouterCommand(client.id);
    }

    if (!pending) {
      return new NextResponse(NOOP_SCRIPT, {
        status: 200,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
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
  } catch (error) {
    console.error("Router push failed", error);
    return new NextResponse(NOOP_SCRIPT, {
      status: 200,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
}
