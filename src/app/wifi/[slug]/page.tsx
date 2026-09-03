"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

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
  const slug = String(params?.slug || "").toLowerCase();

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
    setLoading(true);
    fetch(`/api/portal/packages/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.hotspot) {
          setHotspot(d.hotspot);
          setPackages(d.packages || []);
          if (d.packages?.length) setSelectedPkg(d.packages[0].id);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true));
    setLoading(false);
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
    setBuying(true);
    setPurchase(null);
    try {
      const res = await fetch("/api/portal/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, phone, packageId: selectedPkg }),
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
            const chk = await fetch(`/api/portal/order?id=${d.orderId}`);
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
        <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4">
          <span className="text-5xl">📡</span>
          <h1 className="text-xl font-black text-white">Hotspot Haipatikani</h1>
          <p className="text-sm text-slate-400">
            Anwani ya hotspot si sahihi. Hakikisha umeunganisha kwenye WiFi
            sahihi na ufungue tena ukurasa.
          </p>
          <a
            href="tel:0777378300"
            className="block w-full py-3 bg-emerald-500 text-slate-950 rounded-xl font-bold text-sm"
          >
            📞 Piga 0777 378 300
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="max-w-md mx-auto min-h-screen flex flex-col">
        {/* ── Header ── */}
        <header className="pt-10 pb-6 px-5 text-center">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-linear-to-tr from-brand-500 to-emerald-400 flex items-center justify-center text-3xl shadow-xl shadow-emerald-500/20 mb-4">
            📶
          </div>
          <h1 className="text-2xl font-black leading-tight">
            {hotspot?.name || "SaidZen WiFi"}
          </h1>
          {hotspot?.location && (
            <p className="text-xs text-slate-400 mt-1">📍 {hotspot.location}</p>
          )}
          <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Umeunganishwa kwenye WiFi
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-1 flex gap-1">
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

        <main className="flex-1 px-5 py-6 space-y-5">
          {/* ══════ TAB 1: KUINGIZA VOCHA ══════ */}
          {tab === "use" && (
            <>
              <form
                onSubmit={handleActivate}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">
                    Andika Code ya Vocha Yako
                  </label>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="MFANO: SZ-78B9X"
                    autoComplete="off"
                    className="w-full px-4 py-4 bg-slate-950 border-2 border-slate-700 rounded-2xl text-center text-xl font-mono font-black tracking-widest text-white outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={checking || !code.trim()}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-sm disabled:opacity-40 flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
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
                    className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5"
                  >
                    {purchase?.error && (
                      <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-2xl text-xs">
                        ⚠️ {purchase.error}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-2.5">
                        1. Chagua Kifurushi
                      </label>
                      <div className="space-y-2">
                        {packages.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setSelectedPkg(p.id)}
                            className={`w-full flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all ${
                              selectedPkg === p.id
                                ? "border-emerald-500 bg-emerald-500/10"
                                : "border-slate-700 hover:border-slate-600 bg-slate-950/40"
                            }`}
                          >
                            <div className="flex items-center gap-3 text-left">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm ${
                                  selectedPkg === p.id
                                    ? "bg-emerald-500 text-slate-950"
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
                              <div className="font-black text-emerald-400">
                                TSh {p.price.toLocaleString()}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-2">
                        2. Namba Yako ya Simu (M-Pesa)
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0755 123 456"
                        className="w-full px-4 py-3.5 bg-slate-950 border-2 border-slate-700 rounded-2xl text-base font-mono text-white outline-none focus:border-emerald-500 transition-colors"
                      />
                      <p className="text-[10px] text-slate-500 mt-1.5">
                        Tutakutumia ombi la malipo (Pop-up) kwenye simu yako.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={buying || !selectedPkg || !phone.trim()}
                      className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-sm disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
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
