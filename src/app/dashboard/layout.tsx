"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  authFetch,
  removeStoredToken,
  stripAuthFromUrl,
} from "@/lib/client-auth";

interface Session {
  userId: number;
  name: string;
  email: string;
  role: string;
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const r = await authFetch("/api/auth/session");
        if (!r.ok) throw new Error("Unauthorized");
        const data = await r.json();
        if (!mounted) return;

        if (data.role !== "admin") {
          window.location.href = "/vendor";
          return;
        }

        stripAuthFromUrl();
        setSession(data);
        setAuthError("");
      } catch (err) {
        if (!mounted) return;
        setAuthError("Kikao hakikupatikana. Tafadhali ingia tena.");
      }
    }

    loadSession();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleLogout() {
    removeStoredToken();
    try {
      await authFetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    window.location.href = "/login";
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/dashboard/clients", label: "Wateja", icon: "👥" },
    { href: "/dashboard/payments", label: "Malipo", icon: "💰" },
    { href: "/dashboard/support", label: "Msaada", icon: "🎧" },
    { href: "/dashboard/activity", label: "Kumbukumbu", icon: "📜" },
    { href: "/dashboard/settings", label: "Mipangilio", icon: "⚙️" },
  ];

  if (session === null && !authError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Inafungua dashibodi...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 max-w-sm w-full text-center space-y-4">
          <div className="text-4xl">🔒</div>
          <h1 className="text-lg font-black text-slate-900">Inahitaji kuingia</h1>
          <p className="text-sm text-slate-500">
            {authError || "Tafadhali ingia kama admin ili uone ukurasa huu."}
          </p>
          <a
            href="/login"
            className="block w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-sm"
          >
            🔑 Ingia sasa
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-brand-950 text-white transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-5 border-b border-white/10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-500 rounded-lg flex items-center justify-center font-bold text-lg">
              S
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight">SaidZen WiFi</div>
              <div className="text-[10px] text-brand-300 uppercase tracking-wider">
                Admin Panel
              </div>
            </div>
          </Link>
        </div>

        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand-500/20 text-brand-300 font-bold"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}

          <div className="pt-2 mt-2 border-t border-white/10 space-y-1">
            <Link
              href="/vendor"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 transition-colors"
            >
              <span className="text-base">🏪</span>
              Fungua Vendor View
            </Link>
            <Link
              href="/wifi"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <span className="text-base">📶</span>
              Portal za WiFi
            </Link>
            <Link
              href="/connect"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <span className="text-base">📋</span>
              Command ya WinBox
            </Link>
            <Link
              href="/"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <span className="text-base">🏠</span>
              Ukurasa wa Mwanzo
            </Link>
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-brand-950">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-brand-500/30 rounded-full flex items-center justify-center text-sm font-bold text-brand-300">
              {session.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{session.name}</div>
              <div className="text-xs text-slate-400 truncate">Super Admin</div>
            </div>
          </div>
          <Link
            href="/dashboard/settings"
            onClick={() => setSidebarOpen(false)}
            className="block px-4 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            🔑 Badilisha Nenosiri
          </Link>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2"
          >
            <span>🚪</span> Toka
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-slate-800">
              {navItems.find((i) => i.href === pathname)?.label || "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/vendor"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors"
            >
              <span>🏪</span> Vendor View
            </Link>
            <Link
              href="/wifi"
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
            >
              <span>📶</span> Portal
            </Link>
            <Link
              href="/connect"
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
            >
              <span>📋</span> Connect
            </Link>
          </div>
        </header>

        <main className="p-6 flex-1 animate-fadeIn">{children}</main>
      </div>
    </div>
  );
}
