import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { vouchers, voucherProfiles, clients } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { generateVouchers } from "@/lib/mikrotik";
import { logAudit } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { profileId, count } = await request.json();

    if (!profileId || !count || count < 1 || count > 200) {
      return NextResponse.json(
        { error: "Taarifa sahihi zinahitajika (profileId, count 1-200)" },
        { status: 400 }
      );
    }

    const [profile] = await db
      .select()
      .from(voucherProfiles)
      .where(eq(voucherProfiles.id, profileId))
      .limit(1);

    if (!profile) {
      return NextResponse.json(
        { error: "Aina ya vocha haijapatikana" },
        { status: 404 }
      );
    }

    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, profile.clientId))
      .limit(1);

    if (!client) {
      return NextResponse.json(
        { error: "Mteja hajapatikana" },
        { status: 404 }
      );
    }

    if (session.role === "vendor" && client.userId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (client.status !== "active") {
      return NextResponse.json(
        { error: "Huduma imesimamishwa. Wasiliana na admin." },
        { status: 403 }
      );
    }

    if (new Date() > client.subscriptionEnd) {
      return NextResponse.json(
        { error: "Ada ya mwezi haijalipiwa. Wasiliana na admin." },
        { status: 403 }
      );
    }

    // Generate via MikroTik API (real or simulation)
    const conn = {
      host: client.vpnIp || client.routerIp,
      username: client.routerUsername,
      encryptedPassword: client.routerPasswordEncrypted,
      port: client.routerPort,
    };

    let generated;
    try {
      generated = await generateVouchers(conn, profile.mikrotikProfile, count);
    } catch (err) {
      // Router haipo/haijibu — USIHIFADHI vocha za uongo. Mwambie mteja ukweli.
      const reason = err instanceof Error ? err.message : "Router haipatikani";
      await logAudit({
        userId: session.userId,
        action: "generate_voucher",
        details: `IMESHINDIKANA kuzalisha vocha ${count} kwa "${client.businessName}": ${reason}`,
      });
      return NextResponse.json(
        {
          error: `Imeshindikana kuwasiliana na router ya "${client.businessName}". ${reason}`,
          routerOffline: true,
          hint: "Bonyeza 'Pima Router' kwenye dashibodi ili kuona tatizo halisi.",
        },
        { status: 503 }
      );
    }

    if (!generated || generated.length === 0) {
      return NextResponse.json(
        { error: "Router haikutoa vocha yoyote. Jaribu tena.", routerOffline: true },
        { status: 503 }
      );
    }

    // Save to database
    const voucherRecords = generated.map((v) => ({
      clientId: client.id,
      profileId: profile.id,
      code: v.code,
      password: v.password,
      mikrotikId: v.mikrotikId || null,
    }));

    await db.insert(vouchers).values(voucherRecords);

    // MySQL haina RETURNING — tunachukua vocha tulizoingiza kwa code zao
    const insertedCodes = voucherRecords.map((v) => v.code);
    const inserted = await db
      .select()
      .from(vouchers)
      .where(
        and(
          eq(vouchers.clientId, client.id),
          inArray(vouchers.code, insertedCodes)
        )
      );

    // Audit log
    await logAudit({
      userId: session.userId,
      action: "generate_voucher",
      details: `Vocha ${count} za aina "${profile.name}" zimezalishwa`,
    });

    return NextResponse.json({
      success: true,
      count: inserted.length,
      vouchers: inserted.map((v: typeof vouchers.$inferSelect) => ({
        id: v.id,
        code: v.code,
        password: v.password,
        profile: profile.name,
        duration: profile.duration,
        price: profile.price,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Kosa la ndani";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
