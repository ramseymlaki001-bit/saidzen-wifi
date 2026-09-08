import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { portalOrders, vouchers, voucherProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyOrderAccessToken } from "@/lib/order-access";

/**
 * HALI YA ODA — Mteja anauliza kila sekunde 3 baada ya kutuma M-Pesa
 *
 * Inarudisha vocha tu ikiwa malipo yameThibitishwa.
 */
export async function GET(request: NextRequest) {
  try {
    const orderId = new URL(request.url).searchParams.get("id");
    const accessToken = new URL(request.url).searchParams.get("token") || "";
    if (!orderId) {
      return NextResponse.json({ error: "id inahitajika" }, { status: 400 });
    }

    const numericOrderId = Number.parseInt(orderId, 10);
    if (!Number.isInteger(numericOrderId) || !verifyOrderAccessToken(accessToken, numericOrderId)) {
      return NextResponse.json({ error: "Oda haipatikani" }, { status: 404 });
    }

    const [order] = await db
      .select()
      .from(portalOrders)
      .where(eq(portalOrders.id, numericOrderId))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: "Oda haipatikani" }, { status: 404 });
    }

    // Bado inasubiri
    if (order.status === "pending") {
      return NextResponse.json({
        status: "pending",
        message: "Tunasubiri uthibitisho wa malipo kutoka M-Pesa...",
      });
    }

    if (order.status === "processing") {
      return NextResponse.json({
        status: "processing",
        message: "Malipo yamepokelewa. Tunatengeneza vocha yako...",
      });
    }

    if (order.status === "paid_pending_fulfillment") {
      return NextResponse.json({
        status: "paid_pending_fulfillment",
        message: "Malipo yamepokelewa. Vocha inasubiri kutengenezwa; wasiliana na msaada ikiwa itachelewa.",
      });
    }

    // Imefeli / imeghairiwa
    if (order.status === "failed" || order.status === "cancelled") {
      return NextResponse.json({
        status: order.status,
        message:
          order.status === "cancelled"
            ? "Malipo yameghairiwa au haukuingiza PIN kwa muda."
            : "Malipo hayakufanikiwa. Jaribu tena.",
      });
    }

    // ── IMELIPWA — rudisha vocha ──────────────────────────────
    let voucher = null;
    if (order.voucherCode) {
      const [v] = await db
        .select({
          code: vouchers.code,
          password: vouchers.password,
          profileName: voucherProfiles.name,
          duration: voucherProfiles.duration,
          price: voucherProfiles.price,
        })
        .from(vouchers)
        .innerJoin(voucherProfiles, eq(vouchers.profileId, voucherProfiles.id))
        .where(eq(vouchers.code, order.voucherCode))
        .limit(1);

      if (v) {
        voucher = {
          code: v.code,
          password: v.password,
          package: v.profileName,
          duration: v.duration,
          price: Number(v.price),
        };
      }
    }

    return NextResponse.json({
      status: order.status,
      receipt: order.mpesaReceipt,
      amount: Number(order.amount),
      voucher,
      message: voucher
        ? "✅ Malipo yamepokelewa! Vocha yako iko tayari."
        : "✅ Malipo yamepokelewa, lakini vocha ilishindikana kutengenezwa. Wasiliana na msaada: 0777 378 300",
    });
  } catch {
    return NextResponse.json({ error: "Kosa la ndani" }, { status: 500 });
  }
}
