import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, clients, voucherProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, createSession, getSession } from "@/lib/auth";
import { testConnection } from "@/lib/mikrotik";
import { encrypt } from "@/lib/encryption";
import { allocatePortalSlug } from "@/lib/portal-slug";
import { insertReturning } from "@/lib/db-mysql";
import { logAudit } from "@/lib/audit";
import { isIP } from "node:net";

function validateRouterIp(value: unknown): string | null {
  const host = String(value || "").trim();
  if (!host || isIP(host) !== 4) {
    return "Weka IPv4 ya router iliyo sahihi, mfano 192.168.88.1.";
  }

  const octets = host.split(".").map(Number);
  if (octets[3] === 0 || octets[3] === 255) {
    return `${host} ni network/broadcast address, si IP ya router. Tumia IP halisi ya router, kwa kawaida 192.168.88.1.`;
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      routerIp,
      apiPort = 8728,
      apiUsername = "admin",
      apiPassword,
      dashboardUsername,
      dashboardPassword,
      businessName,
      location = "Tanzania",
      phone = "",
    } = body;

    // Check if a vendor is already logged in (they want to add a SECOND router)
    const session = await getSession();
    const isExistingVendor = session && session.role === "vendor";

    if (!routerIp || !apiPassword) {
      return NextResponse.json(
        { error: "IP ya Router na Nenosiri la Router vinahitajika" },
        { status: 400 }
      );
    }

    const routerIpError = validateRouterIp(routerIp);
    if (routerIpError) {
      return NextResponse.json({ error: routerIpError }, { status: 400 });
    }

    // For NEW customers (not logged in), username+password are required
    if (!isExistingVendor) {
      if (!dashboardUsername || !dashboardPassword) {
        return NextResponse.json(
          {
            error:
              "Username na Nenosiri la Mfumo vinahitajika kwa mteja mpya",
          },
          { status: 400 }
        );
      }
    }

    // Check if router IP already registered
    const existingRouter = await db
      .select()
      .from(clients)
      .where(eq(clients.routerIp, routerIp.trim()))
      .limit(1);

    if (existingRouter.length > 0) {
      return NextResponse.json(
        {
          error:
            "IP ya router tayari imesajiliwa. Tafadhali ingia kwa password yako.",
        },
        { status: 409 }
      );
    }

    const portNumber = Number(apiPort);
    if (!Number.isInteger(portNumber) || portNumber < 1 || portNumber > 65535) {
      return NextResponse.json(
        { error: "API port si sahihi. Tumia namba kati ya 1 na 65535, kwa kawaida 8728." },
        { status: 400 }
      );
    }

    const cleanApiUsername = String(apiUsername).trim();
    if (!cleanApiUsername) {
      return NextResponse.json(
        { error: "Username ya MikroTik inahitajika." },
        { status: 400 }
      );
    }

    // Test connection first
    const testConn = {
      host: routerIp.trim(),
      username: cleanApiUsername,
      encryptedPassword: encrypt(apiPassword),
      port: portNumber,
    };

    const testResult = await testConnection(testConn);
    if (!testResult.success) {
      return NextResponse.json(
        {
          error: testResult.message,
          errorCode: testResult.errorCode,
          simulation: testResult.simulation,
        },
        { status: 502 }
      );
    }

    const encryptedRouterPassword = encrypt(apiPassword);

    // 30 days free trial
    const subscriptionEnd = new Date();
    subscriptionEnd.setDate(subscriptionEnd.getDate() + 30);

    let newClient;
    let displayName;
    let portalSlug = "";

    if (isExistingVendor) {
      // EXISTING VENDOR adding another router to their account
      displayName =
        businessName?.trim() ||
        `${session.name} Hotspot ${(await getRouterCount(session.userId)) + 1}`;

      // Slug ya kipekee kwa portal ya mteja wa mwisho
      portalSlug = await allocatePortalSlug(displayName);

      const client = await insertReturning<typeof clients.$inferSelect>(clients, {
          userId: session.userId,
          dashboardUsername: session.username || "vendor",
          businessName: displayName,
          location: location || "Tanzania",
          routerIp: routerIp.trim(),
          routerUsername: apiUsername.trim(),
          routerPasswordEncrypted: encryptedRouterPassword,
          routerPort: portNumber,
          vpnIp: routerIp.trim().startsWith("10.") ? routerIp.trim() : null,
          contactPhone: phone || null,
          status: "active",
        monthlyFee: "50000",
        subscriptionEnd,
      });

      newClient = client;

      await logAudit({
        userId: session.userId,
        action: "create_client",
        details: `Router ya pili "${displayName}" imeongezwa`,
      });
    } else {
      // NEW CUSTOMER - create user account + first router
      const cleanUsername = dashboardUsername
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");

      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.username, cleanUsername))
        .limit(1);

      if (existingUser.length > 0) {
        return NextResponse.json(
          {
            error: `Jina '${dashboardUsername}' tayari limetumika. Chagua jina lingine.`,
          },
          { status: 409 }
        );
      }

      const passwordHash = await hashPassword(dashboardPassword);
      displayName =
        businessName?.trim() || `${cleanUsername.toUpperCase()} Hotspot`;

      // Slug ya kipekee kwa portal ya mteja wa mwisho
      portalSlug = await allocatePortalSlug(cleanUsername);

      const newUser = await insertReturning<typeof users.$inferSelect>(users, {
          name: displayName,
          username: cleanUsername,
          phone: phone || null,
        passwordHash,
        role: "vendor",
      });

      const client = await insertReturning<typeof clients.$inferSelect>(clients, {
          userId: newUser.id,
          dashboardUsername: cleanUsername,
          businessName: displayName,
          location: location || "Tanzania",
          routerIp: routerIp.trim(),
          routerUsername: apiUsername.trim(),
          routerPasswordEncrypted: encryptedRouterPassword,
          routerPort: portNumber,
          vpnIp: routerIp.trim().startsWith("10.") ? routerIp.trim() : null,
          contactPhone: phone || null,
          status: "active",
        monthlyFee: "50000",
        subscriptionEnd,
      });

      newClient = client;

      // Auto login for new customer
      await createSession(newUser.id);

      await logAudit({
        userId: newUser.id,
        action: "create_client",
        details: `Router ya kwanza "${displayName}" imeunganishwa`,
      });
    }

    // Create default voucher profiles for this router
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
        speedLimit: "4M/4M",
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
      message: isExistingVendor
        ? "Router ya ziada imeongezwa kikamilifu!"
        : "Router imeunganishwa kikamilifu na mfumo uko tayari!",
      portalUrl: `/wifi/${portalSlug}`,
      client: {
        id: newClient.id,
        businessName: newClient.businessName,
        portalSlug,
        routerIp: newClient.routerIp,
        status: newClient.status,
        subscriptionEnd: newClient.subscriptionEnd,
      },
      connectionInfo: testResult.message,
    });
  } catch (err) {
    console.error("Quick connect error:", err);
    const msg = err instanceof Error ? err.message : "Kosa la kuunganisha router";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Helper: count how many routers a vendor already has
async function getRouterCount(userId: number): Promise<number> {
  const rows = await db
    .select({ id: clients.id })
    .from(clients)
    .where(eq(clients.userId, userId));
  return rows.length;
}
