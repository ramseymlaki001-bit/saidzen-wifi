"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
<<<<<<< HEAD
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/client-auth";

export default function VendorSettings() {
  const router = useRouter();
=======

export default function VendorSettings() {
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState("");

  // ── ROUTER ZANGU (weka API password ili mfumo uweze kuongea nazo) ──
  interface MyRouter {
    id: number;
    businessName: string;
    routerIp: string;
    routerPort: number;
    vpnIp: string | null;
    status: string;
  }
  const [routers, setRouters] = useState<MyRouter[]>([]);
  const [routerForms, setRouterForms] = useState<Record<string, {
    routerUsername: string; routerPassword: string;
  }>>({});
  const [savingRouter, setSavingRouter] = useState<number | null>(null);
  const [routerMsg, setRouterMsg] = useState("");

  useEffect(() => {
<<<<<<< HEAD
    authFetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.userId) {
          setSession(data);
        } else {
          router.push("/login");
=======
    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setSession(data);
        } else {
          window.location.href = "/login";
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
        }
        setLoading(false);
      })
      .catch(() => {
<<<<<<< HEAD
        router.push("/login");
      });

    // Pakia router zangu
    authFetch("/api/clients/mine")
=======
        window.location.href = "/login";
      });

    // Pakia router zangu
    fetch("/api/clients/mine")
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        const list = Array.isArray(d) ? d : [];
        setRouters(list);
        const forms: Record<string, { routerUsername: string; routerPassword: string }> = {};
        for (const rt of list) {
          forms[String(rt.id)] = { routerUsername: rt.routerUsername || "admin", routerPassword: "" };
        }
        setRouterForms(forms);
      })
      .catch(() => setRouters([]));
  }, []);

  // ── Hifadhi taarifa za API za router ──
  async function saveRouter(id: number) {
    const f = routerForms[String(id)];
    if (!f) return;
    if (!f.routerPassword) {
      setRouterMsg("⚠️ Weka nenosiri la API ya router");
      return;
    }
    setSavingRouter(id);
    setRouterMsg("");
    try {
<<<<<<< HEAD
      const res = await authFetch(`/api/clients/${id}`, {
=======
      const res = await fetch(`/api/clients/${id}`, {
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routerUsername: f.routerUsername,
          routerPassword: f.routerPassword,
        }),
      });
      const d = await res.json();
      if (res.ok) {
        setRouterMsg(`✅ ${d.message} — sasa mfumo unaweza kuzalisha vocha kwenye router hiyo.`);
        setRouterForms((prev) => ({
          ...prev,
          [String(id)]: { routerUsername: f.routerUsername, routerPassword: "" },
        }));
      } else {
        setRouterMsg(`❌ ${d.error}`);
      }
    } catch {
      setRouterMsg("❌ Kosa la mtandao");
    }
    setSavingRouter(null);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMsg("❌ Manenosiri hayalingani");
      return;
    }
    setChangingPassword(true);
    setMsg("");

    try {
<<<<<<< HEAD
      const res = await authFetch("/api/auth/change-password", {
=======
      const res = await fetch("/api/auth/change-password", {
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg("✅ Nenosiri limebadilishwa!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMsg(`❌ ${data.error}`);
      }
    } catch {
      setMsg("❌ Kosa la mtandao");
    }
    setChangingPassword(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">⚙️ Mipangilio ya Akaunti</h2>

      {/* Account Info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h3 className="font-bold text-base text-slate-800">Taarifa za Akaunti</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-400 block text-xs">Jina:</span>
            <span className="font-semibold text-slate-800">{session?.name}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-xs">Username:</span>
            <span className="font-mono font-bold text-slate-800">{session?.username}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-xs">Router IP:</span>
            <span className="font-mono text-slate-800">{session?.routerIp || "Haipo"}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-xs">API Port:</span>
            <span className="font-mono text-slate-800">{session?.routerPort || 8728}</span>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h3 className="font-bold text-base text-slate-800">🔒 Badilisha Nenosiri</h3>
        {msg && (
          <div
            className={`text-xs px-4 py-3 rounded-xl ${
              msg.startsWith("✅")
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}
          >
            {msg}
          </div>
        )}
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Nenosiri la Sasa
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Nenosiri Jipya
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Rudia Nenosiri Jipya
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={changingPassword}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
          >
            {changingPassword ? "Inabadilisha..." : "Badilisha Nenosiri"}
          </button>
        </form>
      </div>

      {/* ── ROUTER ZANGU: weka API password ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="border-b pb-3">
          <h3 className="font-bold text-base text-slate-800">
            📡 Router Zangu — Taarifa za API
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Weka username na nenosiri la API ya kila router ili mfumo uweze
            kuzalisha vocha, kuzima/kuwasha hotspot, na kupima muunganisho.
          </p>
        </div>

        {routerMsg && (
          <div
            className={`px-4 py-2.5 rounded-xl text-xs font-medium ${
              routerMsg.startsWith("✅")
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}
          >
            {routerMsg}
          </div>
        )}

        {routers.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">
            Huna router bado. Ongeza kutoka kwenye dashibodi yako.
          </p>
        ) : (
          <div className="space-y-3">
            {routers.map((rt) => (
              <div
                key={rt.id}
                className="border border-slate-200 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="font-bold text-sm text-slate-900">
                      {rt.businessName}
                    </div>
                    <div className="text-xs font-mono text-slate-500">
                      {rt.vpnIp || rt.routerIp}:{rt.routerPort}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      rt.status === "active"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {rt.status === "active" ? "✅ Inafanya Kazi" : "⛔ Imesimama"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      API Username
                    </label>
                    <input
                      value={routerForms[String(rt.id)]?.routerUsername || ""}
                      onChange={(e) =>
                        setRouterForms({
                          ...routerForms,
                          [String(rt.id)]: {
                            ...routerForms[String(rt.id)],
                            routerUsername: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      🔑 API Password{" "}
                      <span className="text-slate-400 font-normal">
                        (weka upya ili kusasisha)
                      </span>
                    </label>
                    <input
                      type="password"
                      value={routerForms[String(rt.id)]?.routerPassword || ""}
                      onChange={(e) =>
                        setRouterForms({
                          ...routerForms,
                          [String(rt.id)]: {
                            ...routerForms[String(rt.id)],
                            routerPassword: e.target.value,
                          },
                        })
                      }
                      placeholder="••••••••"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  onClick={() => saveRouter(rt.id)}
                  disabled={savingRouter === rt.id}
                  className="w-full py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
                >
                  {savingRouter === rt.id
                    ? "Inahifadhi..."
                    : "💾 Hifadhi Taarifa za API"}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800">
          <strong>💡 Kumbuka:</strong> Nenosiri la API linahifadhiwa likiwa
          limefichwa (encrypted) kwenye hifadhidata. Kama mteja atabadilisha
          nenosiri la router, rudi hapa usasishe — vinginevyo mfumo hautaweza
          kuzalisha vocha.
        </div>
      </div>

      {/* WireGuard Setup Guide */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h3 className="font-bold text-base text-slate-800">📡 WireGuard VPN Setup</h3>
        <p className="text-xs text-slate-500">
          WireGuard VPN inakuunganisha router yako na seva yetu kwa usalama.
          Fungua Terminal kwenye router yako ya MikroTik na andika amri hizi:
        </p>

        <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs text-emerald-400 space-y-2">
          <p className="text-slate-400"># 1. Install WireGuard package</p>
          <p>/system package install file=wireguard</p>
          <br />
          <p className="text-slate-400"># 2. Add WireGuard interface</p>
          <p>/interface wireguard add name=wg-saidzen listen-port=51820</p>
          <br />
          <p className="text-slate-400"># 3. Set IP address</p>
          <p>/ip address add address=10.8.0.2/24 interface=wg-saidzen</p>
          <br />
          <p className="text-slate-400"># 4. Add peer (SaidZen server)</p>
          <p>/interface wireguard peers add</p>
          <p>&nbsp;&nbsp;interface=wg-saidzen</p>
          <p>&nbsp;&nbsp;public-key=SAIDZEN_PUBLIC_KEY</p>
          <p>&nbsp;&nbsp;endpoint=SEVA_IP:51820</p>
          <p>&nbsp;&nbsp;allowed-address=10.8.0.0/24</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
          <strong>💡 Kidokezo:</strong> Baada ya kuweka WireGuard, weka IP ya VPN (mfano{" "}
          <code className="font-mono bg-amber-100 px-1 rounded">10.8.0.2</code>) kwenye
          mipangilio ya router yako hapa SaidZen WiFi.
        </div>
      </div>

      {/* Cron Job Setup */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h3 className="font-bold text-base text-slate-800">⏰ Cron Job (Auto Malipo Check)</h3>
        <p className="text-xs text-slate-500">
          Weka cron job kwenye VPS yako ili mfumo ukague malipo kila siku kiotomatiki:
        </p>
        <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs text-emerald-400">
          <p className="text-slate-400"># Fungua crontab:</p>
          <p>crontab -e</p>
          <br />
          <p className="text-slate-400"># Weka line hii (kila siku saa 12:00 usiku):</p>
          <p>0 0 * * * curl -s http://localhost:3000/api/cron/check-payments &gt;&gt; /var/log/saidzen-cron.log 2&gt;&amp;1</p>
        </div>
      </div>
    </div>
  );
}
