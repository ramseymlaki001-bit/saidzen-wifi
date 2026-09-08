"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface GenerateResult {
  token: string;
  command: string;
  assignedVpnIp: string | null;
  statusUrl: string;
  serverInfo: { configured: boolean; endpoint: string };
  instructions: string[];
}

interface StatusResult {
  status: "pending" | "connected" | "expired" | "not_found";
  message: string;
  businessName?: string;
  username?: string;
  assignedVpnIp?: string;
  detectedRouterIp?: string;
  secondsLeft?: number;
}

export default function ConnectPage() {
  const [form, setForm] = useState({
    businessName: "",
    dashboardUsername: "",
    dashboardPassword: "",
    phone: "",
    location: "",
    routerIp: "",
    mode: "auto",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<StatusResult | null>(null);

  // Kagua hali ya muunganisho kila sekunde 3
  const checkStatus = useCallback(async (token: string) => {
    try {
      const res = await fetch(`/api/connect/status?token=${token}`);
      const data = await res.json();
      setStatus(data);
    } catch {
      // kimya
    }
  }, []);

  useEffect(() => {
    if (!result) return;
    const initialCheck = window.setTimeout(() => void checkStatus(result.token), 0);
    const interval = setInterval(() => checkStatus(result.token), 3000);
    return () => {
      window.clearTimeout(initialCheck);
      clearInterval(interval);
    };
  }, [result, checkStatus]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/connect/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Imeshindikana kuzalisha command");
      } else {
        setResult(data);
      }
    } catch {
      setError("Kosa la mtandao. Jaribu tena.");
    }
    setLoading(false);
  }

  function copyCommand() {
    if (!result) return;
    navigator.clipboard.writeText(result.command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-brand-600 to-emerald-400 flex items-center justify-center font-black text-white">
              S
            </div>
            <span className="font-extrabold text-lg">
              Said<span className="text-emerald-400">Zen</span>{" "}
              <span className="text-brand-400 font-light">WiFi</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/wifi"
              className="text-xs px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 font-medium text-slate-300 transition-colors"
            >
              📶 WiFi Portal
            </Link>
            <Link
              href="/login"
              className="text-xs px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 font-bold text-slate-950 transition-colors"
            >
              🔑 Ingia →
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        {/* Intro */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            ⚡ MCHAKATO RAHISI WA HATUA 3
          </div>
          <h1 className="text-3xl sm:text-4xl font-black">
            Unganisha MikroTik Yako kwa{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-brand-400">
              Command Moja
            </span>
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl mx-auto">
            Huhitaji kujua code. Fuata maelekezo hapa chini, jaza taarifa zako,
            kisha bandika command tutakayokupa kwenye <strong>WinBox → New
            Terminal</strong>. Tutakuonyesha hali ya router yako moja kwa moja.
          </p>
        </div>

        <details open className="group bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
          <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-3">
            <span className="font-bold text-sm">📖 Anza hapa: maandalizi kabla ya kuunganisha</span>
            <span className="text-slate-500 transition-transform group-open:rotate-180">⌄</span>
          </summary>
          <div className="border-t border-slate-800 px-5 py-5 grid gap-3 sm:grid-cols-2">
            {[
              ["1", "Tengeneza backup", "Fungua WinBox na uingie kwenye MikroTik. Nenda Files, kisha backup configuration yako kabla ya kubadilisha chochote."],
              ["2", "Hakikisha una internet", "Router lazima iwe imeunganishwa na internet. Usibandike command ukiwa umeondoka kwenye WinBox."],
              ["3", "Tumia mtumiaji mwenye ruhusa", "Tumia account yenye full/administration permission. Usifute account yako ya zamani."],
              ["4", "Usibadilishe command", "Nakili command yote kama ilivyo. Usibadilishe token, IP, public-key, au alama za nukuu."],
            ].map(([number, title, description]) => (
              <div key={number} className="flex gap-3 rounded-2xl bg-slate-950/70 border border-slate-800 p-4">
                <span className="w-7 h-7 shrink-0 rounded-lg bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-sm">
                  {number}
                </span>
                <div>
                  <div className="font-bold text-sm text-slate-200">{title}</div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </details>

        {/* Jinsi inavyofanya kazi */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { n: "1", t: "Jaza taarifa", d: "Jina la biashara, username na nenosiri la dashboard" },
            { n: "2", t: "Pata command", d: "Bonyeza Nipe Command ya Kuunganisha" },
            { n: "3", t: "Bandika WinBox", d: "New Terminal → Ctrl+V → Enter, kisha subiri uthibitisho" },
          ].map((s) => (
            <div
              key={s.n}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-sm mb-2">
                {s.n}
              </div>
              <div className="font-bold text-sm">{s.t}</div>
              <div className="text-xs text-slate-400 mt-0.5">{s.d}</div>
            </div>
          ))}
        </div>

        {!result ? (
          /* ══════════ FOMU ══════════ */
          <form
            onSubmit={handleGenerate}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5"
          >
            <div className="border-b border-slate-800 pb-4">
              <div className="text-emerald-400 text-[11px] font-black uppercase tracking-wide">Hatua ya 1</div>
              <h2 className="font-black text-lg mt-1">Weka taarifa za biashara na router</h2>
              <p className="text-xs text-slate-400 mt-1">Taarifa hizi zinatumika kutengeneza akaunti yako na command salama ya usajili.</p>
            </div>
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-2xl text-xs">
                ⚠️ {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Jina la Biashara / Hotspot *
                </label>
                <input
                  type="text"
                  required
                  value={form.businessName}
                  onChange={(e) =>
                    setForm({ ...form, businessName: e.target.value })
                  }
                  placeholder="Duka la Juma WiFi"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Simu Yako
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="0755 123 456"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  IP ya Router *
                </label>
                <input
                  type="text"
                  required={form.mode === "direct"}
                  value={form.routerIp}
                  onChange={(e) => setForm({ ...form, routerIp: e.target.value })}
                  placeholder="mfano 41.59.102.77"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Weka Public IP ya router bila <code>/24</code> au <code>http://</code>.
                  Unaweza kuiona kwa kuingia WinBox, kisha IP → Addresses. Kama huna
                  Public IP, wasiliana nasi ili tukupe njia ya VPN.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Username ya Kuingia *{" "}
                  <span className="text-slate-500 font-normal">
                    (bila email)
                  </span>
                </label>
                <input
                  type="text"
                  required
                  value={form.dashboardUsername}
                  onChange={(e) =>
                    setForm({ ...form, dashboardUsername: e.target.value })
                  }
                  placeholder="juma_wifi"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Nenosiri Lako la Tovuti *
                </label>
                <input
                  type="password"
                  required
                  minLength={4}
                  value={form.dashboardPassword}
                  onChange={(e) =>
                    setForm({ ...form, dashboardPassword: e.target.value })
                  }
                  placeholder="Chagua nenosiri unaloikumbuka"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Njia ya muunganisho */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
              <div className="flex items-start gap-3">
                <span className="text-xl">✨</span>
                <div>
                  <div className="font-bold text-sm text-emerald-300">
                    Muunganisho wa Automatic
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Huhitaji kuchagua RouterOS au WireGuard. Bandika command
                    moja tu kwenye WinBox na mfumo utakamilisha usajili.
                  </p>
                </div>
              </div>
              {form.mode !== "auto" && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, mode: "auto" })}
                  className="mt-3 text-[11px] font-bold text-emerald-400 hover:text-emerald-300"
                >
                  ↩️ Rudi kwenye automatic
                </button>
              )}
            </div>

            <details className="group">
              <summary className="cursor-pointer list-none text-[11px] font-bold text-slate-500 hover:text-slate-300">
                ⚙️ Mipangilio ya kitaalamu (si lazima)
                <span className="float-right transition-transform group-open:rotate-180">⌄</span>
              </summary>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, mode: "wireguard" })}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    form.mode === "wireguard"
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-slate-700 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔒</span>
                    <span className="font-bold text-sm">RouterOS 7 + WireGuard</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Kwa muunganisho salama kupitia VPN.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, mode: "direct" })}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    form.mode === "direct"
                      ? "border-brand-500 bg-brand-500/10"
                      : "border-slate-700 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🌐</span>
                    <span className="font-bold text-sm">Direct API</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Kwa IP ya public au port-forward ya API.
                  </p>
                </button>
              </div>
            </details>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  Inazalisha...
                </>
              ) : (
                "⚡ Nipe Command ya Kuunganisha"
              )}
            </button>
          </form>
        ) : (
          /* ══════════ COMMAND ══════════ */
          <div className="space-y-5">
            {/* Hali ya muunganisho */}
            <div
              className={`rounded-2xl p-4 border ${
                status?.status === "connected"
                  ? "bg-emerald-500/10 border-emerald-500/40"
                  : status?.status === "expired"
                    ? "bg-rose-500/10 border-rose-500/40"
                    : "bg-amber-500/10 border-amber-500/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {status?.status === "connected"
                    ? "✅"
                    : status?.status === "expired"
                      ? "⏰"
                      : "⏳"}
                </span>
                <div className="flex-1">
                  <div
                    className={`font-bold text-sm ${
                      status?.status === "connected"
                        ? "text-emerald-400"
                        : status?.status === "expired"
                          ? "text-rose-400"
                          : "text-amber-400"
                    }`}
                  >
                    {status?.status === "connected"
                      ? "IMEUNGANISHWA KIKAMILIFU!"
                      : status?.status === "expired"
                        ? "MUDA UMEISHA"
                        : "INASUBIRI ROUTER..."}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {status?.message}
                  </p>
                </div>
              </div>

              {status?.status === "connected" && (
                <div className="mt-4 pt-4 border-t border-emerald-500/20 space-y-2">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-slate-500">Username yako:</div>
                      <div className="font-mono font-bold text-emerald-400">
                        {status.username}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">IP ya VPN:</div>
                      <div className="font-mono font-bold text-emerald-400">
                        {status.assignedVpnIp}
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/login"
                    className="block w-full text-center py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-black text-sm"
                  >
                    🚀 Ingia Kwenye Dashboard Yako
                  </Link>
                </div>
              )}

              {status?.status === "pending" && status.secondsLeft !== undefined && (
                <div className="mt-3 text-[11px] text-amber-400/80">
                  Muda uliobaki:{" "}
                  {Math.floor(status.secondsLeft / 3600)}h{" "}
                  {Math.floor((status.secondsLeft % 3600) / 60)}m
                </div>
              )}
            </div>

            {/* Onyo la usanidi wa seva */}
            {result.serverInfo && !result.serverInfo.configured && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-300 space-y-2">
                <div className="font-bold">⚠️ Seva haijasanidiwa WireGuard bado</div>
                <p>
                  Weka vigezo hivi kwenye faili la <code>.env</code> kwenye seva,
                  kisha anzisha upya:
                </p>
                <pre className="bg-slate-950 p-3 rounded-xl text-[11px] font-mono overflow-x-auto text-emerald-400">
{`WIREGUARD_SERVER_PUBLIC_KEY=<funguo ya umma ya seva>
WIREGUARD_SERVER_ENDPOINT=<IP ya umma ya seva>
WIREGUARD_PORT=51820
NEXT_PUBLIC_APP_URL=http://IP_YA_SEVA:3000`}
                </pre>
                <p className="text-slate-400">
                  Pata funguo kwa: <code>cat /etc/wireguard/server_public.key</code>
                </p>
              </div>
            )}

            {/* Command */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
              <div className="px-5 py-3 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm">📋</span>
                  <span className="font-bold text-xs">
                    COMMAND YA KUBANDIKA KWENYE WINBOX → NEW TERMINAL
                  </span>
                </div>
                <button
                  onClick={copyCommand}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    copied
                      ? "bg-emerald-500 text-slate-950"
                      : "bg-brand-600 hover:bg-brand-500 text-white"
                  }`}
                >
                  {copied ? "✓ IMENAKILIWA!" : "NAKILI"}
                </button>
              </div>

              <pre className="p-5 text-[11px] sm:text-xs font-mono leading-relaxed overflow-x-auto text-emerald-300 whitespace-pre">
                {result.command}
              </pre>
            </div>

            {/* Maelekezo */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="font-bold text-sm mb-3">
                📖 Hatua ya 3: bandika command kwenye MikroTik
              </h3>
              <ol className="space-y-2">
                {result.instructions.map((step, i) => (
                  <li key={i} className="text-xs text-slate-400 flex gap-2">
                    <span className="text-emerald-400 font-bold">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-4 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-300 leading-relaxed">
                <strong>Usifunge WinBox bado.</strong> Baada ya kubonyeza Enter,
                subiri sekunde 10-30 hadi ujumbe wa connection uonekane hapa juu.
                Usibandike command mara mbili.
              </div>
            </div>

            <details className="group bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <summary className="cursor-pointer list-none flex items-center justify-between gap-3 text-sm font-bold">
                🛠️ Haijaungana? Fuata ukaguzi huu
                <span className="text-slate-500 transition-transform group-open:rotate-180">⌄</span>
              </summary>
              <div className="mt-4 space-y-2 text-xs text-slate-400 leading-relaxed">
                <p>• Hakikisha umebandika kwenye <strong className="text-slate-200">New Terminal</strong>, si kwenye sehemu ya search ya WinBox.</p>
                <p>• Hakikisha router ina internet na IP uliyoandika ni Public IP sahihi.</p>
                <p>• Ukiona error ya permission, ingia kwa account yenye ruhusa ya administrator.</p>
                <p>• Ukiona timeout, subiri dakika moja kisha refresh ukurasa.</p>
                <p>• Bado haifanyi kazi? Piga simu <a href="tel:0777378300" className="text-emerald-400 font-bold">0777 378 300</a> na tuma screenshot ya ujumbe wa error.</p>
              </div>
            </details>

            {/* Taarifa */}
            {result.assignedVpnIp && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-slate-500">IP ya VPN iliyotengwa:</div>
                  <div className="font-mono font-bold text-brand-400">
                    {result.assignedVpnIp}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Seva (endpoint):</div>
                  <div className="font-mono font-bold text-brand-400">
                    {result.serverInfo.endpoint}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setResult(null);
                setStatus(null);
              }}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-2xl text-xs font-bold text-slate-300"
            >
              ← Tengeneza Command Nyingine
            </button>
          </div>
        )}

        {/* Msaada */}
        <div className="text-center text-xs text-slate-500 space-y-1">
          <p>Unahitaji msaada? Piga simu:</p>
          <a
            href="tel:0777378300"
            className="inline-block font-black text-lg text-emerald-400"
          >
            📞 0777 378 300
          </a>
        </div>
      </main>
    </div>
  );
}
