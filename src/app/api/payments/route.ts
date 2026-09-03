import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, clients } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { enableHotspot } from "@/lib/mikrotik";
import { logAudit } from "@/lib/audit";
import { insertReturning } from "@/lib/db-mysql";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await db
      .select({
        id: payments.id,
        amount: payments.amount,
        method: payments.method,
        reference: payments.reference,
        mpesaReceiptNumber: payments.mpesaReceiptNumber,
        mpesaTransactionId: payments.mpesaTransactionId,
        paidAt: payments.paidAt,
        periodStart: payments.periodStart,
        periodEnd: payments.periodEnd,
        clientId: payments.clientId,
        businessName: clients.businessName,
      })
      .from(payments)
      .innerJoin(clients, eq(payments.clientId, clients.id))
      .orderBy(desc(payments.paidAt));

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

    const { clientId, amount, method, reference, mpesaReceiptNumber } =
      await request.json();

    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);

    if (!client) {
      return NextResponse.json(
        { error: "Mteja hajapatikana" },
        { status: 404 }
      );
    }

    const periodStart = new Date();
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    const payment = await insertReturning<typeof payments.$inferSelect>(payments, {
        clientId,
        amount: amount || client.monthlyFee,
        method: method || "cash",
        reference,
        mpesaReceiptNumber,
      periodStart,
      periodEnd,
    });

    await db
      .update(clients)
      .set({
        subscriptionEnd: periodEnd,
        status: "active",
      })
      .where(eq(clients.id, clientId));

    // Re-enable hotspot
    const conn = {
      host: client.vpnIp || client.routerIp,
      username: client.routerUsername,
      encryptedPassword: client.routerPasswordEncrypted,
      port: client.routerPort,
    };
    await enableHotspot(conn);

    // Rekodi kwenye kumbukumbu ya matendo
    await logAudit({
      userId: session.userId,
      action: "record_payment",
      details: `Malipo ya TSh ${payment.amount} yamerekodiwa kwa "${client.businessName}" (njia: ${payment.method}) — huduma imewashwa hadi ${periodEnd.toLocaleDateString("sw-TZ")}`,
    });

    return NextResponse.json({ success: true, payment });
  } catch {
    return NextResponse.json({ error: "Kosa la ndani" }, { status: 500 });
  }
}
