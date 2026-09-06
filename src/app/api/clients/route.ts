import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clients, users, voucherProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, hashPassword } from "@/lib/auth";
import { encrypt } from "@/lib/encryption";
import { allocatePortalSlug } from "@/lib/portal-slug";
import { insertReturning } from "@/lib/db-mysql";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await db
      .select({
        id: clients.id,
        userId: clients.userId,
        dashboardUsername: clients.dashboardUsername,
        portalSlug: clients.portalSlug,
        businessName: clients.businessName,
        location: clients.location,
        routerIp: clients.routerIp,
        routerPort: clients.routerPort,
        vpnIp: clients.vpnIp,
        status: clients.status,
        monthlyFee: clients.monthlyFee,
        subscriptionEnd: clients.subscriptionEnd,
        createdAt: clients.createdAt,
        userName: users.name,
        userUsername: users.username,
        userEmail: users.email,
        userPhone: users.phone,
      })
      .from(clients)
      .innerJoin(users, eq(clients.userId, users.id))
      .orderBy(clients.createdAt);

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Kosa la ndani" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      username,
      email,
      phone,
      password,
      businessName,
      location,
      routerIp,
      routerUsername,
      routerPassword,
      routerPort,
      vpnIp,
      monthlyFee,
    } = body;

    const cleanUsername = (username || name || "vendor")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "_");

    // ── Hakikisha username haijatumiwa (409 badala ya hitilafu ya 500) ──
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, cleanUsername))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: `Username "${cleanUsername}" tayari imetumika. Chagua nyingine.` },
        { status: 409 }
      );
    }

    // Hakikisha router IP haijatumiwa
    const existingIp = await db
      .select({ id: clients.id })
      .from(clients)
      .where(eq(clients.routerIp, routerIp))
      .limit(1);

    if (existingIp.length > 0) {
      return NextResponse.json(
        { error: `Router IP "${routerIp}" tayari imesajiliwa.` },
        { status: 409 }
      );
    }

    // Hash dashboard password and encrypt router password
    const passwordHash = await hashPassword(password || "vendor123");
    const encryptedRouterPassword = encrypt(routerPassword);

    const newUser = await insertReturning<typeof users.$inferSelect>(users, {
        name,
        username: cleanUsername,
        email: email ? email.toLowerCase().trim() : null,
        phone,
      passwordHash,
      role: "vendor",
    });

    const subscriptionEnd = new Date();
    subscriptionEnd.setDate(subscriptionEnd.getDate() + 30);

    const portalSlug = await allocatePortalSlug(businessName || cleanUsername);

    const newClient = await insertReturning<typeof clients.$inferSelect>(clients, {
        userId: newUser.id,
        dashboardUsername: cleanUsername,
        portalSlug,
        businessName,
        location,
        routerIp,
        routerUsername: routerUsername || "admin",
        routerPasswordEncrypted: encryptedRouterPassword,
        routerPort: routerPort || 8728,
        vpnIp,
      monthlyFee: monthlyFee || "50000",
      subscriptionEnd,
    });

    // Create default voucher profiles
    await db.insert(voucherProfiles).values([
      {
        clientId: newClient.id,
        name: "Saa 1",
        duration: "1h",
        price: "500",
        speedLimit: "2M/2M",
        mikrotikProfile: "Saa_1",
      },
      {
        clientId: newClient.id,
        name: "Saa 2",
        duration: "2h",
        price: "800",
        speedLimit: "3M/3M",
        mikrotikProfile: "Saa_2",
      },
      {
        clientId: newClient.id,
        name: "Saa 6",
        duration: "6h",
        price: "1500",
        speedLimit: "3M/3M",
        mikrotikProfile: "Saa_6",
      },
      {
        clientId: newClient.id,
        name: "Siku 1 (Saa 24)",
        duration: "24h",
        price: "2000",
        speedLimit: "5M/5M",
        mikrotikProfile: "Saa_24",
      },
      {
        clientId: newClient.id,
        name: "Wiki 1",
        duration: "7d",
        price: "8000",
        speedLimit: "5M/5M",
        mikrotikProfile: "Wiki_1",
      },
    ]);

    return NextResponse.json({
      success: true,
      portalUrl: `/wifi/${portalSlug}`,
      client: newClient,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Kosa la ndani";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
