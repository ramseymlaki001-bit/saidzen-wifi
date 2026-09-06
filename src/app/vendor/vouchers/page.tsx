"use client";

import { useEffect, useState, useCallback } from "react";
import { authFetch } from "@/lib/client-auth";

interface Profile {
  id: number;
  name: string;
  duration: string;
  price: string;
  speedLimit: string | null;
  mikrotikProfile: string;
}

interface Voucher {
  id: number;
  code: string;
  password: string;
  profile: string;
  duration: string;
  price: string;
}

interface ExistingVoucher {
  id: number;
  code: string;
  password: string;
  status: string;
  createdAt: string;
  usedAt: string | null;
  profileName: string;
  profileDuration: string;
  profilePrice: string;
  businessName?: string;
}

interface Router {
  id: number;
  businessName: string;
  routerIp: string;
  routerPort: number;
  vpnIp: string | null;
  status: string;
  subscriptionEnd: string;
  location?: string | null;
}

export default function VouchersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState("");
  const [count, setCount] = useState("10");
  const [generating, setGenerating] = useState(false);
  const [generatedVouchers, setGeneratedVouchers] = useState<Voucher[]>([]);
  const [existingVouchers, setExistingVouchers] = useState<ExistingVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"generate" | "list">("generate");
  const [printFormat, setPrintFormat] = useState<"grid" | "pos">("grid");
  const [copySuccess, setCopySuccess] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string>("");
  // Multi-router support
  const [routers, setRouters] = useState<Router[]>([]);
  const [selectedRouter, setSelectedRouter] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Load routers first (to know if multi-router)
      const sRes = await authFetch("/api/stats");
      const sData = await sRes.json();
      const routersList: Router[] = sData.routers || [];
      setRouters(routersList);

      // Determine which clientId to use
      let cid = selectedRouter;
      if (!cid && routersList.length > 0) {
        cid = String(routersList[0].id);
      }

      const suffix = cid ? `?clientId=${cid}` : "";

      const [pRes, vRes] = await Promise.all([
        authFetch(`/api/vouchers/profiles${suffix}`),
        authFetch(`/api/vouchers${suffix}`),
      ]);
      const profilesData = await pRes.json();
      const vouchersData = await vRes.json();

      setProfiles(Array.isArray(profilesData) ? profilesData : []);
      setExistingVouchers(Array.isArray(vouchersData) ? vouchersData : []);
      // Reset selected profile if it's not in the new list
      setSelectedProfile("");
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [selectedRouter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProfile) return;

    setGenerating(true);
    setError("");
    setGeneratedVouchers([]);

    try {
      const res = await authFetch("/api/vouchers/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: parseInt(selectedProfile),
          count: parseInt(count),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Imeshindikana kuzalisha vocha");
      } else {
        setGeneratedVouchers(data.vouchers);
        loadData();
      }
    } catch {
      setError("Kosa la mtandao. Jaribu tena.");
    }

    setGenerating(false);
  }

  function handlePrint() {
    window.print();
  }

  /** Kusawazisha matumizi halisi ya vocha kutoka kwenye router */
  async function handleSync() {
    setSyncing(true);
    setSyncResult("");
    try {
      const suffix = selectedRouter ? `?clientId=${selectedRouter}` : "";
      const res = await authFetch(`/api/vouchers/sync${suffix}`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setSyncResult(`❌ ${data.error || "Imeshindikana"}`);
      } else if (data.routersOnline === 0) {
        setSyncResult(
          "⚠️ Router haiko hewani. Hakikisha WireGuard imeshikamana na router iko waka."
        );
      } else if (data.totalSynced === 0) {
        setSyncResult(
          `✅ Hakuna vocha mpya zinazotumika. Wateja ${data.results[0]?.activeUsersOnRouter || 0} wako aktifi kwenye router.`
        );
      } else {
        setSyncResult(
          `✅ Vocha ${data.totalSynced} zimesasishwa kuwa "Imetumika"! Ripoti zimesasishwa.`
        );
        loadData(); // Onyesha data mpya
      }
    } catch {
      setSyncResult("❌ Kosa la mtandao");
    }
    setSyncing(false);
    setTimeout(() => setSyncResult(""), 8000);
  }

  function handleCopyAll() {
    if (generatedVouchers.length === 0) return;
    const text = generatedVouchers
      .map(
        (v) =>
          `Vocha: ${v.code} | Pass: ${v.password} | ${v.profile} | TSh ${v.price}`
      )
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  }

  if (loading && routers.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeRouter = routers.find((r) => String(r.id) === selectedRouter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Zalisha Vocha za Hotspot
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm">
            {routers.length > 1
              ? `Una router ${routers.length}. Chagua router unalotaka kuzalishia vocha`
              : "Vocha zinatumwa moja kwa moja kwenye router yako ya MikroTik"}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("generate")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === "generate"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            ⚡ Zalisha Vocha
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === "list"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            📋 Orodha ({existingVouchers.length})
          </button>
        </div>
      </div>

      {/* Router Selector (multi-router support) */}
      {routers.length > 1 && (
        <div className="bg-white rounded-2xl border-2 border-brand-200 p-4 no-print">
          <label className="block text-xs font-bold uppercase tracking-wider text-brand-700 mb-2">
            📡 Chagua Router (Hotspot) Unayotaka Kuzalishia Vocha
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {routers.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedRouter(String(r.id))}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  selectedRouter === String(r.id)
                    ? "border-brand-500 bg-brand-50 shadow-md"
                    : "border-slate-200 hover:border-brand-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 truncate">
                    {r.businessName}
                  </span>
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      r.status === "active"
                        ? "bg-emerald-500"
                        : r.status === "suspended"
                          ? "bg-amber-500"
                          : "bg-rose-500"
                    }`}
                  />
                </div>
                <div className="text-xs font-mono text-slate-500 mt-0.5">
                  {r.routerIp}
                  {r.vpnIp ? ` → VPN ${r.vpnIp}` : ""}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Matokeo ya kusawazisha */}
      {syncResult && (
        <div className="bg-white border-2 border-amber-200 text-amber-900 px-4 py-3 rounded-2xl text-xs font-medium animate-fadeIn no-print">
          {syncResult}
        </div>
      )}

      {activeTab === "generate" && (
        <>
          {/* Generate Form */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm no-print space-y-6">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs">
                ⚠️ {error}
              </div>
            )}

            {activeRouter && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold text-emerald-800">
                    Router: <strong>{activeRouter.businessName}</strong> (
                    <span className="font-mono">{activeRouter.routerIp}</span>)
                  </span>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold">
                  IMEUNGANISHWA
                </span>
              </div>
            )}

            <form onSubmit={handleGenerate} className="space-y-6">
              {/* Profile Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  1. Chagua Aina ya Vocha / Kifurushi
                </label>
                {profiles.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm bg-slate-50 rounded-2xl">
                    Hakuna vifurushi vya vocha kwa router hii
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {profiles.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedProfile(String(p.id))}
                        className={`p-4 rounded-2xl border-2 text-left transition-all ${
                          selectedProfile === String(p.id)
                            ? "border-emerald-500 bg-emerald-50/50 shadow-md shadow-emerald-500/10"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xl">⏱️</span>
                          <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
                            {p.duration}
                          </span>
                        </div>
                        <div className="font-black text-sm text-slate-900">
                          {p.name}
                        </div>
                        <div className="text-base font-black text-emerald-600 mt-1">
                          TSh {Number(p.price).toLocaleString()}
                        </div>
                        {p.speedLimit && (
                          <div className="text-[10px] text-slate-400 mt-1">
                            Kasi: {p.speedLimit}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Count */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  2. Idadi ya Vocha Unazotaka
                </label>
                <div className="flex gap-2 flex-wrap items-center">
                  {["5", "10", "20", "50", "100"].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setCount(n)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        count === n
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      Vocha {n}
                    </button>
                  ))}
                  <div className="flex items-center gap-1 text-xs text-slate-500 ml-2">
                    <span>au andika:</span>
                    <input
                      type="number"
                      min="1"
                      max="200"
                      value={count}
                      onChange={(e) => setCount(e.target.value)}
                      className="w-16 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-center font-bold outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <div className="text-xs text-slate-500">
                  Amri:{" "}
                  <code className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono">
                    /ip/hotspot/user/add
                  </code>
                </div>

                <button
                  type="submit"
                  disabled={generating || !selectedProfile}
                  className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm shadow-lg shadow-emerald-600/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {generating ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Inatuma Kwenye Router...
                    </>
                  ) : (
                    `⚡ Zalisha Vocha ${count} Sasa`
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Generated Vouchers - Printable */}
          {generatedVouchers.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 no-print">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎉</span>
                  <div>
                    <h3 className="font-bold text-sm text-emerald-950">
                      Vocha {generatedVouchers.length} Zimetengenezwa!
                    </h3>
                    <p className="text-xs text-emerald-700">
                      Ziko tayari kuuzwa kwa wateja
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="bg-white rounded-xl p-1 border border-emerald-200 flex text-xs">
                    <button
                      onClick={() => setPrintFormat("grid")}
                      className={`px-2.5 py-1 rounded-lg font-bold ${
                        printFormat === "grid"
                          ? "bg-emerald-600 text-white"
                          : "text-slate-600"
                      }`}
                    >
                      Kadi
                    </button>
                    <button
                      onClick={() => setPrintFormat("pos")}
                      className={`px-2.5 py-1 rounded-lg font-bold ${
                        printFormat === "pos"
                          ? "bg-emerald-600 text-white"
                          : "text-slate-600"
                      }`}
                    >
                      POS
                    </button>
                  </div>

                  <button
                    onClick={handleCopyAll}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    {copySuccess ? "✓ Zimenakiliwa!" : "📋 Nakili"}
                  </button>

                  <button
                    onClick={handlePrint}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    🖨️ Chapisha
                  </button>

                  <a
                    href={`/api/export/csv?type=vouchers${selectedRouter ? `&clientId=${selectedRouter}` : ""}`}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    📥 CSV
                  </a>

                  <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                    title="Angalia vocha zipi wateja wanaotumia sasa hivi"
                  >
                    {syncing ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Inasawazisha...
                      </>
                    ) : (
                      <>🔄 Sawazisha</>
                    )}
                  </button>
                </div>
              </div>

              {/* Printable Header */}
              <div className="print-only text-center mb-6">
                <h1 className="text-xl font-black">
                  {activeRouter?.businessName || "SaidZen WiFi Hotspot"}
                </h1>
                <p className="text-xs text-slate-500">
                  Tarehe: {new Date().toLocaleDateString("sw-TZ")} • Vocha:{" "}
                  {generatedVouchers.length}
                </p>
              </div>

              {printFormat === "grid" ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {generatedVouchers.map((v) => (
                    <div
                      key={v.id}
                      className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-4 text-center space-y-2"
                    >
                      <div className="flex justify-between items-center text-[10px] border-b pb-1">
                        <span className="font-bold text-slate-800">
                          {activeRouter?.businessName?.slice(0, 12) ||
                            "SaidZen WiFi"}
                        </span>
                        <span className="font-semibold text-emerald-600">
                          {v.duration}
                        </span>
                      </div>
                      <div className="py-1">
                        <div className="text-[10px] uppercase font-bold text-slate-400">
                          Username
                        </div>
                        <div className="font-mono text-lg font-black text-slate-950 tracking-wider">
                          {v.code}
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-xl py-1 px-2 flex justify-between text-xs">
                        <span className="text-[10px] text-slate-500">Pass:</span>
                        <span className="font-mono font-bold text-slate-900">
                          {v.password}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 border-t text-xs font-black">
                        <span className="text-[11px] text-slate-500">
                          {v.profile}
                        </span>
                        <span className="text-emerald-600">
                          TSh {Number(v.price).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="max-w-xs mx-auto space-y-3 bg-white p-4 rounded-2xl border border-slate-200 font-mono text-xs">
                  <div className="text-center border-b-2 border-dashed border-slate-300 pb-2">
                    <div className="font-black text-base">
                      {activeRouter?.businessName?.toUpperCase() ||
                        "SAIDZEN WIFI"}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      STAKABADHI YA VOCHA
                    </div>
                  </div>
                  {generatedVouchers.map((v, idx) => (
                    <div
                      key={v.id}
                      className="border-b border-dashed border-slate-200 pb-2 space-y-1"
                    >
                      <div className="flex justify-between font-bold">
                        <span>VOCHA #{idx + 1}</span>
                        <span>{v.duration}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded text-center my-1">
                        <div className="text-[10px] text-slate-500">
                          USERNAME
                        </div>
                        <div className="text-base font-black tracking-widest">
                          {v.code}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          PASSWORD: {v.password}
                        </div>
                      </div>
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>BEI:</span>
                        <span>TSH {Number(v.price).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === "list" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          {existingVouchers.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <p className="text-4xl mb-3">🎫</p>
              <p className="font-bold text-slate-700">
                Hakuna vocha zilizozalishwa
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Bonyeza &quot;Zalisha Vocha&quot; kutoa vocha mpya
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b">
                  <tr>
                    <th className="text-left px-6 py-3.5">Code (Username)</th>
                    <th className="text-left px-6 py-3.5">Password</th>
                    {routers.length > 1 && (
                      <th className="text-left px-6 py-3.5">Router</th>
                    )}
                    <th className="text-left px-6 py-3.5">Aina</th>
                    <th className="text-left px-6 py-3.5">Bei</th>
                    <th className="text-left px-6 py-3.5">Hali</th>
                    <th className="text-left px-6 py-3.5">Tarehe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {existingVouchers.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/80">
                      <td className="px-6 py-3 font-mono font-black text-slate-900 text-sm">
                        {v.code}
                      </td>
                      <td className="px-6 py-3 font-mono text-slate-600">
                        {v.password}
                      </td>
                      {routers.length > 1 && (
                        <td className="px-6 py-3 text-slate-500">
                          {(v as any).businessName || "-"}
                        </td>
                      )}
                      <td className="px-6 py-3 font-medium">
                        {v.profileName} ({v.profileDuration})
                      </td>
                      <td className="px-6 py-3 font-bold text-slate-900">
                        TSh {Number(v.profilePrice).toLocaleString()}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            v.status === "unused"
                              ? "bg-emerald-100 text-emerald-800"
                              : v.status === "used"
                                ? "bg-slate-100 text-slate-600"
                                : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {v.status === "unused"
                            ? "Haijatumiwa"
                            : v.status === "used"
                              ? "Imetumika"
                              : "Imepitwa"}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-500">
                        {new Date(v.createdAt).toLocaleDateString("sw-TZ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
