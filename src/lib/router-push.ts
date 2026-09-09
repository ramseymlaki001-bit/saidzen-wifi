import { db } from "@/db";
import { routerCommands } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export type RouterPushCommand = "diagnostics" | "disable_hotspot" | "enable_hotspot";

export function isRouterPushEnabled(): boolean {
  return (process.env.MIKROTIK_COMMUNICATION_MODE || "push").toLowerCase() === "push";
}

export async function queueRouterCommand(
  clientId: number,
  command: RouterPushCommand,
  payload: Record<string, unknown> = {}
): Promise<number> {
  const inserted = await db.insert(routerCommands).values({
    clientId,
    command,
    payload: JSON.stringify(payload),
    status: "pending",
  });
  return Number(inserted[0].insertId);
}

export async function waitForRouterCommand(
  clientId: number
): Promise<(typeof routerCommands.$inferSelect) | undefined> {
  const timeoutMs = Math.max(0, Number(process.env.ROUTER_LONG_POLL_MS || 25000));
  const intervalMs = Math.max(250, Number(process.env.ROUTER_LONG_POLL_INTERVAL_MS || 1000));
  const deadline = Date.now() + timeoutMs;

  while (Date.now() <= deadline) {
    const [pending] = await db
      .select()
      .from(routerCommands)
      .where(and(eq(routerCommands.clientId, clientId), eq(routerCommands.status, "pending")))
      .limit(1);

    if (pending) return pending;

    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) break;
    await new Promise((resolve) => setTimeout(resolve, Math.min(intervalMs, remainingMs)));
  }

  return undefined;
}
