import { db } from "@/db";
import { routerCommands } from "@/db/schema";

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
