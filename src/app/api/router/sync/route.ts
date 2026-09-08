import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clients, routerSyncEvents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { parseRouterPayload, readRouterString } from "@/lib/router-payload";

type SyncEvent = {
  eventId?: unknown;
  type?: unknown;
  payload?: unknown;
  createdAt?: unknown;
};

function parseEvents(value: unknown): SyncEvent[] {
  if (Array.isArray(value)) return value as SyncEvent[];
  if (typeof value !== "string") return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as SyncEvent[] : [];
  } catch {
    return [];
  }
}

export async function POST(request: NextRequest) {
  const body = parseRouterPayload(await request.text(), request.headers.get("content-type"));

  const token = readRouterString(body, "token");
  if (!token || token.length < 32) {
    return NextResponse.json({ error: "Sync token si sahihi" }, { status: 401 });
  }

  try {
    const [client] = await db
      .select({ id: clients.id })
      .from(clients)
      .where(eq(clients.routerPushToken, token))
      .limit(1);
    if (!client) return NextResponse.json({ error: "Router haijasajiliwa" }, { status: 401 });

    const events = parseEvents(body.events);
    if (events.length === 0 && typeof body.eventId === "string") {
      events.push({
        eventId: body.eventId,
        type: body.type,
        payload: body.payload,
        createdAt: body.createdAt,
      });
    }
    let accepted = 0;
    for (const event of events.slice(0, 100)) {
      const eventId = typeof event.eventId === "string" ? event.eventId.trim() : "";
      const eventType = typeof event.type === "string" ? event.type.trim() : "";
      if (!eventId || !eventType || eventId.length > 100 || eventType.length > 50) continue;

      try {
        await db.insert(routerSyncEvents).values({
          clientId: client.id,
          eventId,
          eventType,
          payload: JSON.stringify(event.payload ?? {}),
          createdAt: event.createdAt ? new Date(String(event.createdAt)) : new Date(),
        });
        accepted++;
      } catch (error) {
        const message = error instanceof Error ? error.message.toLowerCase() : "";
        if (!message.includes("duplicate") && !message.includes("unique")) throw error;
      }
    }

    await db.update(clients).set({ routerLastSeen: new Date() }).where(eq(clients.id, client.id));
    return NextResponse.json({ success: true, received: events.length, accepted });
  } catch (error) {
    console.error("Router sync failed", error);
    return NextResponse.json({ success: true, accepted: 0, retry: true }, { status: 200 });
  }
}