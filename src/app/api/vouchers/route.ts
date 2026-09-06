import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { vouchers, voucherProfiles, clients } from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const clientId = url.searchParams.get("clientId");

    let whereClause;

    if (session.role === "vendor") {
      // Vendor: get ALL their routers (multi-router support)
      const vendorClients = await db
        .select({ id: clients.id })
        .from(clients)
        .where(eq(clients.userId, session.userId));

      const clientIds = vendorClients.map((c) => c.id);

      if (clientIds.length === 0) {
        return NextResponse.json([]);
      }

      if (clientId && clientIds.includes(parseInt(clientId))) {
        // Specific router requested and it belongs to vendor
        whereClause = eq(vouchers.clientId, parseInt(clientId));
      } else {
        // All vouchers from all vendor's routers
        whereClause = inArray(vouchers.clientId, clientIds);
      }
    } else if (clientId) {
      // Admin viewing specific client's vouchers
      whereClause = eq(vouchers.clientId, parseInt(clientId));
    }

    const conditions = whereClause ? [whereClause] : [];

    const result = await db
      .select({
        id: vouchers.id,
        code: vouchers.code,
        password: vouchers.password,
        status: vouchers.status,
        createdAt: vouchers.createdAt,
        usedAt: vouchers.usedAt,
        profileName: voucherProfiles.name,
        profileDuration: voucherProfiles.duration,
        profilePrice: voucherProfiles.price,
        clientId: vouchers.clientId,
        businessName: clients.businessName,
      })
      .from(vouchers)
      .innerJoin(voucherProfiles, eq(vouchers.profileId, voucherProfiles.id))
      .innerJoin(clients, eq(vouchers.clientId, clients.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(vouchers.createdAt))
      .limit(500);

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Kosa la ndani" }, { status: 500 });
  }
}
