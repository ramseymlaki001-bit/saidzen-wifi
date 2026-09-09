"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Pkg {
  id: number;
  name: string;
  duration: string;
  price: number;
  speedLimit: string | null;
}

interface Hotspot {
  id: number;
  name: string;
  location: string | null;
  phone: string;
  username: string;
  suspended: boolean;
}

interface ActivateResult {
  valid: boolean;
  isActive?: boolean;
  error?: string;
  message?: string;
  voucher?: {
    code: string;
    password: string;
    package: string;
    duration: string;
    price: number;
  };
  session?: {
    active: boolean;
    uptime: string;
    remainingText: string;
    remainingHours: number;
    expired: boolean;
  };
}

interface PurchaseResult {
  success: boolean;
  error?: string;
  order?: { id: number; amount: number; phone: string };
  voucher?: {
    code: string;
    password: string;
    package: string;
    duration: string;
    price: number;
  };
  payment?: { method: string; sent: boolean; message: string; businessPhone: string };
}

export default function WifiPortalPage() {
  const params = useParams();
  const routeSlug = params?.slug;
  const slug = (Array.isArray(routeSlug) ? routeSlug[0] : String(routeSlug || ""))
    .trim()
    .toLowerCase();

  const [tab, setTab] = useState<"use" | "buy">("use");
  const [hotspot, setHotspot] = useState<Hotspot | null>(null);
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // ── Kuingiza vocha ──
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<ActivateResult | null>(null);

  // ── Kununua ──
  const [selectedPkg, setSelectedPkg] = useState<number | null>(null);
  const [phone, setPhone] = useState("");
  const [buying, setBuying] = useState(false);
  const [purchase, setPurchase] = useState<PurchaseResult | null>(null);
  const [copied, setCopied] = useState("");

  // Pakia vifurushi
  useEffect(() => {
    if (!slug) return;
    const loadPackages = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/portal/packages/${slug}`);
        const data = await response.json();
        if (data.hotspot) {
          setHotspot(data.hotspot);
          setPackages(data.packages || []);
          if (data.packages?.length) setSelectedPkg(data.packages[0].id);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    const initialLoad = window.setTimeout(() => void loadPackages(), 0);
    return () => window.clearTimeout(initialLoad);
  }, [slug]);

  // ── Kuingiza vocha ──
  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setChecking(true);
    setResult(null);
    try {
      const res = await fetch("/api/portal/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, code }),
      });
      const d = await res.json();
      setResult(d);
    } catch {
      setResult({ valid: false, error: "Kosa la mtandao. Jaribu tena." });
    }
    setChecking(false);
  }

  // ── Kununua kwa M-Pesa (inasubiri uthibitisho) ──
  const [waitingPayment, setWaitingPayment] = useState(false);

  async function handlePurchase(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPkg || !phone.trim()) return;
    const normalizedPhone = phone.replace(/\D/g, "").replace(/^00/, "");
    const localPhone = normalizedPhone.startsWith("255")
      ? `0${normalizedPhone.slice(3)}`
      : normalizedPhone;
    if (!/^0(60|61|62|65|67|68|69|71|73|74|75|76|77|78|79)\d{7}$/.test(localPhone)) {
      setPurchase({
        success: false,
        error: "Namba ya simu si sahihi. Tumia mfano: 0755 123 456",
      });
      return;
    }
    setBuying(true);
    setPurchase(null);
    try {
      const res = await fetch("/api/portal/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, phone: normalizedPhone, packageId: selectedPkg }),
      });
      const d = await res.json();

      if (!res.ok) {
        // M-Pesa haijawashwa au kosa lingine
        setPurchase({
          success: false,
          error: d.error,
          payment: {
            method: "manual",
            sent: false,
            message: d.error,
            businessPhone: d.businessPhone || "",
          },
        });
        setBuying(false);
        return;
      }

      // Ombi la M-Pesa limetumwa — subiri mteja aingize PIN
      setWaitingPayment(true);
      setPurchase({
        success: true,
        order: d.orderId ? { id: d.orderId, amount: d.amount, phone: d.phone } : undefined,
        payment: {
          method: "mpesa_stk",
          sent: true,
          message: d.message,
          businessPhone: "",
        },
      });

      // Piga simu hali ya oda kila sekunde 3 (hadi sekunde 120)
      if (d.orderId) {
        for (let i = 0; i < 40; i++) {
          await new Promise((r) => setTimeout(r, 3000));
          try {
            const chk = await fetch(
              `/api/portal/order?id=${d.orderId}&token=${encodeURIComponent(d.orderToken || "")}`
            );
            const st = await chk.json();

            if (st.status === "paid") {
              setPurchase({
                success: true,
                voucher: st.voucher,
                payment: {
                  method: "mpesa_stk",
                  sent: true,
                  message: st.message,
                  businessPhone: "",
                },
              });
              setWaitingPayment(false);
              setBuying(false);
              return;
            }
            if (st.status === "cancelled" || st.status === "failed") {
              setPurchase({
                success: false,
                error: st.message,
              });
              setWaitingPayment(false);
              setBuying(false);
              return;
            }
            if (st.status === "paid_pending_fulfillment") {
              setPurchase({ success: false, error: st.message });
              setWaitingPayment(false);
              setBuying(false);
              return;
            }
            if (st.status === "processing" || st.status === "pending") continue;
          } catch {
            /* endelea kupiga simu */
          }
        }
        // Muda umeisha
        setWaitingPayment(false);
        setPurchase({
          success: false,
          error:
            "Tulingoja uthibitisho wa malipo kwa dakika 2 bila mafanikio. Kama umelipa, wasiliana na msaada: 0777 378 300",
        });
      }
    } catch {
      setPurchase({ success: false, error: "Kosa la mtandao. Jaribu tena." });
      setWaitingPayment(false);
    }
    setBuying(false);
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  }

  // ── Ukurasa haupatikani ──
  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-3">
          <span className="text-5xl">📡</span>
          <h1 className="text-xl font-black text-white">Hotspot Haipatikani</h1>
          <p className="text-xs text-slate-400">
            Anwani ya hotspot uliyoiweka ({slug}) haipo kwenye mfumo.
          </p>
          <div className="pt-2 space-y-2">
            <Link
              href="/wifi"
              className="block w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold text-sm shadow-md"
            >
              📡 Chagua Hotspot Zilizopo
            </Link>
            <Link
              href="/"
              className="block w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold text-xs"
            >
              🏠 Ukurasa wa Mwanzo
            </Link>
          </div>
          <p className="text-[11px] text-slate-500 pt-2">
            Msaada:{" "}
            <a href="tel:0777378300" className="text-emerald-400 font-bold">
              0777 378 300
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.14),transparent_34%),linear-gradient(145deg,#07111f_0%,#0f172a_48%,#07111f_100%)] text-slate-100">
      <div className="max-w-5xl mx-auto min-h-screen flex flex-col">
        {/* ── Top Navigation Bar ── */}
        <div className="flex items-center justify-between text-xs py-3 px-5 sm:px-8 border-b border-white/10 bg-slate-950/50 sticky top-0 z-20 backdrop-blur-xl">
          <Link
            href="/"
            className="text-slate-400 hover:text-white font-medium flex items-center gap-1 transition-colors"
          >
            ← Mwanzo
          </Link>
          <Link
            href="/wifi"
            className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 transition-colors"
          >
            <span>📡</span> Hotspot Zote
          </Link>
        </div>

        {/* ── Header ── */}
        <header className="px-5 sm:px-8 pt-10 pb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 shrink-0 rounded-[22px] bg-linear-to-tr from-brand-500 to-emerald-400 flex items-center justify-center text-3xl shadow-xl shadow-emerald-500/20 ring-4 ring-white/5">
              📶
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-400 font-bold mb-1">
                Customer WiFi Portal
              </p>
              <h1 className="text-3xl sm:text-4xl font-black leading-tight tracking-tight">
                {hotspot?.name || "SaidZen WiFi"}
              </h1>
              {hotspot?.location && (
                <p className="text-sm text-slate-400 mt-1">📍 {hotspot.location}</p>
              )}
            </div>
          </div>
          <div className="inline-flex self-start md:self-auto items-center gap-2 px-3.5 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            WiFi iko tayari
          </div>
        </header>

        {hotspot?.suspended && (
          <div className="mx-5 mb-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-300">
            ⚠️ Huduma ya hotspot hii ipo kwenye hali ya udhibiti. Vocha
            zinaweza kununuliwa lakini intaneti inaweza kuchelewa kuwaka.
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="px-5">
          <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-1.5 flex gap-1 shadow-xl shadow-black/10">
            <button
              onClick={() => {
                setTab("use");
                setPurchase(null);
              }}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                tab === "use"
                  ? "bg-emerald-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🎫 Ingiza Vocha
            </button>
            <button
              onClick={() => {
                setTab("buy");
                setResult(null);
              }}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                tab === "buy"
                  ? "bg-emerald-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              💳 Nunua Mpya
            </button>
          </div>
        </div>

        <main className="flex-1 px-5 sm:px-8 py-6 space-y-5">
          {/* ══════ TAB 1: KUINGIZA VOCHA ══════ */}
          {tab === "use" && (
            <>
              <form
                onSubmit={handleActivate}
                className="bg-white/6 border border-white/10 rounded-[26px] p-6 sm:p-8 space-y-5 shadow-2xl shadow-black/10 backdrop-blur-sm"
              >
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-400 font-black mb-2">
                    Tumia vocha uliyonunua
                  </p>
                  <label className="block text-xl font-black text-white mb-2">
                    Weka code ya vocha
                  </label>
                  <p className="text-xs text-slate-400 mb-4">
                    Ingiza code yako hapa ili uanze kutumia intaneti mara moja.
                  </p>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="MFANO: SZ-78B9X"
                    autoComplete="off"
                    className="w-full px-4 py-4 bg-slate-950/80 border-2 border-slate-700/80 rounded-2xl text-center text-xl font-mono font-black tracking-widest text-white outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={checking || !code.trim()}
                  className="w-full py-4 bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded-2xl font-black text-sm disabled:opacity-40 flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                >
                  {checking ? (
                    <>
                      <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                      Inathibitisha...
                    </>
                  ) : (
                    "⚡ Anza Kutumia Intaneti"
                  )}
                </button>
              </form>

              {/* Matokeo */}
              {result && (
                <div
                  className={`rounded-3xl p-6 border-2 animate-fadeIn space-y-4 ${
                    result.valid
                      ? "bg-emerald-500/10 border-emerald-500/40"
                      : "bg-rose-500/10 border-rose-500/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{result.valid ? "✅" : "❌"}</span>
                    <div className="flex-1">
                      <p
                        className={`text-sm font-bold leading-snug ${
                          result.valid ? "text-emerald-300" : "text-rose-300"
                        }`}
                      >
                        {result.valid ? result.message : result.error}
                      </p>
                    </div>
                  </div>

                  {result.valid && result.voucher && (
                    <div className="space-y-3 pt-2">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-950/60 p-3 rounded-xl">
                          <div className="text-slate-500 text-[10px]">KIFURUSHI</div>
                          <div className="font-bold text-white">
                            {result.voucher.package}
                          </div>
                        </div>
                        <div className="bg-slate-950/60 p-3 rounded-xl">
                          <div className="text-slate-500 text-[10px]">THAMANI</div>
                          <div className="font-bold text-emerald-400">
                            TSh {result.voucher.price.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {result.session?.remainingText && (
                        <div className="bg-slate-950/60 p-3 rounded-xl text-center">
                          <div className="text-[10px] text-slate-500">
                            MUDA ULIOBAKI
                          </div>
                          <div className="text-lg font-black text-white">
                            {result.session.remainingText}
                          </div>
                          {result.session.active && (
                            <div className="text-[10px] text-emerald-400 mt-0.5 flex items-center justify-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Inafanya kazi • {result.session.uptime}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="bg-slate-950/60 p-3 rounded-xl space-y-2">
                        <div className="text-[10px] text-slate-500">
                          UNGANISHA KWA WiFi
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="text-[9px] text-slate-500">Username</div>
                            <span className="font-mono font-black text-white text-sm">
                              {result.voucher.code}
                            </span>
                          </div>
                          <button
                            onClick={() => copy(result.voucher!.code, "c")}
                            className="px-2.5 py-1 bg-slate-800 rounded-lg text-[10px] font-bold"
                          >
                            {copied === "c" ? "✓" : "📋"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {!result.valid && (
                    <button
                      onClick={() => {
                        setTab("buy");
                        setResult(null);
                      }}
                      className="w-full py-3 bg-emerald-500 text-slate-950 rounded-xl font-bold text-sm"
                    >
                      💳 Nunua Vocha Mpya Sasa
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* ══════ TAB 2: KUNUNUA (MALIPO YA KIOTOMATIKI) ══════ */}
          {tab === "buy" && (
            <>
              {/* ── HALI: Tunasubiri PIN ya M-Pesa ── */}
              {waitingPayment ? (
                <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-8 text-center space-y-5 animate-fadeIn">
                  <div className="relative mx-auto w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-amber-500/20" />
                    <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
                    <span className="absolute inset-0 flex items-center justify-center text-2xl">
                      📱
                    </span>
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">
                      Angalia Simu Yako
                    </h2>
                    <p className="text-sm text-amber-300 mt-2">
                      Ombi la malipo limetumwa kwa{" "}
                      <strong className="font-mono">{phone}</strong>
                    </p>
                  </div>
                  <div className="bg-slate-950/70 rounded-2xl p-4 space-y-2 text-left">
                    <p className="text-xs text-slate-300 font-bold">
                      Fuata hatua hizi:
                    </p>
                    <p className="text-[11px] text-slate-400">
                      1. Fungua ujumbe wa M-Pesa uliowasili
                    </p>
                    <p className="text-[11px] text-slate-400">
                      2. Thibitisha kiasi ni sahihi
                    </p>
                    <p className="text-[11px] text-slate-400">
                      3. Ingiza <strong className="text-white">PIN yako ya M-Pesa</strong>
                    </p>
                    <p className="text-[11px] text-emerald-400 pt-1">
                      4. Vocha yako itaonekana hapa moja kwa moja
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    ⏳ Tunasubiri uthibitisho... (hadi dakika 2)
                  </p>
                </div>
              ) : purchase?.success && purchase.voucher ? (
                /* ── VOCHA IMETOKA ── */
                <div className="bg-linear-to-br from-emerald-500/15 to-brand-500/10 border-2 border-emerald-500/40 rounded-3xl p-6 space-y-4 animate-fadeIn">
                  <div className="text-center">
                    <span className="text-5xl">🎉</span>
                    <h2 className="text-lg font-black text-white mt-2">
                      Vocha Yako Iko Tayari!
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Karibu! Tumia taarifa hizi kuingia
                    </p>
                  </div>

                  <div className="bg-slate-950/70 rounded-2xl p-4 space-y-3">
                    <div className="text-center pb-3 border-b border-slate-800">
                      <div className="text-xs text-slate-400">
                        {purchase.voucher.package} • {purchase.voucher.duration}
                      </div>
                      <div className="text-2xl font-black text-emerald-400 mt-1">
                        TSh {purchase.voucher.price.toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-[10px] text-slate-500">USERNAME</div>
                        <span className="font-mono font-black text-white text-xl tracking-wider">
                          {purchase.voucher.code}
                        </span>
                      </div>
                      <button
                        onClick={() => copy(purchase.voucher!.code, "v")}
                        className="px-3 py-2 bg-emerald-500 text-slate-950 rounded-xl text-xs font-black"
                      >
                        {copied === "v" ? "✓ NAKILIWA" : "📋 NAKILI"}
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                      <div>
                        <div className="text-[10px] text-slate-500">PASSWORD</div>
                        <span className="font-mono font-black text-white text-lg">
                          {purchase.voucher.password}
                        </span>
                      </div>
                      <button
                        onClick={() => copy(purchase.voucher!.password, "p")}
                        className="px-3 py-2 bg-slate-800 rounded-xl text-xs font-black"
                      >
                        {copied === "p" ? "✓" : "📋"}
                      </button>
                    </div>
                  </div>

                  {purchase.payment?.sent && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 text-xs text-amber-300">
                      💳 <strong>{purchase.payment.message}</strong>
                      <br />
                      <span className="text-amber-400/80 text-[11px]">
                        Ukimaliza kulipa, vocha inafanya kazi moja kwa moja.
                      </span>
                    </div>
                  )}

                  {!purchase.payment?.sent && purchase.payment?.message && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-xs text-slate-400">
                      {purchase.payment.message}
                      {purchase.payment.businessPhone && (
                        <div className="mt-2 pt-2 border-t border-slate-800">
                          Lipa au piga:{" "}
                          <a
                            href={`tel:${purchase.payment.businessPhone}`}
                            className="font-bold text-emerald-400"
                          >
                            {purchase.payment.businessPhone}
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  <a
                    href="http://1.1.1.1"
                    className="block w-full py-3.5 bg-emerald-500 text-slate-950 rounded-2xl font-black text-sm text-center"
                  >
                    📶 Fungua Ukurasa wa Kuingia WiFi
                  </a>
                  <p className="text-center text-[11px] text-slate-400 -mt-2">
                    Unganisha kwenye WiFi, kisha fungua browser yoyote
                    (Chrome/Safari) — ukurasa wa kuingia utajifungua.
                  </p>

                  <button
                    onClick={() => {
                      setPurchase(null);
                      setPhone("");
                      setTab("use");
                    }}
                    className="w-full py-2.5 text-xs text-slate-400 hover:text-white font-bold"
                  >
                    ← Rudi Kuingiza Vocha
                  </button>
                </div>
              ) : (
                /* ── FOMU YA KUNUNUA ── */
                <>
                  <form
                    onSubmit={handlePurchase}
                    className="bg-white/6 border border-white/10 rounded-[26px] p-6 sm:p-8 space-y-6 shadow-2xl shadow-black/10 backdrop-blur-sm"
                  >
                    {purchase?.error && (
                      <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-2xl text-xs">
                        ⚠️ {purchase.error}
                      </div>
                    )}

                    <div>
                      <label className="block text-xl font-black text-white mb-1">
                        Chagua kifurushi
                      </label>
                      <p className="text-xs text-slate-400 mb-4">
                        Chagua muda unaokufaa, kisha lipia kwa M-Pesa.
                      </p>
                      <div className="space-y-2">
                        {packages.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setSelectedPkg(p.id)}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                              selectedPkg === p.id
                                ? "border-emerald-400 bg-emerald-400/10 shadow-lg shadow-emerald-500/10"
                                : "border-slate-700/80 hover:border-slate-500 bg-slate-950/40"
                            }`}
                          >
                            <div className="flex items-center gap-3 text-left">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm ${
                                  selectedPkg === p.id
                                    ? "bg-emerald-400 text-slate-950"
                                    : "bg-slate-800 text-slate-400"
                                }`}
                              >
                                ⏱️
                              </div>
                              <div>
                                <div className="font-bold text-sm text-white">
                                  {p.name}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  {p.duration}
                                  {p.speedLimit ? ` • ${p.speedLimit}` : ""}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-black text-emerald-300">
                                TSh {p.price.toLocaleString()}
                              </div>
                              {selectedPkg === p.id && (
                                <div className="text-[10px] text-emerald-400 font-bold mt-0.5">
                                  Imechaguliwa
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xl font-black text-white mb-1">
                        Namba ya simu ya M-Pesa
                      </label>
                      <p className="text-xs text-slate-400 mb-3">
                        Tutatuma ombi la malipo moja kwa moja kwenye simu yako.
                      </p>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0755 123 456"
                        className="w-full px-4 py-3.5 bg-slate-950/80 border-2 border-slate-700/80 rounded-2xl text-base font-mono text-white outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-colors"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={buying || !selectedPkg || !phone.trim()}
                      className="w-full py-4 bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded-2xl font-black text-sm disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                    >
                      {buying ? (
                        <>
                          <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                          Inatuma Ombi...
                        </>
                      ) : (
                        <>
                          💳 Lipa kwa M-Pesa{" "}
                          {selectedPkg &&
                            `• TSh ${
                              packages.find((p) => p.id === selectedPkg)?.price.toLocaleString() ||
                              ""
                            }`}
                        </>
                      )}
                    </button>
                  </form>

                  {/* Maelezo ya usalama */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                      🔒 Malipo Salama
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Malipo yanafanyika kupitia M-Pesa rasmi. Hatuhifadhi PIN
                      yako. Vocha inatolewa moja kwa moja baada ya malipo.
                      Unahitaji msaada? Piga{" "}
                      <a
                        href={`tel:${hotspot?.phone || "0777378300"}`}
                        className="text-emerald-400 font-bold"
                      >
                        {hotspot?.phone || "0777 378 300"}
                      </a>
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </main>

        {/* ── Footer ── */}
        <footer className="px-5 py-6 text-center text-[11px] text-slate-600 space-y-1">
          <p className="flex items-center justify-center gap-1.5">
            Inaendeshwa na
            <span className="font-bold text-slate-400">SaidZen WiFi</span>
          </p>
          <a href="tel:0777378300" className="inline-block text-emerald-500 font-bold">
            📞 Msaada: 0777 378 300
          </a>
        </footer>
      </div>
    </div>
  );
}
