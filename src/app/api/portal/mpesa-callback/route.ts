import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  portalOrders,
  clients,
  payments,
  vouchers,
  voucherProfiles,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateVouchers } from "@/lib/mikrotik";
import { logAudit } from "@/lib/audit";
import { insertReturning } from "@/lib/db-mysql";

/**
 * M-PESA CALLBACK — Vocha inatolewa BAADA ya uthibitisho wa malipo
 *
 * Mtiririko salama:
 *   1. M-Pesa inaita URL hii baada ya mteja kuingiza PIN
 *   2. Tunathibitisha ResultCode == 0 (malipo yamefanikiwa)
 *   3. Tunakagua oda ipo na bado haijalipwa (kuzuia marudio)
 *   4. NDIO tunaunda vocha kwenye router (MikroTik API)
 *   5. Tunarekodi malipo + kumbukumbu
 *
 * KWA NINI: Hii inahakikisha hakuna vocha inayotolewa bila pesa.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const stk = body?.Body?.stkCallback;

    if (!stk) {
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Invalid" });
    }

    const resultCode = stk.ResultCode;
    const checkoutId = stk.CheckoutRequestID;

    // ── 1. Tafuta oda ─────────────────────────────────────────
    const [order] = await db
      .select()
      .from(portalOrders)
      .where(eq(portalOrders.checkoutRequestId, checkoutId))
      .limit(1);

    if (!order) {
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Order not found" });
    }

    // ── 2. Zuia marudio (idempotency) ─────────────────────────
    if (order.status === "paid") {
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Already processed" });
    }

    // ── 3. Malipo yamefeli ────────────────────────────────────
    if (resultCode !== 0) {
      await db
        .update(portalOrders)
        .set({ status: "cancelled" })
        .where(eq(portalOrders.id, order.id));

      return NextResponse.json({ ResultCode: 0, ResultDesc: "Cancelled" });
    }

    // ── 4. Malipo yamefanikiwa — toa data ─────────────────────
    const items = stk.CallbackMetadata?.Item || [];
    const get = (n: string) => items.find((i: any) => i.Name === n)?.Value;
    const receipt = get("MpesaReceiptNumber");
    const amount = get("Amount");

    if (!receipt || Number(amount) !== Number(order.amount)) {
      await db
        .update(portalOrders)
        .set({ status: "failed" })
        .where(eq(portalOrders.id, order.id));
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Invalid payment" });
    }

    // ── 5. Pata router + kifurushi ────────────────────────────
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, order.clientId))
      .limit(1);

    const [pkg] = await db
      .select()
      .from(voucherProfiles)
      .where(eq(voucherProfiles.id, order.profileId))
      .limit(1);

    if (!client || !pkg) {
      await db
        .update(portalOrders)
        .set({ status: "failed" })
        .where(eq(portalOrders.id, order.id));
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Data missing" });
    }

    // ── 6. TENGENEZA VOCHA (sasa tu, baada ya pesa) ───────────
    let voucherCode: string | null = null;

    try {
      const conn = {
        host: client.vpnIp || client.routerIp,
        username: client.routerUsername,
        encryptedPassword: client.routerPasswordEncrypted,
        port: client.routerPort,
      };

      const generated = await generateVouchers(conn, pkg.mikrotikProfile, 1);
      const newVoucher = generated[0];

      if (newVoucher) {
        const saved = await insertReturning<typeof vouchers.$inferSelect>(
          vouchers,
          {
            clientId: client.id,
            profileId: pkg.id,
            code: newVoucher.code,
            password: newVoucher.password,
            mikrotikId: newVoucher.mikrotikId || null,
          }
        );

        voucherCode = saved.code;
      }
    } catch (err) {
      console.error("Voucher generation failed after payment:", err);
    }

    // ── 7. Weka oda kuwa "paid" ───────────────────────────────
    await db
      .update(portalOrders)
      .set({
        status: "paid",
        mpesaReceipt: receipt,
        voucherCode,
        completedAt: new Date(),
      })
      .where(eq(portalOrders.id, order.id));

    // ── 8. Rekodi malipo ──────────────────────────────────────
    const now = new Date();
    await db.insert(payments).values({
      clientId: order.clientId,
      amount: String(amount || order.amount),
      method: "mpesa",
      reference: `Portal-${order.id}`,
      mpesaReceiptNumber: receipt,
      mpesaTransactionId: checkoutId,
      mpesaPhoneNumber: order.phone,
      periodStart: now,
      periodEnd: now,
    });

    // ── 9. Kumbukumbu ─────────────────────────────────────────
    await logAudit({
      action: "record_payment",
      details: `Malipo ya M-Pesa TSh ${amount || order.amount} kutoka ${order.phone} kwa "${client.businessName}" — vocha: ${voucherCode || "imeshindikana"}`,
      ipAddress: order.phone,
    });

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch {
    // M-Pesa inahitaji jibu la 200 daima
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Error" });
  }
}
