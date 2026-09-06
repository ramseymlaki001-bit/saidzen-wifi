"use client";

import { useEffect, useState, useCallback } from "react";
import { authFetch } from "@/lib/client-auth";

interface Config {
  publicKeySet: boolean;
  endpointSet: boolean;
  configured: boolean;
  endpoint: string;
  publicKeyPreview: string;
  port: number;
  subnetPrefix: string;
  hotspotLoginUrl: string;
  businessPhone: string;
  businessName: string;
  appUrl: string;
  mikrotikSimulation?: boolean;
  database?: { host: string; port: number; database: string; ssl: boolean; provider: string };
  cronSecretSet?: boolean;
  encryptionKeyIsDefault?: boolean;
}

const LABELS: Record<string, string> = {
  WIREGUARD_SERVER_PUBLIC_KEY: "Funguo ya Umma ya WireGuard (Server Public Key)",
  WIREGUARD_SERVER_ENDPOINT: "IP ya Umma ya Seva (Endpoint)",
  WIREGUARD_PORT: "Bandari ya WireGuard",
  WIREGUARD_SUBNET_PREFIX: "Mtandao wa VPN (mfano 10.8.0)",
  BUSINESS_NAME: "Jina la Biashara (linaonekana kwenye command)",
  BUSINESS_PHONE: "Namba ya Msaada",
  HOTSPOT_LOGIN_URL: "Anwani ya Ukurasa wa Hotspot (hiari)",
};

export default function AdminSettingsPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState<Record<string, string>>({});

  // ── KUBADILISHA NENOSIRI LA ADMIN ──
  const [pw, setPw] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState("");

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg("");

    if (pw.newPassword !== pw.confirmPassword) {
      setPwMsg("❌ Manenosiri mapya hayalingani");
      return;
    }
    if (pw.newPassword.length < 6) {
      setPwMsg("❌ Nenosiri jipya liwe na herufi 6 au zaidi");
      return;
    }
    if (pw.newPassword === pw.currentPassword) {
      setPwMsg("❌ Nenosiri jipya lisifanane na la zamani");
      return;
    }

    setPwSaving(true);
    try {
      const res = await authFetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: pw.currentPassword,
          newPassword: pw.newPassword,
        }),
      });
      const d = await res.json();
      if (res.ok) {
        setPwMsg("✅ Nenosiri limebadilishwa! Tumia nenosiri jipya kuingia mara ijayo.");
        setPw({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setPwMsg(`❌ ${d.error || "Imeshindikana kubadilisha nenosiri"}`);
      }
    } catch {
      setPwMsg("❌ Kosa la mtandao");
    }
    setPwSaving(false);
  }

  const load = useCallback(async () => {
    try {
      const res = await authFetch("/api/settings");
      const data = await res.json();
      if (data.config) setConfig(data.config);
    } catch {
      /* kimya */
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    const updates = Object.fromEntries(
      Object.entries(form).filter(([, v]) => v !== "" && v !== undefined)
    );

    if (Object.keys(updates).length === 0) {
      setMsg("⚠️ Hakuna kilichobadilishwa");
      return;
    }

    setSaving(true);
    setMsg("");
    try {
      const res = await authFetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg(`✅ ${data.message}`);
        setForm({});
        load();
      } else {
        setMsg(`❌ ${data.error}`);
      }
    } catch {
      setMsg("❌ Kosa la mtandao");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const keys = [
    "WIREGUARD_SERVER_PUBLIC_KEY",
    "WIREGUARD_SERVER_ENDPOINT",
    "WIREGUARD_PORT",
    "WIREGUARD_SUBNET_PREFIX",
    "BUSINESS_NAME",
    "BUSINESS_PHONE",
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">⚙️ Mipangilio ya Seva</h2>
        <p className="text-slate-500 text-sm">
          Hapa unaweka funguo za WireGuard — hii inafanya command ya mteja
          (<code className="font-mono text-xs">/connect</code>) ifanye kazi.
        </p>
      </div>

      {/* ══════ HALI YA MFUMO (ukaguzi wa uzalishaji) ══════ */}
      {config && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-black text-sm text-slate-900 mb-3">
            🩺 Hali ya Mfumo (Ukaguzi wa Uzalishaji)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div
              className={`px-3 py-2 rounded-xl border ${
                config.mikrotikSimulation
                  ? "bg-amber-50 border-amber-300 text-amber-900"
                  : "bg-emerald-50 border-emerald-200 text-emerald-900"
              }`}
            >
              {config.mikrotikSimulation
                ? "⚠️ MikroTik: HALI YA MAJARIBIO (simulation) — vocha HAZIENDI kwenye router halisi. Ondoa MIKROTIK_SIMULATION kwenye .env."
                : "✅ MikroTik: UZALISHAJI — inaongea na router halisi"}
            </div>
            <div
              className={`px-3 py-2 rounded-xl border ${
                config.database?.ssl
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-slate-50 border-slate-200 text-slate-700"
              }`}
            >
              🗄️ Database: <strong>{config.database?.provider}</strong> —{" "}
              <span className="font-mono">{config.database?.host}</span>
              {config.database?.ssl ? " (SSL ✓)" : " (bila SSL)"}
            </div>
            <div
              className={`px-3 py-2 rounded-xl border ${
                config.cronSecretSet
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-rose-50 border-rose-300 text-rose-900"
              }`}
            >
              {config.cronSecretSet
                ? "✅ CRON_SECRET imewekwa — kazi za kiotomatiki zimelindwa"
                : "🚨 CRON_SECRET HAIJAWEKWA — cron itakataa kufanya kazi kwenye uzalishaji. Weka kwenye .env!"}
            </div>
            <div
              className={`px-3 py-2 rounded-xl border ${
                config.encryptionKeyIsDefault
                  ? "bg-rose-50 border-rose-300 text-rose-900"
                  : "bg-emerald-50 border-emerald-200 text-emerald-900"
              }`}
            >
              {config.encryptionKeyIsDefault
                ? "🚨 ENCRYPTION_KEY ni ya chaguo-msingi — nenosiri za router za wateja hazilindwi ipasavyo. Badilisha kwenye .env (kisha weka upya nenosiri za router)."
                : "✅ ENCRYPTION_KEY ya kipekee imewekwa"}
            </div>
          </div>
        </div>
      )}

      {/* ══════ KUBADILISHA NENOSIRI ══════ */}
      <div className="bg-white rounded-2xl border-2 border-brand-200 p-6 shadow-sm">
        <div className="border-b pb-3 mb-4">
          <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
            🔑 Badilisha Nenosiri Lako
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Kwa usalama wako, badilisha nenosiri la chaguo-msingi mara moja
            baada ya kuanza kutumia mfumo.
          </p>
        </div>

        {pwMsg && (
          <div
            className={`px-4 py-2.5 rounded-xl text-xs font-medium mb-4 ${
              pwMsg.startsWith("✅")
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}
          >
            {pwMsg}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Nenosiri la Sasa
              </label>
              <input
                type="password"
                required
                value={pw.currentPassword}
                onChange={(e) =>
                  setPw({ ...pw, currentPassword: e.target.value })
                }
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Nenosiri Jipya
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={pw.newPassword}
                onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
                placeholder="Herufi 6+"
                autoComplete="new-password"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Rudia Nenosiri Jipya
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={pw.confirmPassword}
                onChange={(e) =>
                  setPw({ ...pw, confirmPassword: e.target.value })
                }
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-[11px] text-slate-400">
              🔒 Nenosiri huhifadhiwa likiwa limefichwa (bcrypt). Hatuhifadhi
              nenosiri wazi kamwe.
            </p>
            <button
              type="submit"
              disabled={pwSaving}
              className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 disabled:opacity-50 shrink-0"
            >
              {pwSaving ? "Inabadilisha..." : "💾 Badilisha"}
            </button>
          </div>
        </form>

        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800">
          <strong>💡 Vidokezo vya usalama:</strong> Tumia herufi kubwa na ndogo,
          namba, na alama. Usitumie nenosiri unalolitumia mahali pengine.
          Ukisahau nenosiri, tumia{" "}
          <a href="/reset-password" className="font-bold underline">
            ukurasa wa kurejesha nenosiri
          </a>
          .
        </div>
      </div>

      {/* Hali ya uwezo */}
      <div
        className={`rounded-2xl p-5 border-2 ${
          config?.configured
            ? "bg-emerald-50 border-emerald-300"
            : "bg-amber-50 border-amber-300"
        }`}
      >
        <div className="flex items-start gap-3">
          <span className="text-3xl">{config?.configured ? "✅" : "⚠️"}</span>
          <div className="flex-1">
            <div
              className={`font-black text-base ${
                config?.configured ? "text-emerald-800" : "text-amber-800"
              }`}
            >
              {config?.configured
                ? "Command ya Mteja Iko Tayari!"
                : "Command ya Mteja HAIJAKAMILIKA"}
            </div>
            <p className="text-xs text-slate-600 mt-1">
              {config?.configured
                ? "Wateja wanaweza kuingia /connect na kupata command inayofanya kazi."
                : "Weka Funguo ya Umma ya WireGuard na IP ya Seva hapa chini. Bila hizi, command inaonyesha placeholder."}
            </p>

            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              <div
                className={`px-2 py-1 rounded-lg ${
                  config?.publicKeySet
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                {config?.publicKeySet ? "✓" : "✗"} Funguo ya Umma
              </div>
              <div
                className={`px-2 py-1 rounded-lg ${
                  config?.endpointSet
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                {config?.endpointSet ? "✓" : "✗"} IP ya Seva
              </div>
            </div>
          </div>
        </div>
      </div>

      {msg && (
        <div className="px-4 py-3 rounded-2xl text-xs font-medium bg-slate-50 border border-slate-200">
          {msg}
        </div>
      )}

      {/* Fomu */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-sm">
        <h3 className="font-bold text-base text-slate-800 border-b pb-3">
          🔧 Thamani za Kusanidi
        </h3>

        {keys.map((key) => {
          const isKey = key === "WIREGUARD_SERVER_PUBLIC_KEY";
          const current = isKey
            ? config?.publicKeyPreview || "(haijawekwa)"
            : String(
                (config as unknown as Record<string, unknown>)?.[
                  key === "WIREGUARD_SERVER_ENDPOINT"
                    ? "endpoint"
                    : key === "WIREGUARD_PORT"
                      ? "port"
                      : key === "WIREGUARD_SUBNET_PREFIX"
                        ? "subnetPrefix"
                        : key === "BUSINESS_NAME"
                          ? "businessName"
                          : key === "BUSINESS_PHONE"
                            ? "businessPhone"
                            : "hotspotLoginUrl"
                ] || ""
              );

          return (
            <div key={key}>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                {LABELS[key]}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type={isKey ? "text" : "text"}
                  value={form[key] ?? ""}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={`Sasa: ${current || "(tupu)"}`}
                  className={`flex-1 px-4 py-2.5 border rounded-xl text-sm outline-none focus:border-brand-500 font-mono ${
                    isKey ? "text-[11px]" : ""
                  } border-slate-200`}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Thamani ya sasa:{" "}
                <span className="font-mono">{current || "(tupu)"}</span>
              </p>
            </div>
          );
        })}

        <div className="pt-3 border-t flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-400">
            Thamani hizi huhifadhiwa kwenye database — huna haja ya kuhariri{" "}
            <code className="font-mono">.env</code> wala kuanzisha upya.
          </p>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 disabled:opacity-50 shadow-md shadow-brand-600/20"
          >
            {saving ? "Inahifadhi..." : "Hifadhi Mipangilio"}
          </button>
        </div>
      </div>

      {/* Maelekezo ya kupata funguo */}
      <div className="bg-slate-900 rounded-2xl p-5 space-y-3">
        <h3 className="font-bold text-sm text-white">
          📡 Jinsi ya Kupata Funguo ya Umma ya WireGuard
        </h3>
        <p className="text-xs text-slate-400">
          Ingia kwenye seva yako kwa SSH, kisha endesha:
        </p>
        <pre className="bg-slate-950 p-3 rounded-xl text-[11px] font-mono text-emerald-400 overflow-x-auto">
{`# 1. Kama WireGuard haijasakinishwa:
apt install -y wireguard

# 2. Tengeneza funguo:
cd /etc/wireguard && umask 077
wg genkey | tee server_private.key | wg pubkey > server_public.key

# 3. Onyesha funguo ya umma (nakili hii):
cat /etc/wireguard/server_public.key

# 4. Onyesha IP ya umma ya seva:
curl -s ifconfig.me`}
        </pre>
        <p className="text-xs text-amber-300">
          ⚠️ Pia fungua <strong>UDP {config?.port || 51820}</strong> kwenye
          Security Group ya seva yako — bila hii WireGuard haitafanya kazi.
        </p>
      </div>

      {/* Ukaguzi wa App URL */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-2">
        <h3 className="font-bold text-sm text-slate-800">
          🌐 Anwani ya Tovuti (Router hutumia hii kujiandikisha)
        </h3>
        <p className="font-mono text-sm text-brand-600 break-all">
          {config?.appUrl}
        </p>
        <p className="text-[11px] text-slate-500">
          Ikiwa hii si sahihi, weka{" "}
          <code className="font-mono">NEXT_PUBLIC_APP_URL=http://IP_YA_SEVA:3000</code>{" "}
          kwenye <code className="font-mono">.env</code> kisha{" "}
          <code className="font-mono">pm2 restart saidzen</code>.
        </p>
      </div>
    </div>
  );
}
