"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setClientToken, authFetch } from "@/lib/client-auth";

interface VoucherProfile {
  id: string;
  name: string;
  duration: string;
  price: number;
  speed: string;
  popular?: boolean;
}

interface DemoVoucher {
  code: string;
  password: string;
  profile: string;
  duration: string;
  price: number;
}

const DEFAULT_PROFILES: VoucherProfile[] = [
  { id: "1", name: "Saa 1", duration: "1 Saa", price: 500, speed: "2 Mbps" },
  { id: "2", name: "Saa 2", duration: "2 Saa", price: 800, speed: "3 Mbps" },
  { id: "3", name: "Saa 6", duration: "6 Saa", price: 1500, speed: "3 Mbps" },
  { id: "4", name: "Saa 24", duration: "Siku 1", price: 2000, speed: "5 Mbps", popular: true },
  { id: "5", name: "Wiki 1", duration: "Siku 7", price: 8000, speed: "5 Mbps" },
];

export default function HomePage() {
  const router = useRouter();

  // Generator interactive state
  const [selectedProfile, setSelectedProfile] = useState<VoucherProfile>(DEFAULT_PROFILES[0]);
  const [voucherCount, setVoucherCount] = useState<number>(10);
  const [customPrefix, setCustomPrefix] = useState<string>("SZ");
  const [generatedDemoVouchers, setGeneratedDemoVouchers] = useState<DemoVoucher[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Modals state
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Setup Form state
  const [setupForm, setSetupForm] = useState({
    routerIp: "",
    apiPort: "8728",
    apiUsername: "admin",
    apiPassword: "",
    dashboardUsername: "",
    dashboardPassword: "",
    businessName: "",
    phone: "",
  });
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "failed">("idle");
  const [testMessage, setTestMessage] = useState("");
  const [setupError, setSetupError] = useState("");
  const [isSubmittingSetup, setIsSubmittingSetup] = useState(false);

  // Login Form state
  const [loginForm, setLoginForm] = useState({
    identifier: "",
    password: "",
  });
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // User session state
  const [currentSession, setCurrentSession] = useState<{
    name: string;
    username: string;
    role: string;
    businessName?: string;
  } | null>(null);

  useEffect(() => {
    authFetch("/api/auth/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.userId) {
          setCurrentSession(data);
        }
      })
      .catch(() => {});
  }, []);

  // Ping test
  async function handleTestConnection() {
    if (!setupForm.routerIp) {
      setTestStatus("failed");
      setTestMessage("Tafadhali weka Router IP au VPN IP kwanza!");
      return;
    }
    setTestStatus("testing");
    setTestMessage("Inapima mawasiliano na MikroTik API...");

    try {
      const res = await fetch("/api/mikrotik/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: setupForm.routerIp,
          username: setupForm.apiUsername,
          password: setupForm.apiPassword,
          port: parseInt(setupForm.apiPort) || 8728,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestStatus("success");
        setTestMessage("Imefanikiwa! MikroTik API (Port " + setupForm.apiPort + ") inafanya kazi.");
      } else {
        setTestStatus("failed");
        setTestMessage(data.error || "Imeshindikana kuunganisha router.");
      }
    } catch {
      setTestStatus("failed");
      setTestMessage("Hitilafu ya mtandao wakati wa kupima.");
    }
  }

  // Quick connect setup submit
  async function handleSetupSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmittingSetup(true);
    setSetupError("");

    try {
      const res = await fetch("/api/mikrotik/quick-connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routerIp: setupForm.routerIp,
          apiPort: parseInt(setupForm.apiPort) || 8728,
          apiUsername: setupForm.apiUsername,
          apiPassword: setupForm.apiPassword,
          dashboardUsername: setupForm.dashboardUsername,
          dashboardPassword: setupForm.dashboardPassword,
          businessName: setupForm.businessName || `${setupForm.dashboardUsername} WiFi`,
          phone: setupForm.phone,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSetupError(data.error || "Imeshindikana kusajili router");
        setIsSubmittingSetup(false);
        return;
      }

      // Success -> Redirect to vendor dashboard
      if (data.token) {
        setClientToken(data.token);
      }
      window.location.href = data.token ? `/vendor/vouchers?auth=${encodeURIComponent(data.token)}` : "/vendor/vouchers";
    } catch {
      setSetupError("Hitilafu ya seva. Jaribu tena.");
      setIsSubmittingSetup(false);
    }
  }

  // Quick login submit
  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: loginForm.identifier,
          password: loginForm.password,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setLoginError(data.error || "Taarifa si sahihi");
        setIsLoggingIn(false);
        return;
      }

      if (data.token) {
        setClientToken(data.token);
      }

      const target = data.role === "admin" ? "/dashboard" : "/vendor";
      window.location.href = data.token ? `${target}?auth=${encodeURIComponent(data.token)}` : target;
    } catch {
      setLoginError("Hitilafu ya mtandao.");
      setIsLoggingIn(false);
    }
  }

  // Demo generator directly on homepage
  function handleGenerateDemo() {
    setIsGenerating(true);
    setTimeout(() => {
      const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
      const vouchers: DemoVoucher[] = [];
      for (let i = 0; i < voucherCount; i++) {
        let code = customPrefix ? `${customPrefix}-` : "";
        for (let c = 0; c < 5; c++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        let pass = "";
        for (let p = 0; p < 4; p++) {
          pass += Math.floor(Math.random() * 10).toString();
        }
        vouchers.push({
          code,
          password: pass,
          profile: selectedProfile.name,
          duration: selectedProfile.duration,
          price: selectedProfile.price,
        });
      }
      setGeneratedDemoVouchers(vouchers);
      setIsGenerating(false);
    }, 450);
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col selection:bg-brand-500 selection:text-white">
      {/* Top Notification Bar */}
      <div className="bg-gradient-to-r from-brand-600 via-indigo-600 to-emerald-600 px-4 py-2 text-center text-xs sm:text-sm font-medium text-white flex items-center justify-center gap-2">
        <span className="bg-white/20 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider">
          Mfumo Mpya
        </span>
        <span>
          Hakuna haja ya email au kujisajili kwa fomu ndefu! Weka tu IP ya Router & Nenosiri lako.
        </span>
      </div>

      {/* Main Navigation */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-brand-500/20">
              S
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                Said<span className="text-emerald-400">Zen</span>{" "}
                <span className="text-brand-400 font-light">WiFi</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                MikroTik API v7
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
            <Link
              href="/wifi"
              className="px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <span>📶</span>
              <span className="hidden sm:inline">WiFi</span> Portal
            </Link>

            <Link
              href="/connect"
              className="px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <span>📋</span>
              <span className="hidden sm:inline">WinBox</span> Command
            </Link>

            {currentSession ? (
              <div className="flex items-center gap-2">
                <Link
                  href={currentSession.role === "admin" ? "/dashboard" : "/vendor"}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center gap-1.5"
                >
                  <span>🚀</span>
                  <span>{currentSession.role === "admin" ? "Admin Panel" : "Dashboard"}</span>
                </Link>
                {currentSession.role === "admin" && (
                  <Link
                    href="/vendor"
                    className="hidden md:inline-flex px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors"
                  >
                    🏪 Vendor View
                  </Link>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700/80 flex items-center gap-1.5"
                >
                  <span>🔑</span> Ingia
                </Link>
                <button
                  onClick={() => setShowSetupModal(true)}
                  className="px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
                >
                  <span>⚡</span> Unganisha Router
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12">
        {/* Hero Banner */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Mfumo Wazi Moja kwa Moja (No-Friction WiFi Manager)
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Zalisha Vocha za MikroTik{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-brand-400">
              Bila Kusumbuka na Email
            </span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Tovuti yako iko wazi mbele yako! Unganisha tu IP ya router yako ya MikroTik, weka nenosiri lako binafsi la usalama, na anza kutoa vocha zenye muundo wa kuchapisha mara moja.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setShowSetupModal(true)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-brand-500 hover:from-emerald-400 hover:to-brand-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5"
            >
              ⚡ Unganisha Router Yako Sasa
            </button>
            <Link
              href="/connect"
              className="px-6 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-400/25 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              📋 Pata Command ya WinBox
            </Link>
            <Link
              href="/wifi"
              className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-xl shadow-brand-600/25 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              📶 Fungua WiFi Portal
            </Link>
            <a
              href="#instructions"
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-colors border border-slate-700"
            >
              📖 Jinsi Inavyofanya Kazi
            </a>
          </div>
        </div>

        {/* The Live Interactive Voucher Studio */}
        <div className="bg-slate-800/80 rounded-3xl border border-slate-700 shadow-2xl p-6 sm:p-8 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-700/80">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎫</span>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Studio ya Vocha za Hotspot
                </h2>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                Chagua aina ya vocha, idadi unayotaka, na tazama jinsi mfumo unavyozitengeneza papo hapo
              </p>
            </div>

            {/* Live Router Simulation Status */}
            <div className="flex items-center gap-3 bg-slate-900/90 px-4 py-2.5 rounded-2xl border border-slate-700 text-xs">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <div className="font-bold text-slate-200">
                  {currentSession ? currentSession.businessName || "Router Yako Imewashwa" : "Mfumo wa Jaribio / Simulation"}
                </div>
                <div className="text-[11px] text-slate-400">
                  Port: 8728 • MikroTik API • WireGuard Ready
                </div>
              </div>
              {!currentSession && (
                <button
                  onClick={() => setShowSetupModal(true)}
                  className="ml-2 text-[11px] bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 px-2 py-1 rounded-lg border border-brand-500/30 font-semibold transition-colors"
                >
                  Weka Router Yako
                </button>
              )}
            </div>
          </div>

          {/* Generator Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
            {/* 1. Profile Picker */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                1. Chagua Kifurushi / Bei
              </label>
              <div className="space-y-2">
                {DEFAULT_PROFILES.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => setSelectedProfile(profile)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all ${
                      selectedProfile.id === profile.id
                        ? "bg-emerald-500/15 border-emerald-500 text-white shadow-md shadow-emerald-500/10"
                        : "bg-slate-900/50 border-slate-700/80 text-slate-300 hover:border-slate-600 hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                          selectedProfile.id === profile.id
                            ? "bg-emerald-500 text-slate-950"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        ⏱️
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white flex items-center gap-2">
                          {profile.name}
                          {profile.popular && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-semibold">
                              Inapendwa
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">
                          {profile.duration} • Kasi {profile.speed}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-emerald-400 text-base">
                        TSh {profile.price.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500">kwa vocha</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Count & Customization */}
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                2. Idadi ya Vocha & Umbizo
              </label>

              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-700/80 space-y-4">
                <div>
                  <span className="text-xs text-slate-400 block mb-2 font-medium">
                    Idadi unayotaka kuzalisha:
                  </span>
                  <div className="grid grid-cols-5 gap-2">
                    {[5, 10, 20, 50, 100].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setVoucherCount(count)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all ${
                          voucherCount === count
                            ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60"
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-400 block mb-1.5 font-medium">
                    Herufi za Mwanzo (Prefix kwa vocha):
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={4}
                      value={customPrefix}
                      onChange={(e) => setCustomPrefix(e.target.value.toUpperCase())}
                      placeholder="SZ"
                      className="w-24 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-center font-mono font-bold text-white text-sm focus:border-brand-500 outline-none uppercase"
                    />
                    <div className="text-xs text-slate-400 flex items-center">
                      Mfano: <span className="font-mono text-slate-200 ml-1">{customPrefix || "SZ"}-A7K92</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span>Aina:</span>
                    <span className="font-semibold text-white">{selectedProfile.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Jumla ya Vocha:</span>
                    <span className="font-semibold text-white">{voucherCount}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-700 pt-1 text-emerald-400 font-bold">
                    <span>Thamani ya Mauzo:</span>
                    <span>TSh {(selectedProfile.price * voucherCount).toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleGenerateDemo}
                    disabled={isGenerating}
                    className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                        Inazalisha Vocha {voucherCount}...
                      </>
                    ) : (
                      <>
                        <span>⚡ Zalisha Vocha {voucherCount} Sasa</span>
                      </>
                    )}
                  </button>

                  {!currentSession && (
                    <button
                      type="button"
                      onClick={() => setShowSetupModal(true)}
                      className="w-full py-2.5 rounded-xl bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 font-semibold text-xs border border-brand-500/30 transition-colors"
                    >
                      📡 Unganisha MikroTik Yako Halisi Moja kwa Moja
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Live Ticket Visualizer / Printable Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  3. Muonekano wa Vocha (Print Preview)
                </label>
                {generatedDemoVouchers.length > 0 && (
                  <button
                    onClick={() => window.print()}
                    className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1"
                  >
                    🖨️ Chapisha Vocha
                  </button>
                )}
              </div>

              {generatedDemoVouchers.length === 0 ? (
                /* Sample Mock Voucher Ticket */
                <div className="bg-slate-900/90 rounded-2xl border-2 border-dashed border-slate-700 p-5 text-center space-y-4">
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                    Mfano wa Kadi ya Vocha
                  </div>

                  <div className="bg-white text-slate-900 rounded-2xl p-4 shadow-xl border border-slate-200 text-left space-y-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <div className="font-extrabold text-sm tracking-tight text-slate-900">
                        Said<span className="text-emerald-600">Zen</span> WiFi
                      </div>
                      <div className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                        {selectedProfile.name}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                        Username (Kuingia)
                      </div>
                      <div className="font-mono text-xl font-black text-slate-900 tracking-wider bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
                        {customPrefix || "SZ"}-78B9X
                      </div>
                    </div>

                    <div className="flex justify-between text-xs font-bold text-slate-700 pt-1">
                      <span>Muda: {selectedProfile.duration}</span>
                      <span className="text-emerald-700">TSh {selectedProfile.price.toLocaleString()}</span>
                    </div>

                    <div className="text-[9px] text-slate-400 text-center border-t pt-1">
                      Unganisha WiFi kisha fungua browser kuingiza namba hii
                    </div>
                  </div>

                  <p className="text-xs text-slate-500">
                    Bonyeza <strong>&quot;Zalisha Vocha Sasa&quot;</strong> hapo juu kuona vocha halisi zikitoka!
                  </p>
                </div>
              ) : (
                /* Generated Live Mini Cards */
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  <div className="text-xs font-bold text-emerald-400 flex items-center justify-between">
                    <span>Vocha {generatedDemoVouchers.length} Ziko Tayari!</span>
                    <span className="text-slate-400 text-[11px]">Bofya kadi kunakili</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {generatedDemoVouchers.slice(0, 4).map((v, i) => (
                      <div
                        key={i}
                        onClick={() => alert(`Vocha imenakiliwa: ${v.code}`)}
                        className="bg-white text-slate-900 rounded-xl p-3 shadow-md border-2 border-emerald-400/80 cursor-pointer hover:scale-[1.02] transition-transform flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-900 px-1.5 py-0.2 rounded">
                              {v.profile}
                            </span>
                            <span className="text-[10px] text-slate-500 font-semibold">
                              {v.duration}
                            </span>
                          </div>
                          <div className="font-mono text-base font-black tracking-wider text-slate-950 mt-1">
                            {v.code}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Pass: {v.password}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-black text-emerald-700">
                            TSh {v.price.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            📋 Nakili
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {generatedDemoVouchers.length > 4 && (
                    <div className="text-center">
                      <button
                        onClick={() => setShowSetupModal(true)}
                        className="text-xs text-emerald-400 hover:text-emerald-300 underline font-semibold"
                      >
                        + Vocha nyingine {generatedDemoVouchers.length - 4} zipo. Unganisha router ili uzichapishe zote!
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/60">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-2xl mb-4 border border-emerald-500/20">
              ⚡
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Hakuna Barua Pepe (Zero Friction)
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Mteja hapotezi muda kujaza fomu ndefu au kusubiri uthibitisho wa email. Weka tu IP ya MikroTik na nenosiri lako binafsi.
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/60">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center text-2xl mb-4 border border-brand-500/20">
              🔒
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Salama Kupitia WireGuard VPN
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Router yako inawasiliana na seva ya website yetu kupitia mkondo salama wa WireGuard VPN au IP ya umma (Public IP) kwa amani ya akili.
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/60">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-2xl mb-4 border border-purple-500/20">
              🖨️
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Kuchapisha Papo Hapo (Print-Ready)
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Zalisha vocha 50 au 100 na uzichapishe mara moja kwenye karatasi ya POS (Thermal 58mm/80mm) au karatasi ya kawaida ya A4.
            </p>
          </div>
        </div>

        {/* Instructions: Jinsi ya Kusanidi Router */}
        <section id="instructions" className="bg-slate-850 rounded-3xl p-8 border border-slate-700 space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-black text-white">
              Hatua 2 za Kuandaa MikroTik Yako
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Fungua WinBox kwenye kompyuta yako na ufuate hatua hizi mbili tu:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-700/80 space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-sm">
                  1
                </span>
                <h3 className="font-bold text-white text-base">
                  Washa API kwenye MikroTik
                </h3>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Kwenye WinBox, nenda kwenye menyu ya <strong>IP</strong> &gt; <strong>Services</strong>. Hakikisha huduma ya <strong>api</strong> (Port 8728) imewashwa (haiko kijivu/disabled).
              </p>
              <div className="bg-slate-950 p-3 rounded-xl font-mono text-xs text-emerald-400 border border-slate-800">
                /ip service enable api
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-700/80 space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-brand-500 text-slate-950 font-black flex items-center justify-center text-sm">
                  2
                </span>
                <h3 className="font-bold text-white text-base">
                  Weka IP na Nenosiri Hapa
                </h3>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Bonyeza kitufe cha &quot;Unganisha Router&quot; hapa SaidZen WiFi. Weka IP ya router yako, weka username & password, kisha chagua nenosiri lako la tovuti.
              </p>
              <div className="bg-slate-950 p-3 rounded-xl font-mono text-xs text-brand-300 border border-slate-800">
                Router IP: 192.168.88.1 (au WireGuard IP)
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 text-slate-400 py-8 px-4 text-center text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-xs">
              S
            </div>
            <span className="font-bold text-white">SaidZen WiFi</span>
            <span>— Mfumo Mahiri wa Vocha za MikroTik</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setShowLoginModal(true)}
              className="hover:text-emerald-400 transition-colors"
            >
              Kuingia
            </button>
            <Link href="/login" className="hover:text-emerald-400 transition-colors">
              Ukurasa wa Login
            </Link>
            <button
              onClick={() => setShowSetupModal(true)}
              className="hover:text-emerald-400 transition-colors"
            >
              Unganisha Router Mpya
            </button>
          </div>
        </div>
      </footer>

      {/* ========================================================
          MODAL 1: QUICK CONNECT ROUTER SETUP (NO EMAIL REQUIRED)
      ======================================================== */}
      {showSetupModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8">
            <div className="flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold uppercase mb-2">
                  ⚡ Hatua Moja Tu
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Unganisha Router Yako ya MikroTik
                </h3>
                <p className="text-slate-400 text-xs mt-1">
                  Hakuna fomu ndefu wala barua pepe. Weka taarifa za router na uchague nenosiri lako la kutumia hapa.
                </p>
              </div>
              <button
                onClick={() => setShowSetupModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {setupError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-2xl text-xs">
                ⚠️ {setupError}
              </div>
            )}

            <form onSubmit={handleSetupSubmit} className="space-y-4">
              {/* Section A: MikroTik Details */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <span>📡</span> 1. Taarifa za MikroTik API
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      IP ya Router au WireGuard VPN *
                    </label>
                    <input
                      type="text"
                      required
                      value={setupForm.routerIp}
                      onChange={(e) => setSetupForm({ ...setupForm, routerIp: e.target.value })}
                      placeholder="192.168.88.1 au 10.8.0.2"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-emerald-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      API Port
                    </label>
                    <input
                      type="number"
                      value={setupForm.apiPort}
                      onChange={(e) => setSetupForm({ ...setupForm, apiPort: e.target.value })}
                      placeholder="8728"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-emerald-400 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      API Username ya MikroTik *
                    </label>
                    <input
                      type="text"
                      required
                      value={setupForm.apiUsername}
                      onChange={(e) => setSetupForm({ ...setupForm, apiUsername: e.target.value })}
                      placeholder="admin"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-emerald-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      API Password ya MikroTik *
                    </label>
                    <input
                      type="password"
                      required
                      value={setupForm.apiPassword}
                      onChange={(e) => setSetupForm({ ...setupForm, apiPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-emerald-400 outline-none"
                    />
                  </div>
                </div>

                {/* Connection Ping Test */}
                <div className="pt-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testStatus === "testing"}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-600 transition-colors flex items-center gap-1.5"
                  >
                    {testStatus === "testing" ? (
                      <>
                        <span className="w-3 h-3 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                        Inapima muunganisho...
                      </>
                    ) : (
                      <>🔍 Pima Muunganisho (Ping Test)</>
                    )}
                  </button>

                  {testMessage && (
                    <div
                      className={`text-[11px] font-medium ${
                        testStatus === "success" ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {testMessage}
                    </div>
                  )}
                </div>
              </div>

              {/* Section B: Security & Dashboard Credentials */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-brand-400 flex items-center gap-1.5">
                  <span>🔑</span> 2. Usalama wa Akaunti Yako (Bila Email)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Username ya Tovuti (Jina au Namba ya Simu) *
                    </label>
                    <input
                      type="text"
                      required
                      value={setupForm.dashboardUsername}
                      onChange={(e) => setSetupForm({ ...setupForm, dashboardUsername: e.target.value })}
                      placeholder="mfano: sinza_hotspot au 0712345678"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-brand-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Neno lako la siri (Password ya Tovuti) *
                    </label>
                    <input
                      type="password"
                      required
                      value={setupForm.dashboardPassword}
                      onChange={(e) => setSetupForm({ ...setupForm, dashboardPassword: e.target.value })}
                      placeholder="Weka password unayoikumbuka"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-brand-400 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Jina la Hotspot / Biashara yako (Hiari)
                  </label>
                  <input
                    type="text"
                    value={setupForm.businessName}
                    onChange={(e) => setSetupForm({ ...setupForm, businessName: e.target.value })}
                    placeholder="mfano: Sinza Executive Cafe WiFi"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-brand-400 outline-none"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSetupModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSetup}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingSetup ? (
                    <>
                      <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                      Inathibitisha Router...
                    </>
                  ) : (
                    "Kamilisha & Anza Kutengeneza Vocha →"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: QUICK LOGIN (NO EMAIL REQUIRED)
      ======================================================== */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-black text-white">
                  Ingia Kwenye SaidZen WiFi
                </h3>
                <p className="text-slate-400 text-xs mt-1">
                  Weka Username au IP ya Router yako na nenosiri lako
                </p>
              </div>
              <button
                onClick={() => setShowLoginModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {loginError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-2xl text-xs">
                ⚠️ {loginError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Username au IP ya Router
                </label>
                <input
                  type="text"
                  required
                  value={loginForm.identifier}
                  onChange={(e) => setLoginForm({ ...loginForm, identifier: e.target.value })}
                  placeholder="mfano: juma_wifi au 192.168.1.1"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:border-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Neno la Siri (Password)
                </label>
                <input
                  type="password"
                  required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:border-brand-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 bg-brand-500 hover:bg-brand-400 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-brand-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoggingIn ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Inathibitisha...
                  </>
                ) : (
                  "Ingia Kwenye Mfumo →"
                )}
              </button>
            </form>

            <div className="pt-3 border-t border-slate-800 text-center space-y-2">
              <div className="text-xs text-slate-500">
                Akaunti za demo za kujaribu:
              </div>
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLoginForm({ identifier: "juma_wifi", password: "vendor123" });
                    setLoginError("");
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
                >
                  juma_wifi
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginForm({ identifier: "admin", password: "admin123" });
                    setLoginError("");
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
                >
                  admin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
