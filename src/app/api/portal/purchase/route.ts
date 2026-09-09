import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  clients,
  voucherProfiles,
  portalOrders,
  mpesaConfig,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { insertReturning } from "@/lib/db-mysql";
import { createOrderAccessToken } from "@/lib/order-access";

/**
 * NUNUA VOCHA KWA M-PESA KIOTOMATIKI — Mteja wa mwisho
 *
 * MTIRIRIKO SALAMA (umebadilishwa):
 *   1. Mteja anachagua kifurushi + anaingiza namba ya simu
 *   2. Mfumo unatengeneza ODA tu (hakuna vocha bado)
 *   3. Unatuma STK Push kwa M-Pesa
 *   4. Mteja aningiza PIN → M-Pesa inaita callback
 *   5. CALLBACK inatengeneza vocha BAADA ya uthibitisho wa malipo
 *
 * KWA NINI: Awali vocha ilitolewa KABLA ya malipo — mtu alikuwa anaweza
 * kupata vocha bure kisha kuacha kulipa. Sasa vocha inatoka tu baada ya
 * pesa kuthibitishwa.
 */

// Rate limiting: oda 5 kwa IP kwa dakika 10
const purchaseLimiter = new RateLimiterMemory({
  points: 5,
  duration: 600,
  blockDuration: 600,
});

export async function POST(request: NextRequest) {
  try {
    // ── Rate limit kwa IP ─────────────────────────────────────
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    try {
      await purchaseLimiter.consume(ip);
    } catch {
      return NextResponse.json(
        {
          error:
            "Umeomba mara nyingi sana. Subiri dakika 10 kabla ya kujaribu tena.",
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const slug = String(body.slug || "").trim().toLowerCase();
    const rawPhone = String(body.phone || "").replace(/\D/g, "");
    const phone = rawPhone.startsWith("00") ? rawPhone.slice(2) : rawPhone;
    const packageId = Number(body.packageId);

    if (!slug || !phone || !Number.isInteger(packageId) || packageId < 1) {
      return NextResponse.json(
        { error: "Weka namba ya simu na chagua kifurushi" },
        { status: 400 }
      );
    }

    // Namba ya simu iwe na umbizo la Tanzania
    let msisdn = phone;
    if (msisdn.startsWith("0")) msisdn = "255" + msisdn.slice(1);
    if (!/^255(60|61|62|65|67|68|69|71|73|74|75|76|77|78|79)\d{7}$/.test(msisdn)) {
      return NextResponse.json(
        { error: "Namba ya simu si sahihi. Tumia mfano: 0755 123 456" },
        { status: 400 }
      );
    }

    // ── 1. Pata hotspot ───────────────────────────────────────
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.portalSlug, slug))
      .limit(1);

    if (!client) {
      return NextResponse.json({ error: "Hotspot haipatikani" }, { status: 404 });
    }

    if (client.status !== "active" || new Date() > client.subscriptionEnd) {
      return NextResponse.json(
        {
          error:
            "Huduma ya hotspot hii imesimamishwa kwa sasa. Wasiliana na mmiliki: " +
            (client.contactPhone || "namba ya msaada"),
        },
        { status: 503 }
      );
    }

    // ── 2. Pata kifurushi ─────────────────────────────────────
    const [pkg] = await db
      .select()
      .from(voucherProfiles)
      .where(
        and(
          eq(voucherProfiles.id, packageId),
          eq(voucherProfiles.clientId, client.id)
        )
      )
      .limit(1);

    if (!pkg) {
      return NextResponse.json(
        { error: "Kifurushi haipatikani" },
        { status: 404 }
      );
    }

    const amount = Number(pkg.price);

    // ── 3. Hakikisha M-Pesa imewashwa (USALAMA WA PESAA) ──────
    // Bila hii, mtu yeyote angepata vocha bure.
    const [cfg] = await db
      .select()
      .from(mpesaConfig)
      .where(eq(mpesaConfig.clientId, client.id))
      .limit(1);

    if (!cfg || !cfg.enabled) {
      return NextResponse.json(
        {
          error:
            "Malipo ya kiotomatiki hayajawashwa kwa hotspot hii. " +
            "Tafadhali nunua vocha kutoka kwa mmiliki wa hotspot.",
          requiresManual: true,
          businessName: client.businessName,
          businessPhone: client.contactPhone || "",
        },
        { status: 503 }
      );
    }

    // ── 4. Tengeneza oda (HAKUNA VOCHA BADO) ──────────────────
    const order = await insertReturning<typeof portalOrders.$inferSelect>(
      portalOrders,
      {
        clientId: client.id,
        profileId: pkg.id,
        phone: msisdn,
        amount: String(amount),
        status: "pending",
      }
    );

    // ── 5. Tuma STK Push kwa M-Pesa ───────────────────────────
    try {
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";

      const auth = Buffer.from(
        `${cfg.consumerKey}:${cfg.consumerSecret}`
      ).toString("base64");
      const baseUrl =
        cfg.environment === "production"
          ? "https://api.safaricom.co.ke"
          : "https://sandbox.safaricom.co.ke";

      const tokenRes = await fetch(
        `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        { headers: { Authorization: `Basic ${auth}` } }
      );
      const tokenData = await tokenRes.json();

      if (!tokenData.access_token) {
        await db
          .update(portalOrders)
          .set({ status: "failed" })
          .where(eq(portalOrders.id, order.id));

        return NextResponse.json(
          {
            error:
              "Imeshindikana kuwasiliana na M-Pesa. Tafadhali jaribu tena au nunua kutoka kwa mmiliki.",
            orderId: order.id,
          },
          { status: 502 }
        );
      }

      const timestamp = new Date()
        .toISOString()
        .replace(/[-:T.Z]/g, "")
        .slice(0, 14);
      const password = Buffer.from(
        `${cfg.shortcode}${cfg.passkey}${timestamp}`
      ).toString("base64");

      const stkRes = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenData.access_token}`,
        },
        body: JSON.stringify({
          BusinessShortCode: cfg.shortcode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: "CustomerPayBillOnline",
          Amount: Math.round(amount),
          PartyA: msisdn,
          PartyB: cfg.shortcode,
          PhoneNumber: msisdn,
          CallBackURL: cfg.callbackUrl || `${appUrl}/api/portal/mpesa-callback`,
          AccountReference: `SZ-${client.id}-${order.id}`,
          TransactionDesc: `${pkg.name} - ${client.businessName}`,
        }),
      });
      const stkData = await stkRes.json();

      if (!stkData.CheckoutRequestID) {
        await db
          .update(portalOrders)
          .set({ status: "failed" })
          .where(eq(portalOrders.id, order.id));

        return NextResponse.json(
          {
            error:
              stkData.errorMessage ||
              "M-Pesa imekataa ombi. Hakikisha namba ina salau ya kutosha.",
            orderId: order.id,
          },
          { status: 502 }
        );
      }

      await db
        .update(portalOrders)
        .set({ checkoutRequestId: stkData.CheckoutRequestID })
        .where(eq(portalOrders.id, order.id));

      // ── 6. Rudisha: subiri uthibitisho ──────────────────────
      return NextResponse.json({
        success: true,
        requiresPayment: true,
        orderId: order.id,
        orderToken: createOrderAccessToken(order.id),
        amount,
        phone: msisdn,
        package: pkg.name,
        message:
          stkData.CustomerMessage ||
          "Ombi la malipo limetumwa. Angalia simu yako na uingize PIN ya M-Pesa.",
        checkUrl: `/api/portal/order?id=${order.id}&token=${encodeURIComponent(createOrderAccessToken(order.id))}`,
      });
    } catch (err) {
      await db
        .update(portalOrders)
        .set({ status: "failed" })
        .where(eq(portalOrders.id, order.id));

      return NextResponse.json(
        {
          error: "Kosa la kuwasiliana na M-Pesa. Jaribu tena baadaye.",
          orderId: order.id,
        },
        { status: 502 }
      );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kosa la ndani";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
