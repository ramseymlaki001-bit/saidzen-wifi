import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clients, users } from "@/db/schema";
import { eq, and, or, lt, gt, gte } from "drizzle-orm";
import { getSession } from "@/lib/auth";

/**
 * Admin dashboard stats - takwimu za biashara nzima
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Client counts
    const { sql } = await import("drizzle-orm");

    const { payments, vouchers } = await import("@/db/schema");

    const [
      [totalClients],
      [activeClients],
      [expiredClients],
      [suspendedClients],
      [monthlyRevenue],
      [expectedRevenue],
      unpaidClients,
      recentPayments,
      [totalVouchers],
      [monthlyVouchers],
      topClients,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(clients),
      db
        .select({ count: sql<number>`count(*)` })
        .from(clients)
        .where(eq(clients.status, "active")),
      db
        .select({ count: sql<number>`count(*)` })
        .from(clients)
        .where(eq(clients.status, "expired")),
      db
        .select({ count: sql<number>`count(*)` })
        .from(clients)
        .where(eq(clients.status, "suspended")),
      db
        .select({ total: sql<string>`coalesce(sum(amount), 0)` })
        .from(payments)
        .where(
          and(
            gt(payments.paidAt, monthStart),
            lt(payments.paidAt, monthEnd)
          )
        ),
      db
        .select({ total: sql<string>`coalesce(sum(monthly_fee), 0)` })
        .from(clients)
        .where(eq(clients.status, "active")),
      db
      .select({
        id: clients.id,
        businessName: clients.businessName,
        monthlyFee: clients.monthlyFee,
        subscriptionEnd: clients.subscriptionEnd,
        daysOverdue: sql<number>`DATEDIFF(NOW(), ${clients.subscriptionEnd})`,
        userName: users.name,
        userPhone: users.phone,
        routerIp: clients.routerIp,
        status: clients.status,
      })
      .from(clients)
      .innerJoin(users, eq(clients.userId, users.id))
      .where(
        and(
          lt(clients.subscriptionEnd, now),
          or(
            eq(clients.status, "active"),
            eq(clients.status, "expired")
          )
        )
      ),
      db
        .select({
          id: payments.id,
          amount: payments.amount,
          method: payments.method,
          paidAt: payments.paidAt,
          businessName: clients.businessName,
          reference: payments.reference,
          mpesaReceiptNumber: payments.mpesaReceiptNumber,
        })
        .from(payments)
        .innerJoin(clients, eq(payments.clientId, clients.id))
        .orderBy(sql`${payments.paidAt} desc`)
        .limit(10),
      db.select({ count: sql<number>`count(*)` }).from(vouchers),
      db
        .select({ count: sql<number>`count(*)` })
        .from(vouchers)
        .where(gte(vouchers.createdAt, monthStart)),
      db
        .select({
          businessName: clients.businessName,
          voucherCount: sql<number>`count(*)`,
          totalRevenue: sql<string>`sum(${payments.amount})`,
        })
        .from(vouchers)
        .innerJoin(clients, eq(vouchers.clientId, clients.id))
        .leftJoin(payments, eq(clients.id, payments.clientId))
        .groupBy(clients.businessName)
        .orderBy(sql`count(*) desc`)
        .limit(5),
    ]);

    const totalUnpaid = unpaidClients.reduce(
      (sum, c) => sum + Number(c.monthlyFee),
      0
    );

    return NextResponse.json({
      totalClients: totalClients.count,
      activeClients: activeClients.count,
      expiredClients: expiredClients.count,
      suspendedClients: suspendedClients.count,
      monthlyRevenue: monthlyRevenue.total,
      expectedRevenue: expectedRevenue.total,
      totalUnpaid,
      unpaidClients,
      recentPayments,
      totalVouchers: totalVouchers.count,
      monthlyVouchers: monthlyVouchers.count,
      topClients,
      timestamp: now.toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Kosa la ndani" }, { status: 500 });
  }
}
