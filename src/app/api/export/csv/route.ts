import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { vouchers, voucherProfiles, clients, payments } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

/**
 * Kusafirisha data kwenye faili la CSV (vocha, wateja, malipo)
 *
 * MUHIMU: Kila thamani inafungwa kwa alama za nukuu ("...") ili koma zilizo
 * ndani ya data (mfano "50,000" au "Kariakoo, Dar es Salaam") zisivunje
 * safu za Excel. Hii ndiyo njia sahihi ya kuandika CSV.
 */

/** Funga thamani kwa njia salama ya CSV */
function csvField(value: unknown): string {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  // Ondoa nukuu maradufu ndani, kisha zungushia nukuu
  return `"${str.replace(/"/g, '""')}"`;
}

/** Jenga mstari wa CSV kutoka safu ya thamani */
function csvRow(values: unknown[]): string {
  return values.map(csvField).join(",");
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get("type") || "vouchers";
    const status = url.searchParams.get("status");
    const clientId = url.searchParams.get("clientId");
    const today = new Date().toISOString().split("T")[0];

    // ── VOCHA ─────────────────────────────────────────────────
    if (type === "vouchers") {
      let whereClause;

      if (session.role === "vendor") {
        const { clients: clientsTbl } = await import("@/db/schema");
        const vendorClients = await db
          .select({ id: clientsTbl.id })
          .from(clientsTbl)
          .where(eq(clientsTbl.userId, session.userId));

        const clientIds = vendorClients.map((c) => c.id);
        if (clientIds.length === 0) {
          return new Response(csvRow(["Hakuna data"]), {
            headers: { "Content-Type": "text/csv; charset=utf-8" },
          });
        }

        if (clientId && clientIds.includes(parseInt(clientId))) {
          whereClause = eq(vouchers.clientId, parseInt(clientId));
        } else if (clientIds.length === 1) {
          whereClause = eq(vouchers.clientId, clientIds[0]);
        } else {
          const { inArray } = await import("drizzle-orm");
          whereClause = inArray(vouchers.clientId, clientIds);
        }
      } else if (clientId) {
        whereClause = eq(vouchers.clientId, parseInt(clientId));
      }

      const conditions = whereClause ? [whereClause] : [];
      if (status) {
        conditions.push(eq(vouchers.status, status as never));
      }

      const rows = await db
        .select({
          code: vouchers.code,
          password: vouchers.password,
          profile: voucherProfiles.name,
          duration: voucherProfiles.duration,
          price: voucherProfiles.price,
          status: vouchers.status,
          createdAt: vouchers.createdAt,
          usedAt: vouchers.usedAt,
          businessName: clients.businessName,
        })
        .from(vouchers)
        .innerJoin(voucherProfiles, eq(vouchers.profileId, voucherProfiles.id))
        .innerJoin(clients, eq(vouchers.clientId, clients.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(vouchers.createdAt));

      const csvRows = [
        csvRow([
          "Code (Username)",
          "Password",
          "Aina",
          "Muda",
          "Bei (TSh)",
          "Hali",
          "Router/Biashara",
          "Tarehe ya Kutengeneza",
          "Tarehe ya Kutumia",
        ]),
        ...rows.map((v) =>
          csvRow([
            v.code,
            v.password,
            v.profile,
            v.duration,
            Number(v.price),
            v.status === "unused"
              ? "Haijatumiwa"
              : v.status === "used"
                ? "Imetumika"
                : "Imepitwa",
            v.businessName,
            new Date(v.createdAt).toLocaleDateString("sw-TZ"),
            v.usedAt ? new Date(v.usedAt).toLocaleDateString("sw-TZ") : "-",
          ])
        ),
      ];

      return new Response("\uFEFF" + csvRows.join("\n"), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="saidzen_vocha_${today}.csv"`,
        },
      });
    }

    // ── WATEJA ────────────────────────────────────────────────
    if (type === "clients") {
      if (session.role !== "admin") {
        return NextResponse.json({ error: "Admin only" }, { status: 403 });
      }

      const rows = await db
        .select({
          businessName: clients.businessName,
          dashboardUsername: clients.dashboardUsername,
          routerIp: clients.routerIp,
          routerPort: clients.routerPort,
          vpnIp: clients.vpnIp,
          status: clients.status,
          monthlyFee: clients.monthlyFee,
          location: clients.location,
          subscriptionEnd: clients.subscriptionEnd,
          createdAt: clients.createdAt,
        })
        .from(clients);

      const csvRows = [
        csvRow([
          "Biashara",
          "Username",
          "Router IP",
          "Port",
          "VPN IP",
          "Hali",
          "Ada/Mwezi (TSh)",
          "Mahali",
          "Mwisho wa Malipo",
          "Tarehe ya Kusajili",
        ]),
        ...rows.map((c) =>
          csvRow([
            c.businessName,
            c.dashboardUsername || "-",
            c.routerIp,
            c.routerPort,
            c.vpnIp || "-",
            c.status === "active"
              ? "Anafanya Kazi"
              : c.status === "suspended"
                ? "Amesimamishwa"
                : "Amechelewa",
            Number(c.monthlyFee),
            c.location || "-",
            new Date(c.subscriptionEnd).toLocaleDateString("sw-TZ"),
            new Date(c.createdAt).toLocaleDateString("sw-TZ"),
          ])
        ),
      ];

      return new Response("\uFEFF" + csvRows.join("\n"), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="saidzen_wateja_${today}.csv"`,
        },
      });
    }

    // ── MALIPO ────────────────────────────────────────────────
    if (type === "payments") {
      if (session.role !== "admin") {
        return NextResponse.json({ error: "Admin only" }, { status: 403 });
      }

      const rows = await db
        .select({
          businessName: clients.businessName,
          amount: payments.amount,
          method: payments.method,
          reference: payments.reference,
          mpesaReceiptNumber: payments.mpesaReceiptNumber,
          paidAt: payments.paidAt,
          periodStart: payments.periodStart,
          periodEnd: payments.periodEnd,
        })
        .from(payments)
        .innerJoin(clients, eq(payments.clientId, clients.id))
        .orderBy(desc(payments.paidAt));

      const total = rows.reduce((s, r) => s + Number(r.amount), 0);

      const csvRows = [
        csvRow([
          "Mteja",
          "Kiasi (TSh)",
          "Njia",
          "Rejeleo",
          "M-Pesa Receipt",
          "Tarehe ya Malipo",
          "Kipindi Kuanzia",
          "Kipindi Hadi",
        ]),
        ...rows.map((p) =>
          csvRow([
            p.businessName,
            Number(p.amount),
            p.method,
            p.reference || "-",
            p.mpesaReceiptNumber || "-",
            new Date(p.paidAt).toLocaleDateString("sw-TZ"),
            new Date(p.periodStart).toLocaleDateString("sw-TZ"),
            new Date(p.periodEnd).toLocaleDateString("sw-TZ"),
          ])
        ),
        "",
        csvRow(["JUMLA", total, "", "", "", "", "", ""]),
      ];

      return new Response("\uFEFF" + csvRows.join("\n"), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="saidzen_malipo_${today}.csv"`,
        },
      });
    }

    return NextResponse.json(
      {
        error: "Aina si sahihi. Tumia: vouchers, clients, au payments",
      },
      { status: 400 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kosa la ndani";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
