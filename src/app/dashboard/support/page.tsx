"use client";

import { useEffect, useState, useCallback } from "react";
<<<<<<< HEAD
import { authFetch } from "@/lib/client-auth";
=======
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a

interface Client {
  id: number;
  dashboardUsername: string | null;
  businessName: string;
  routerIp: string;
  routerPort: number;
  vpnIp: string | null;
  status: string;
  monthlyFee: string;
  subscriptionEnd: string;
  createdAt: string;
  userName: string;
  userUsername: string | null;
  userEmail: string | null;
  userPhone: string | null;
}

interface DiagnosticsResult {
  routerOnline: boolean;
  message: string;
  latency: string;
  activeUsers: number;
  activeUserList?: Array<{
    name: string;
    profile: string;
    uptime: string;
    address: string;
  }>;
  businessName: string;
  routerIp: string;
  subscriptionEnd: string;
}

export default function SupportPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsResult | null>(null);
  const [diagLoading, setDiagLoading] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [blocking, setBlocking] = useState(false);
  const [blockSuccess, setBlockSuccess] = useState("");

  const loadClients = useCallback(async () => {
    try {
<<<<<<< HEAD
      const res = await authFetch("/api/clients");
=======
      const res = await fetch("/api/clients");
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  async function runDiagnostics(clientId: number) {
    setSelectedClient(clientId);
    setDiagLoading(true);
    setDiagnostics(null);

    try {
<<<<<<< HEAD
      const res = await authFetch(`/api/clients/${clientId}/diagnostics`, {
=======
      const res = await fetch(`/api/clients/${clientId}/diagnostics`, {
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
        method: "POST",
      });
      const data = await res.json();
      setDiagnostics(data);
    } catch {
      setDiagnostics({
        routerOnline: false,
        message: "Imeshindikana kuunganisha na router",
        latency: "N/A",
        activeUsers: 0,
        businessName: "",
        routerIp: "",
        subscriptionEnd: "",
      });
    }
    setDiagLoading(false);
  }

  async function blockClient(clientId: number) {
    if (!blockReason) {
      alert("Tafadhali weka sababu ya kuzuia");
      return;
    }
    setBlocking(true);
    try {
<<<<<<< HEAD
      const res = await authFetch(`/api/clients/${clientId}/block-user`, {
=======
      const res = await fetch(`/api/clients/${clientId}/block-user`, {
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: blockReason }),
      });
      const data = await res.json();
      if (res.ok) {
        setBlockSuccess("✅ Huduma imezimwa kikamilifu");
        loadClients();
      } else {
        setBlockSuccess(`❌ ${data.error}`);
      }
    } catch {
      setBlockSuccess("❌ Imeshindikana kuzuia");
    }
    setBlocking(false);
  }

  async function reactivateClient(clientId: number) {
<<<<<<< HEAD
    const res = await authFetch(`/api/clients/${clientId}/toggle`, {
=======
    const res = await fetch(`/api/clients/${clientId}/toggle`, {
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "activate" }),
    });
    if (res.ok) {
      loadClients();
      setBlockSuccess("✅ Huduma imewashwa tena");
    }
  }

  const filteredClients = clients.filter(
    (c) =>
      c.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.userName && c.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.routerIp.includes(searchTerm) ||
      (c.dashboardUsername &&
        c.dashboardUsername.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Support Header */}
<<<<<<< HEAD
      <div className="bg-gradient-to-r from-brand-700 to-brand-900 rounded-2xl p-6 text-white">
=======
      <div className="bg-linear-to-r from-brand-700 to-brand-900 rounded-2xl p-6 text-white">
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">🎧 Msaada wa Wateja</h2>
            <p className="text-brand-200 text-sm mt-1">
              Angalia router za wateja online/offline, zuia huduma, au wasaidie kimtandao
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="tel:0777378300"
              className="px-5 py-3 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold border border-white/30 transition-colors flex items-center gap-2"
            >
              📞 <span className="text-lg">0777 378 300</span>
            </a>
          </div>
        </div>
      </div>

      {blockSuccess && (
        <div
          className={`p-4 rounded-2xl text-sm animate-fadeIn ${
            blockSuccess.startsWith("✅")
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-800"
          }`}
        >
          {blockSuccess}
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="🔍 Tafuta mteja kwa jina, username, au IP..."
          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-500"
        />
      </div>

      {/* Client List */}
      <div className="space-y-3">
        {filteredClients.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
            <p className="text-3xl mb-2">🔍</p>
            <p className="font-medium text-slate-600">Hakuna mteja anayelingana</p>
          </div>
        ) : (
          filteredClients.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden"
            >
              <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      c.status === "active"
                        ? "bg-emerald-500 animate-pulse"
                        : c.status === "suspended"
                          ? "bg-amber-500"
                          : "bg-rose-500"
                    }`}
                  />
                  <div>
                    <div className="font-bold text-slate-900">
                      {c.businessName}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {c.userName}{" "}
                      {c.dashboardUsername ? `(${c.dashboardUsername})` : ""}
                      {c.userPhone ? ` • ${c.userPhone}` : ""}
                    </div>
                    <div className="text-xs font-mono text-slate-500 mt-0.5">
                      {c.routerIp}{c.vpnIp ? ` → VPN: ${c.vpnIp}` : ""} • Port: {c.routerPort}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      c.status === "active"
                        ? "bg-emerald-100 text-emerald-800"
                        : c.status === "suspended"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {c.status === "active"
                      ? "✅ Inafanya Kazi"
                      : c.status === "suspended"
                        ? "⏸️ Imesimamishwa"
                        : "❌ Imechelewa"}
                  </span>

                  <button
                    onClick={() => runDiagnostics(c.id)}
                    className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg text-xs font-bold border border-brand-200 transition-colors"
                  >
                    🔍 Angalia
                  </button>

                  {c.status === "active" ? (
                    <button
                      onClick={() => {
                        setSelectedClient(c.id);
                        setBlockReason("");
                        setBlockSuccess("");
                      }}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold border border-rose-200 transition-colors"
                    >
                      🚫 Zima Huduma
                    </button>
                  ) : (
                    <button
                      onClick={() => reactivateClient(c.id)}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200 transition-colors"
                    >
                      🔓 Washa
                    </button>
                  )}
                </div>
              </div>

              {/* Block Form */}
              {selectedClient === c.id && blockReason !== undefined && (
                <div className="px-4 pb-4 border-t border-slate-100 pt-3 animate-fadeIn">
                  <h4 className="text-xs font-bold text-rose-700 mb-2">
                    Zima Huduma ya "{c.businessName}"
                  </h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                      placeholder="Sababu ya kuzuia (mfano: Hajalipia mwezi huu)"
                      className="flex-1 px-3 py-2 border border-rose-200 rounded-lg text-xs outline-none focus:border-rose-500"
                    />
                    <button
                      onClick={() => blockClient(c.id)}
                      disabled={blocking || !blockReason}
                      className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 disabled:opacity-50"
                    >
                      {blocking ? "Inazima..." : "Zima Sasa"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Diagnostics Panel */}
      {selectedClient && diagnostics !== null && !diagLoading && (
        <div className="bg-white rounded-2xl border-2 border-brand-200 p-6 animate-fadeIn">
          <h3 className="font-bold text-lg text-brand-800 mb-4">
            📡 Matokeo ya Uchunguzi —{" "}
            {diagnostics.businessName || "Router"}
          </h3>

          {diagnostics.routerOnline ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-emerald-50 p-4 rounded-xl text-center">
                  <div className="text-2xl mb-1">✅</div>
                  <div className="text-xs text-emerald-600">Router</div>
                  <div className="text-sm font-black text-emerald-800">
                    ONLINE
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl text-center">
                  <div className="text-2xl mb-1">⏱️</div>
                  <div className="text-xs text-blue-600">Latency</div>
                  <div className="text-sm font-black text-blue-800">
                    {diagnostics.latency}
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl text-center">
                  <div className="text-2xl mb-1">👤</div>
                  <div className="text-xs text-purple-600">Active Users</div>
                  <div className="text-sm font-black text-purple-800">
                    {diagnostics.activeUsers}
                  </div>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl text-center">
                  <div className="text-2xl mb-1">🌐</div>
                  <div className="text-xs text-amber-600">Router IP</div>
                  <div className="text-sm font-mono font-black text-amber-800">
                    {diagnostics.routerIp}
                  </div>
                </div>
              </div>

              {diagnostics.activeUserList &&
                diagnostics.activeUserList.length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-slate-500 mb-2">
                      WANAOTUMIA HOTSPOT SASA HIVI:
                    </h4>
                    <div className="space-y-2">
                      {diagnostics.activeUserList.map((u, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                              {i + 1}
                            </span>
                            <div>
                              <div className="font-mono font-bold text-sm text-slate-800">
                                {u.name}
                              </div>
                              <div className="text-xs text-slate-400">
                                {u.address}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-bold text-slate-700">
                              {u.profile}
                            </div>
                            <div className="text-xs text-slate-400">
                              {u.uptime}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          ) : (
            <div className="bg-rose-50 border border-rose-200 p-6 rounded-xl text-center">
              <span className="text-4xl block mb-3">❌</span>
              <h4 className="font-bold text-rose-800 mb-1">
                Router haiko Online
              </h4>
              <p className="text-sm text-rose-600">{diagnostics.message}</p>
              <div className="mt-3 p-3 bg-white rounded-lg border border-rose-200 text-xs text-slate-600 space-y-1 text-left">
                <p className="font-bold">Mambo ya Kuangalia:</p>
                <p>1. Je, router iko waka (imeunganishwa na umeme)?</p>
                <p>2. Je, IP ya router ({diagnostics.routerIp}) ni sahihi?</p>
                <p>
                  3. Je, API imewashwa? (WinBox → IP → Services → api → enabled)
                </p>
                <p>
                  4. Je, WireGuard VPN ipo kwenye seva yetu? (Angalia WireGuard config)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {diagLoading && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Inapima router...</p>
        </div>
      )}
    </div>
  );
}
