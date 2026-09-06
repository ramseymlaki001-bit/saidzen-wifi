"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { authFetch } from "@/lib/client-auth";

interface UnpaidClient {
  id: number;
  businessName: string;
  monthlyFee: string;
  subscriptionEnd: string;
  daysOverdue: number;
  userName: string;
  userPhone: string | null;
  routerIp: string;
  status: string;
}

interface Payment {
  id: number;
  amount: string;
  method: string;
  paidAt: string;
  businessName: string;
  reference: string | null;
  mpesaReceiptNumber: string | null;
}

interface TopClient {
  businessName: string;
  voucherCount: number;
  totalRevenue: string | null;
}

interface AdminStats {
  totalClients: number;
  activeClients: number;
  expiredClients: number;
  suspendedClients: number;
  monthlyRevenue: string;
  expectedRevenue: string;
  totalUnpaid: number;
  unpaidClients: UnpaidClient[];
  recentPayments: Payment[];
  totalVouchers: number;
  monthlyVouchers: number;
  topClients: TopClient[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [diagnosticId, setDiagnosticId] = useState<number | null>(null);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  const [diagLoading, setDiagLoading] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const res = await authFetch("/api/admin/stats");
      if (!res.ok) throw new Error("Stats request failed");
      const data = await res.json();
      if (data && !data.error) {
        setStats({
          totalClients: data.totalClients || 0,
          activeClients: data.activeClients || 0,
          expiredClients: data.expiredClients || 0,
          suspendedClients: data.suspendedClients || 0,
          monthlyRevenue: data.monthlyRevenue || "0",
          expectedRevenue: data.expectedRevenue || "0",
          totalUnpaid: data.totalUnpaid || 0,
          totalVouchers: data.totalVouchers || 0,
          monthlyVouchers: data.monthlyVouchers || 0,
          unpaidClients: Array.isArray(data.unpaidClients) ? data.unpaidClients : [],
          recentPayments: Array.isArray(data.recentPayments) ? data.recentPayments : [],
          topClients: Array.isArray(data.topClients) ? data.topClients : [],
        });
      }
    } catch (e) {
      console.error("Dashboard stats error:", e);
      setStats({
        totalClients: 0,
        activeClients: 0,
        expiredClients: 0,
        suspendedClients: 0,
        monthlyRevenue: "0",
        expectedRevenue: "0",
        totalUnpaid: 0,
        totalVouchers: 0,
        monthlyVouchers: 0,
        unpaidClients: [],
        recentPayments: [],
        topClients: [],
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void loadStats();
    }, 0);
    // Live: kurasa zote zinasasishwa kila sekunde 30 ili ziwe zinasawazika
    const interval = setInterval(loadStats, 30000);
    return () => {
      window.clearTimeout(initialLoad);
      clearInterval(interval);
    };
  }, [loadStats]);

  async function runPaymentCheck() {
    setChecking(true);
    try {
      const res = await authFetch("/api/cron/check-payments");
      const data = await res.json();
      alert(
        `Imekaguliwa: wateja ${data.checked || 0} wameangaliwa.\nWaliozimwa: ${(data.disabled || []).length}`
      );
    } catch {
      alert("Imeshindikana kukagua malipo");
    }
    loadStats();
    setChecking(false);
  }

  async function runDiagnostics(clientId: number) {
    setDiagnosticId(clientId);
    setDiagLoading(true);
    setDiagnosticResult(null);

    try {
      const res = await authFetch(`/api/clients/${clientId}/diagnostics`, {
        method: "POST",
      });
      const data = await res.json();
      setDiagnosticResult(data);
    } catch {
      setDiagnosticResult({ success: false, message: "Imeshindikana kupima" });
    }
    setDiagLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
        <p className="text-3xl">📊</p>
        <h2 className="font-bold text-slate-900">Dashibodi haikupata takwimu</h2>
        <p className="text-sm text-slate-500">Jaribu kuingia tena au bonyeza hapa chini.</p>
        <button
          onClick={() => {
            setLoading(true);
            loadStats();
          }}
          className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold"
        >
          🔄 Jaribu tena
        </button>
      </div>
    );
  }

  const revenuePercent =
    Number(stats.expectedRevenue) > 0
      ? Math.round(
          (Number(stats.monthlyRevenue) / Number(stats.expectedRevenue)) * 100
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Support Banner */}
      <div className="bg-linear-to-r from-brand-600 to-brand-800 rounded-2xl p-5 text-white flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">
            📞 Ofisi Kuu ya Mtandaoni — SaidZen WiFi
          </h2>
          <p className="text-brand-200 text-sm">
            Simamia wateja wako wote, malipo, na router zao kutoka hapa
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <a
            href="tel:0777378300"
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold transition-colors border border-white/20"
          >
            📞 0777 378 300
          </a>
          <Link
            href="/dashboard/support"
            className="px-4 py-2 bg-white text-brand-700 hover:bg-brand-50 rounded-xl text-sm font-bold transition-colors shadow-md"
          >
            💬 Msaada wa Wateja
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase">
                Wateja Wote
              </p>
              <p className="text-3xl font-black mt-1 text-slate-900">
                {stats.totalClients}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center text-xl border border-blue-100">
              👥
            </div>
          </div>
          <div className="text-xs text-slate-400 mt-2 flex gap-3">
            <span className="text-emerald-600 font-bold">
              ✅ {stats.activeClients}
            </span>
            <span className="text-rose-600 font-bold">
              ❌ {stats.expiredClients}
            </span>
            <span className="text-amber-600 font-bold">
              ⏸️ {stats.suspendedClients}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase">
                Mapato (Mwezi)
              </p>
              <p className="text-2xl font-black mt-1 text-emerald-600">
                TSh {Number(stats.monthlyRevenue).toLocaleString()}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-xl border border-emerald-100">
              💰
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full ${revenuePercent >= 80 ? "bg-emerald-500" : revenuePercent >= 50 ? "bg-amber-500" : "bg-rose-500"}`}
              style={{ width: `${Math.min(revenuePercent, 100)}%` }}
            />
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {revenuePercent}% ya TSh{" "}
            {Number(stats.expectedRevenue).toLocaleString()} inayotarajiwa
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase">
                Pesa Haijalipwa
              </p>
              <p className="text-2xl font-black mt-1 text-rose-600">
                TSh {stats.totalUnpaid.toLocaleString()}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-rose-50 flex items-center justify-center text-xl border border-rose-100">
              ⏰
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            <span className="font-bold text-rose-700">
              {stats.unpaidClients.length}
            </span>{" "}
            wateja wamechelewa
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase">
                Vocha (Mwezi)
              </p>
              <p className="text-2xl font-black mt-1 text-slate-900">
                {stats.monthlyVouchers}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-purple-50 flex items-center justify-center text-xl border border-purple-100">
              🎫
            </div>
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Jumla: {stats.totalVouchers.toLocaleString()} vocha zote
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
        <h3 className="font-bold text-base text-slate-900 mb-3">
          ⚡ Vitendo vya Haraka
        </h3>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/clients"
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-brand-600/20"
          >
            + Sajili Mteja Mpya
          </Link>
          <Link
            href="/dashboard/payments"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-emerald-600/20"
          >
            💰 Rekodi Malipo
          </Link>
          <button
            onClick={runPaymentCheck}
            disabled={checking}
            className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shadow-md shadow-orange-600/20"
          >
            {checking ? "Inakagua..." : "🔍 Kagua Malipo Yaliyochelewa"}
          </button>
          <a
            href="/api/export/csv?type=clients"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            📥 Pakua Orodha ya Wateja (CSV)
          </a>
        </div>
      </div>

      {/* Unpaid Clients Alert */}
      {stats.unpaidClients.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl overflow-hidden">
          <div className="p-4 bg-rose-100 border-b border-rose-200 flex items-center justify-between">
            <h3 className="font-bold text-rose-800 flex items-center gap-2">
              ⚠️ Wateja Wanaochelewa Malipo ({stats.unpaidClients.length})
            </h3>
            <span className="text-xs text-rose-600 font-bold">
              TSh {stats.totalUnpaid.toLocaleString()} haijalipwa
            </span>
          </div>
          <div className="divide-y divide-rose-100">
            {stats.unpaidClients.slice(0, 5).map((c) => (
              <div
                key={c.id}
                className="px-4 py-3 flex items-center justify-between hover:bg-rose-100/50"
              >
                <div>
                  <div className="font-semibold text-rose-900 text-sm">
                    {c.businessName}
                  </div>
                  <div className="text-xs text-rose-600">
                    {c.userName}{" "}
                    {c.userPhone ? `• ${c.userPhone}` : ""} •{" "}
                    <span className="font-mono">{c.routerIp}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-bold text-rose-800">
                      Siku {Math.abs(Math.floor(c.daysOverdue))}
                    </div>
                    <div className="text-xs text-rose-600">
                      TSh {Number(c.monthlyFee).toLocaleString()}/mwezi
                    </div>
                  </div>
                  <button
                    onClick={() => runDiagnostics(c.id)}
                    className="px-2.5 py-1.5 bg-white border border-rose-300 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-100"
                  >
                    🔍 Angalia
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Diagnostic Result Modal */}
      {diagnosticResult && diagnosticId && (
        <div className="bg-white rounded-2xl border-2 border-brand-200 p-5 animate-fadeIn">
          <h3 className="font-bold text-brand-800 mb-3 flex items-center gap-2">
            📡 Matokeo ya Diagnostics
          </h3>
          {diagLoading ? (
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <span className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              Inapima muunganisho...
            </div>
          ) : diagnosticResult.success ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-emerald-50 p-3 rounded-xl text-center">
                <div className="text-xs text-emerald-600">Router</div>
                <div className="text-lg font-black text-emerald-800">
                  ✅ ONLINE
                </div>
              </div>
              <div className="bg-blue-50 p-3 rounded-xl text-center">
                <div className="text-xs text-blue-600">Latency</div>
                <div className="text-lg font-black text-blue-800">
                  {diagnosticResult.latency}
                </div>
              </div>
              <div className="bg-purple-50 p-3 rounded-xl text-center">
                <div className="text-xs text-purple-600">Active Users</div>
                <div className="text-lg font-black text-purple-800">
                  {diagnosticResult.activeUsers || 0}
                </div>
              </div>
              <div className="bg-amber-50 p-3 rounded-xl text-center">
                <div className="text-xs text-amber-600">Router IP</div>
                <div className="text-sm font-mono font-black text-amber-800">
                  {diagnosticResult.routerIp}
                </div>
              </div>
              {diagnosticResult.activeUserList?.length > 0 && (
                <div className="col-span-2 md:col-span-4 bg-slate-50 p-3 rounded-xl">
                  <div className="text-xs text-slate-500 font-semibold mb-2">
                    Wanaotumia sasa hivi:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {diagnosticResult.activeUserList.map(
                      (u: any, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-white rounded-lg border border-slate-200 text-xs font-mono"
                        >
                          {u.name} ({u.profile}) • {u.uptime}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-sm text-rose-700">
              ❌ {diagnosticResult.message || "Router haiko online"}
            </div>
          )}
          <button
            onClick={() => {
              setDiagnosticResult(null);
              setDiagnosticId(null);
            }}
            className="mt-3 text-xs text-slate-400 hover:text-slate-600"
          >
            Funga
          </button>
        </div>
      )}

      {/* Recent Payments */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 pb-3 flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900">
            💳 Malipo ya Hivi Karibuni
          </h3>
          <Link
            href="/dashboard/payments"
            className="text-xs text-brand-600 hover:text-brand-700 font-semibold"
          >
            Ona Yote →
          </Link>
        </div>
        {stats.recentPayments.length === 0 ? (
          <div className="px-5 pb-5 text-slate-400 text-sm">
            Hakuna malipo yaliyorekodiwa bado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold">Mteja</th>
                  <th className="text-left px-5 py-3 font-semibold">Kiasi</th>
                  <th className="text-left px-5 py-3 font-semibold">Njia</th>
                  <th className="text-left px-5 py-3 font-semibold">Rejeleo</th>
                  <th className="text-left px-5 py-3 font-semibold">Tarehe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.recentPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-semibold text-slate-800">
                      {p.businessName}
                    </td>
                    <td className="px-5 py-3 font-bold text-emerald-600">
                      TSh {Number(p.amount).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 capitalize text-slate-600">
                      {p.method}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">
                      {p.mpesaReceiptNumber || p.reference || "-"}
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs">
                      {new Date(p.paidAt).toLocaleDateString("sw-TZ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top Performing Clients */}
      {stats.topClients.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
          <h3 className="font-bold text-base text-slate-900 mb-3">
            🏆 Wateja Bora (Vocha Nyingi)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {stats.topClients.map((c, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
              >
                <span className="text-lg font-black text-brand-600 w-8 text-center">
                  #{i + 1}
                </span>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-slate-800">
                    {c.businessName}
                  </div>
                  <div className="text-xs text-slate-400">
                    {c.voucherCount} vocha zimezalishwa
                  </div>
                </div>
                {c.totalRevenue && (
                  <span className="text-sm font-bold text-emerald-600">
                    TSh {Number(c.totalRevenue).toLocaleString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
