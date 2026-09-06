import { NextResponse } from "next/server";
import { db } from "@/db";
import { clients, vouchers, payments } from "@/db/schema";
import { eq, sql, gte, and, inArray } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    if (session.role === "admin") {
      // Admin stats
      const [totalClients] = await db
        .select({ count: sql<number>`count(*)` })
        .from(clients);

      const [activeClients] = await db
        .select({ count: sql<number>`count(*)` })
        .from(clients)
        .where(eq(clients.status, "active"));

      const [expiredClients] = await db
        .select({ count: sql<number>`count(*)` })
        .from(clients)
        .where(eq(clients.status, "expired"));

      const [suspendedClients] = await db
        .select({ count: sql<number>`count(*)` })
        .from(clients)
        .where(eq(clients.status, "suspended"));

      const [totalVouchers] = await db
        .select({ count: sql<number>`count(*)` })
        .from(vouchers);

      const [monthlyPayments] = await db
        .select({ total: sql<string>`coalesce(sum(amount), 0)` })
        .from(payments)
        .where(gte(payments.paidAt, monthStart));

      const recentPayments = await db
        .select({
          id: payments.id,
          amount: payments.amount,
          method: payments.method,
          paidAt: payments.paidAt,
          businessName: clients.businessName,
        })
        .from(payments)
        .innerJoin(clients, eq(payments.clientId, clients.id))
        .orderBy(sql`${payments.paidAt} desc`)
        .limit(5);

      return NextResponse.json({
        totalClients: totalClients.count,
        activeClients: activeClients.count,
        expiredClients: expiredClients.count,
        suspendedClients: suspendedClients.count,
        totalVouchers: totalVouchers.count,
        monthlyRevenue: monthlyPayments.total,
        recentPayments,
      });
    } else {
      // Vendor stats - MULTI-ROUTER support: aggregate across all their routers
      const vendorClients = await db
        .select()
        .from(clients)
        .where(eq(clients.userId, session.userId));

      if (vendorClients.length === 0) {
        return NextResponse.json({
          totalVouchers: 0,
          usedVouchers: 0,
          unusedVouchers: 0,
          monthlyVouchers: 0,
          status: "no_client",
          subscriptionEnd: null,
          routers: [],
        });
      }

      const clientIds = vendorClients.map((c) => c.id);

      // Aggregate counts across all vendor routers
      const [totalV] = await db
        .select({ count: sql<number>`count(*)` })
        .from(vouchers)
        .where(inArray(vouchers.clientId, clientIds));

      const [usedV] = await db
        .select({ count: sql<number>`count(*)` })
        .from(vouchers)
        .where(
          and(
            inArray(vouchers.clientId, clientIds),
            eq(vouchers.status, "used")
          )
        );

      const [unusedV] = await db
        .select({ count: sql<number>`count(*)` })
        .from(vouchers)
        .where(
          and(
            inArray(vouchers.clientId, clientIds),
            eq(vouchers.status, "unused")
          )
        );

      const [monthlyV] = await db
        .select({ count: sql<number>`count(*)` })
        .from(vouchers)
        .where(
          and(
            inArray(vouchers.clientId, clientIds),
            gte(vouchers.createdAt, monthStart)
          )
        );

      const first = vendorClients[0];
      // Overall status: active only if ALL routers active, else show first non-active
      const anySuspended = vendorClients.some((c) => c.status === "suspended");
      const anyExpired = vendorClients.some((c) => c.status === "expired");
      const overallStatus = anySuspended
        ? "suspended"
        : anyExpired
          ? "expired"
          : "active";

      return NextResponse.json({
        totalVouchers: totalV.count,
        usedVouchers: usedV.count,
        unusedVouchers: unusedV.count,
        monthlyVouchers: monthlyV.count,
        status: overallStatus,
        subscriptionEnd: first.subscriptionEnd,
        businessName: first.businessName,
        clientId: first.id,
        routerIp: first.routerIp,
        routerPort: first.routerPort,
        dashboardUsername: first.dashboardUsername,
        vpnIp: first.vpnIp,
        routerCount: vendorClients.length,
        // All routers owned by this vendor (multi-router support)
        routers: vendorClients.map((c) => ({
          id: c.id,
          businessName: c.businessName,
          routerIp: c.routerIp,
          routerPort: c.routerPort,
          vpnIp: c.vpnIp,
          status: c.status,
          monthlyFee: c.monthlyFee,
          subscriptionEnd: c.subscriptionEnd,
          location: c.location,
        })),
      });
    }
  } catch {
    return NextResponse.json({ error: "Kosa la ndani" }, { status: 500 });
  }
}
