import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { voucherProfiles, clients } from "@/db/schema";
import { eq, inArray, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const clientId = url.searchParams.get("clientId");

    if (session.role === "vendor") {
      // Vendor: get profiles from ALL their routers (multi-router support)
      const vendorClients = await db
        .select({ id: clients.id })
        .from(clients)
        .where(eq(clients.userId, session.userId));

      const clientIds = vendorClients.map((c) => c.id);

      if (clientIds.length === 0) {
        return NextResponse.json([]);
      }

      if (clientId && clientIds.includes(parseInt(clientId))) {
        // Specific router's profiles
        const profiles = await db
          .select()
          .from(voucherProfiles)
          .where(eq(voucherProfiles.clientId, parseInt(clientId)));
        return NextResponse.json(profiles);
      }

      // All profiles from all vendor's routers
      const profiles = await db
        .select()
        .from(voucherProfiles)
        .where(inArray(voucherProfiles.clientId, clientIds));
      return NextResponse.json(profiles);
    }

    // Admin
    if (clientId) {
      const profiles = await db
        .select()
        .from(voucherProfiles)
        .where(eq(voucherProfiles.clientId, parseInt(clientId)));
      return NextResponse.json(profiles);
    }

    const profiles = await db.select().from(voucherProfiles);
    return NextResponse.json(profiles);
  } catch {
    return NextResponse.json({ error: "Kosa la ndani" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "vendor" && session.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const clientId = Number(body.clientId);
    const name = String(body.name || "").trim();
    const duration = String(body.duration || "").trim();
    const price = Number(body.price);
    const speedLimit = String(body.speedLimit || "").trim();
    const mikrotikProfile = String(body.mikrotikProfile || "").trim();

    if (!Number.isInteger(clientId) || clientId < 1 || !name || !duration) {
      return NextResponse.json(
        { error: "Jaza jina, muda na router ya kifurushi" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(price) || price <= 0 || price > 100000000) {
      return NextResponse.json({ error: "Bei ya kifurushi si sahihi" }, { status: 400 });
    }

    if (name.length > 100 || duration.length > 50 || speedLimit.length > 50) {
      return NextResponse.json(
        { error: "Baadhi ya taarifa ni ndefu kuliko inavyoruhusiwa" },
        { status: 400 }
      );
    }

    if (session.role === "vendor") {
      const [ownedClient] = await db
        .select({ id: clients.id })
        .from(clients)
        .where(and(eq(clients.id, clientId), eq(clients.userId, session.userId)))
        .limit(1);

      if (!ownedClient) {
        return NextResponse.json({ error: "Router si wako" }, { status: 403 });
      }
    } else {
      const [client] = await db
        .select({ id: clients.id })
        .from(clients)
        .where(eq(clients.id, clientId))
        .limit(1);

      if (!client) {
        return NextResponse.json({ error: "Router haipatikani" }, { status: 404 });
      }
    }

    const [profile] = await db
      .insert(voucherProfiles)
      .values({
        clientId,
        name,
        duration,
        price: String(price),
        speedLimit: speedLimit || null,
        mikrotikProfile: mikrotikProfile || name,
      })
      .$returningId();

    return NextResponse.json(
      { success: true, id: profile.id, message: "Kifurushi kimeongezwa" },
      { status: 201 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kosa la ndani";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

