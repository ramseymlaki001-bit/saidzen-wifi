import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { mpesaConfig } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

/**
 * M-Pesa STK Push API Integration (Daraja)
 *
 * Kuanzisha malipo ya M-Pesa (Lipa Na M-Pesa Online / STK Push)
 * Inatumika na admin au vendor wakati wa kurekodi malipo
 */
export async function POST(request: NextRequest) {
  try {
    // ── ULINZI: admin pekee (njia hii ni kwa ada ya mmiliki) ──
    const { getSession } = await import("@/lib/auth");
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized — admin pekee" },
        { status: 401 }
      );
    }

    const { phoneNumber, amount, accountId } = await request.json();

    const numericAmount = Number(amount);
    if (!phoneNumber || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { error: "Namba ya simu na kiasi vinahitajika" },
        { status: 400 }
      );
    }

    // Find M-Pesa config for this account
    const [config] = await db
      .select()
      .from(mpesaConfig)
      .where(eq(mpesaConfig.clientId, parseInt(accountId)))
      .limit(1);

    if (!config || !config.enabled) {
      return NextResponse.json(
        { error: "M-Pesa haipatikani au haijawashwa kwa akaunti hii" },
        { status: 503 }
      );
    }

    // Get M-Pesa access token
    const auth = Buffer.from(
      `${config.consumerKey}:${config.consumerSecret}`
    ).toString("base64");

    const tokenRes = await fetch(
      `https://${config.environment === "production" ? "api" : "sandbox"}.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: { Authorization: `Basic ${auth}` },
      }
    );

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return NextResponse.json(
        { error: "Imeshindikana kupata token ya M-Pesa", details: tokenData },
        { status: 502 }
      );
    }

    // Generate password (base64 of Shortcode + Passkey + Timestamp)
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T.Z]/g, "")
      .slice(0, 14);

    const mpesaPassword = Buffer.from(
      `${config.shortcode}${config.passkey}${timestamp}`
    ).toString("base64");

    // STK Push request
    const stkRes = await fetch(
      `https://${config.environment === "production" ? "api" : "sandbox"}.safaricom.co.ke/mpesa/stkpush/v1/processrequest`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenData.access_token}`,
        },
        body: JSON.stringify({
          BusinessShortCode: config.shortcode,
          Password: mpesaPassword,
          Timestamp: timestamp,
          TransactionType: "CustomerPayBillOnline",
          Amount: Math.round(numericAmount),
          PartyA: phoneNumber.replace("+", ""),
          PartyB: config.shortcode,
          PhoneNumber: phoneNumber.replace("+", ""),
         CallBackURL:
            config.callbackUrl ||
            `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/mpesa/callback`,
          AccountReference: `SaidZen-${accountId}`,
          TransactionDesc: "SaidZen WiFi Hotspot Voucher Payment",
        }),
      }
    );

    const stkData = await stkRes.json();

    if (!stkRes.ok || !stkData.CheckoutRequestID) {
      return NextResponse.json(
        { error: stkData.errorMessage || stkData.ResponseDescription || "M-Pesa imekataa ombi." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Ombi la M-Pesa limetumwa. Tafadhali angalia simu yako.",
      checkoutRequestId: stkData.CheckoutRequestID,
      merchantRequestId: stkData.MerchantRequestID,
      customerMessage: stkData.CustomerMessage,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Kosa la M-Pesa";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
