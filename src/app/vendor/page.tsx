"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
<<<<<<< HEAD
import { authFetch } from "@/lib/client-auth";
=======
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a

interface Router {
  id: number;
  businessName: string;
  portalSlug?: string | null;
  routerIp: string;
  routerPort: number;
  vpnIp: string | null;
  status: string;
  monthlyFee: string;
  subscriptionEnd: string;
  location?: string | null;
}

interface VendorStats {
  totalVouchers: number;
  usedVouchers: number;
  unusedVouchers: number;
  monthlyVouchers: number;
  status: string;
  subscriptionEnd: string | null;
  businessName?: string;
  clientId?: number;
  routerIp?: string;
  routerPort?: number;
  dashboardUsername?: string;
  vpnIp?: string | null;
  routerCount?: number;
  routers?: Router[];
}

export default function VendorDashboard() {
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [pingStatus, setPingStatus] = useState<string | null>(null);
  const [isPinging, setIsPinging] = useState(false);

  // ── KUONGEZA ROUTER MPYA (multi-router) ──────────────────────
  const [showAddRouter, setShowAddRouter] = useState(false);
  const [newRouter, setNewRouter] = useState({
    businessName: "",
    routerIp: "",
    apiUsername: "admin",
    apiPassword: "",
    apiPort: "8728",
  });
  const [addingRouter, setAddingRouter] = useState(false);
  const [addRouterMsg, setAddRouterMsg] = useState("");
  const [copiedPortal, setCopiedPortal] = useState("");

  async function addRouter() {
    if (!newRouter.businessName || !newRouter.routerIp || !newRouter.apiPassword) {
      setAddRouterMsg("⚠️ Jaza: Jina la Hotspot, Router IP, na API Password");
      return;
    }
    setAddingRouter(true);
    setAddRouterMsg("");
    try {
<<<<<<< HEAD
      const res = await authFetch("/api/mikrotik/quick-connect", {
=======
      const res = await fetch("/api/mikrotik/quick-connect", {
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRouter),
      });
      const data = await res.json();
      if (res.ok) {
        setAddRouterMsg(`✅ ${data.message}`);
        setNewRouter({
          businessName: "",
          routerIp: "",
          apiUsername: "admin",
          apiPassword: "",
          apiPort: "8728",
        });
        setTimeout(() => {
          setShowAddRouter(false);
          setAddRouterMsg("");
          loadStats();
        }, 1500);
      } else {
        setAddRouterMsg(`❌ ${data.error}`);
      }
    } catch {
      setAddRouterMsg("❌ Kosa la mtandao");
    }
    setAddingRouter(false);
  }

  const loadStats = useCallback(async () => {
    try {
<<<<<<< HEAD
      const res = await authFetch("/api/stats");
      if (!res.ok) return;
      const data = await res.json();
      if (data && !data.error) {
        setStats(data);
      }
=======
      const res = await fetch("/api/stats");
      const data = await res.json();
      setStats(data);
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
    } catch {
      /* kimya */
    }
  }, []);

  useEffect(() => {
    loadStats();
    // Live: dashboard ya vendor inasasishwa kila sekunde 30
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [loadStats]);

  async function handlePing(router?: Router) {
    const host = router?.vpnIp || router?.routerIp || stats?.vpnIp || stats?.routerIp;
    const port = router?.routerPort || stats?.routerPort || 8728;
    if (!host) return;
    setIsPinging(true);
    setPingStatus(null);
    try {
<<<<<<< HEAD
      const res = await authFetch("/api/mikrotik/test", {
=======
      const res = await fetch("/api/mikrotik/test", {
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host, port }),
      });
      const data = await res.json();
      setPingStatus(
        `${router?.businessName || stats?.businessName}: ${data.message}`
      );
    } catch {
      setPingStatus("Hitilafu ya kupima router");
    }
    setIsPinging(false);
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const daysLeft = stats.subscriptionEnd
    ? Math.max(
        0,
        Math.ceil(
          (new Date(stats.subscriptionEnd).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  const routers = stats.routers || [];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
<<<<<<< HEAD
      <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
=======
      <div className="bg-linear-to-r from-emerald-600 via-emerald-500 to-teal-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
        <div>
          <div className="inline-flex items-center gap-2 bg-black/15 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            <span>✨</span> Mfumo Wako Uko Hewani
          </div>
          <h2 className="text-2xl sm:text-3xl font-black mb-1">
            {stats.businessName || "Hotspot Yako"}
          </h2>
          <p className="text-emerald-100 text-sm">
            Username:{" "}
            <span className="font-mono font-bold bg-white/20 px-2 py-0.5 rounded text-white">
              {stats.dashboardUsername || "juma_wifi"}
            </span>
            {routers.length > 1 && (
              <span className="ml-2 bg-white/20 px-2 py-0.5 rounded text-xs font-bold">
                📡 Router {routers.length}
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/vendor/vouchers"
            className="px-5 py-3 bg-white text-emerald-900 hover:bg-emerald-50 rounded-2xl font-black text-sm transition-all shadow-lg shadow-black/10"
          >
            ⚡ Zalisha Vocha
          </Link>
          <button
            onClick={() => handlePing()}
            disabled={isPinging}
            className="px-4 py-3 bg-emerald-700/60 hover:bg-emerald-700 text-white rounded-2xl font-semibold text-xs border border-white/20 transition-colors flex items-center gap-1.5"
          >
            {isPinging ? (
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <span>📡</span>
            )}
            Pima Router
          </button>
        </div>
      </div>

      {pingStatus && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>{pingStatus}</span>
          </div>
          <button
            onClick={() => setPingStatus(null)}
            className="text-slate-400 hover:text-slate-600 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Routers List (multi-router support) */}
      {routers.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <span>📡</span> Router Zako za MikroTik ({routers.length})
            </span>
            <button
              onClick={() => setShowAddRouter(!showAddRouter)}
              className="text-xs text-brand-600 hover:text-brand-700 font-semibold"
            >
              {showAddRouter ? "✕ Funga" : "+ Ongeza Router Nyingine"}
            </button>
          </div>

          {/* FOMU: KUONGEZA ROUTER MPYA (multi-router) */}
          {showAddRouter && (
            <div className="bg-brand-50/50 border border-brand-200 rounded-xl p-4 space-y-3 animate-fadeIn">
              {addRouterMsg && (
                <div
                  className={`px-3 py-2 rounded-xl text-xs font-medium ${
                    addRouterMsg.startsWith("✅")
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}
                >
                  {addRouterMsg}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Jina la Hotspot/Tawi *
                  </label>
                  <input
                    value={newRouter.businessName}
                    onChange={(e) =>
                      setNewRouter({ ...newRouter, businessName: e.target.value })
                    }
                    placeholder="Tawi la Mwenge Bar"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Router IP au VPN IP *
                  </label>
                  <input
                    value={newRouter.routerIp}
                    onChange={(e) =>
                      setNewRouter({ ...newRouter, routerIp: e.target.value })
                    }
                    placeholder="10.8.0.3"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:border-brand-500"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 sm:col-span-2">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      API Username
                    </label>
                    <input
                      value={newRouter.apiUsername}
                      onChange={(e) =>
                        setNewRouter({ ...newRouter, apiUsername: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Port
                    </label>
                    <input
                      value={newRouter.apiPort}
                      onChange={(e) =>
                        setNewRouter({ ...newRouter, apiPort: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    API Password ya Router *
                  </label>
                  <input
                    type="password"
                    value={newRouter.apiPassword}
                    onChange={(e) =>
                      setNewRouter({ ...newRouter, apiPassword: e.target.value })
                    }
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:border-brand-500"
                  />
                </div>
              </div>
              <button
                onClick={addRouter}
                disabled={addingRouter}
                className="w-full py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 disabled:opacity-50"
              >
                {addingRouter ? "Inaunganisha..." : "⚡ Unganisha Router Hii"}
              </button>
              <p className="text-[11px] text-slate-500 text-center">
                💡 Tip: Namba ya VPN IP inayofuata hutengwa kiotomatiki (mfano .3,
                .4...)
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {routers.map((r) => (
              <div
                key={r.id}
                className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-sm text-slate-900">
                      {r.businessName}
                    </div>
                    <div className="text-xs font-mono text-slate-600">
                      {r.routerIp}:{r.routerPort}
                    </div>
                    {r.vpnIp && (
                      <div className="text-xs text-emerald-600 font-semibold">
                        VPN: {r.vpnIp}
                      </div>
                    )}
                    {r.location && (
                      <div className="text-xs text-slate-400">
                        📍 {r.location}
                      </div>
                    )}
                    {r.portalSlug && (
<<<<<<< HEAD
                      <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                        <Link
                          href={`/wifi/${r.portalSlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Fungua ukurasa wa wateja wa hotspot hii"
                          className="inline-flex items-center gap-1 text-[11px] font-mono bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200 font-bold transition-colors shadow-xs"
                        >
                          <span>🌐 Fungua Portal</span>
                          <span className="text-[10px]">↗</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            const url = `${window.location.origin}/wifi/${r.portalSlug}`;
                            navigator.clipboard.writeText(url);
                            setCopiedPortal(String(r.id));
                            setTimeout(() => setCopiedPortal(""), 2500);
                          }}
                          title="Nakili kiungo cha portal"
                          className="inline-flex items-center text-[11px] font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-lg border border-slate-200 transition-colors"
                        >
                          {copiedPortal === String(r.id) ? "✓ Imenakiliwa!" : "📋 Nakili"}
                        </button>
                      </div>
=======
                      <button
                        onClick={() => {
                          const url = `${window.location.origin}/wifi/${r.portalSlug}`;
                          navigator.clipboard.writeText(url);
                          setCopiedPortal(String(r.id));
                          setTimeout(() => setCopiedPortal(""), 2500);
                        }}
                        title="Bonyeza kunakili anwani ya portal ya wateja wako"
                        className="mt-1 inline-flex items-center gap-1 text-[11px] font-mono bg-brand-50 hover:bg-brand-100 text-brand-700 px-2 py-1 rounded-lg border border-brand-200 transition-colors"
                      >
                        {copiedPortal === String(r.id)
                          ? "✓ Imenakiliwa!"
                          : `🔗 /wifi/${r.portalSlug}`}
                      </button>
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
                    )}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      r.status === "active"
                        ? "bg-emerald-100 text-emerald-800"
                        : r.status === "suspended"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {r.status === "active"
                      ? "✅ Inawaka"
                      : r.status === "suspended"
                        ? "⏸️ Zimwa"
                        : "❌ Chelewa"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Mwisho:{" "}
                    {new Date(r.subscriptionEnd).toLocaleDateString("sw-TZ")}
                  </span>
                  <button
                    onClick={() => handlePing(r)}
                    className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-[10px] font-bold text-slate-700 hover:bg-slate-100"
                  >
                    🔍 Pima
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subscription Status */}
      <div
        className={`rounded-2xl p-5 border shadow-sm space-y-3 ${
          stats.status === "active"
            ? "bg-white border-slate-200/80"
            : "bg-rose-50 border-rose-200"
        }`}
      >
        <div className="flex items-center justify-between border-b pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <span>💳</span> Ada ya Kila Mwezi
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              stats.status === "active"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-rose-100 text-rose-800"
            }`}
          >
            {stats.status === "active" ? "Imelipiwa" : "Imechelewa"}
          </span>
        </div>

        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Muda uliobaki:</span>
            <span className="font-bold text-slate-800">
              Siku {daysLeft} zimebaki
            </span>
          </div>
          {stats.subscriptionEnd && (
            <div className="flex justify-between">
              <span className="text-slate-500">Tarehe ya kuisha:</span>
              <span className="font-semibold text-slate-700">
                {new Date(stats.subscriptionEnd).toLocaleDateString("sw-TZ", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
        </div>

        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full ${daysLeft > 7 ? "bg-emerald-500" : "bg-amber-500"}`}
            style={{ width: `${Math.min(100, (daysLeft / 30) * 100)}%` }}
          />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Vocha Zote",
            value: stats.totalVouchers,
            icon: "🎫",
            color: "bg-blue-50 text-blue-700 border-blue-100",
          },
          {
            label: "Zilizotumika",
            value: stats.usedVouchers,
            icon: "✅",
            color: "bg-emerald-50 text-emerald-700 border-emerald-100",
          },
          {
            label: "Hazijatumiwa",
            value: stats.unusedVouchers,
            icon: "📦",
            color: "bg-purple-50 text-purple-700 border-purple-100",
          },
          {
            label: "Mwezi Huu",
            value: stats.monthlyVouchers,
            icon: "📅",
            color: "bg-amber-50 text-amber-700 border-amber-100",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {card.label}
                </p>
                <p className="text-2xl font-black mt-1 text-slate-900">
                  {card.value}
                </p>
              </div>
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center border text-lg ${card.color}`}
              >
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Access Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-slate-800">⚡ Njia za Haraka</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/vendor/vouchers"
            className="flex items-center justify-between p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎫</span>
              <div>
                <div className="font-bold text-sm text-slate-900 group-hover:text-emerald-700">
                  Zalisha Vocha Mpya
                </div>
                <div className="text-xs text-slate-500">
                  Chagua router, muda, bei, kisha chapisha
                </div>
              </div>
            </div>
            <span className="text-emerald-600 font-bold">→</span>
          </Link>

          <Link
            href="/vendor/reports"
            className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <div className="font-bold text-sm text-slate-900 group-hover:text-brand-600">
                  Ripoti ya Mauzo
                </div>
                <div className="text-xs text-slate-500">
                  Tazama mauzo ya siku 7 na aina zinazopendwa
                </div>
              </div>
            </div>
            <span className="text-slate-400 group-hover:text-slate-700 font-bold">
              →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
