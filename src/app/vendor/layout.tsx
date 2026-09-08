"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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

export default function VendorLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const r = await authFetch("/api/auth/session");
        if (!r.ok) throw new Error("Unauthorized");
        const data = await r.json();
        if (!mounted) return;
        stripAuthFromUrl();
        setSession(data);
        setChecking(false);
      } catch (err) {
        if (!mounted) return;
        setSession(null);
        setChecking(false);
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
    } catch {}
    window.location.href = "/login";
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const navItems = [
    { href: "/vendor", label: "Dashboard", icon: "🏠" },
    { href: "/vendor/vouchers", label: "Vocha", icon: "🎫" },
    { href: "/vendor/reports", label: "Ripoti", icon: "📊" },
    { href: "/vendor/settings", label: "Mipangilio", icon: "⚙️" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-emerald-950 text-white transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-5 border-b border-white/10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-lg">
              S
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight">
                SaidZen WiFi
              </div>
              <div className="text-[10px] text-emerald-300 uppercase tracking-wider">
                Vendor Panel
              </div>
            </div>
          </Link>
        </div>

        {/* Admin Switcher Banner if role is admin */}
        {session.role === "admin" && (
          <div className="m-3 p-3 bg-brand-900/60 border border-brand-500/40 rounded-xl text-xs space-y-1.5">
            <div className="font-bold text-brand-300 flex items-center gap-1.5">
              <span>👑</span> Umeingia kama Admin
            </div>
            <p className="text-[11px] text-slate-300 leading-tight">
              Unaangalia mtazamo wa wamiliki wa hotspot.
            </p>
            <Link
              href="/dashboard"
              className="inline-block w-full text-center py-1.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-lg text-xs transition-colors"
            >
              ← Rudi Admin Dashboard
            </Link>
          </div>
        )}

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
                    ? "bg-emerald-500/20 text-emerald-300 font-bold"
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
              href="/wifi"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <span className="text-base">📶</span>
              Portal ya WiFi
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

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-emerald-950">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-emerald-500/30 rounded-full flex items-center justify-center text-sm font-bold text-emerald-300">
              {session.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{session.name}</div>
              <div className="text-xs text-slate-400 truncate">
                {session.role === "admin" ? "Super Admin" : "Vendor"}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2"
          >
            <span>🚪</span> Toka
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-600"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-slate-800">
              {navItems.find((i) => i.href === pathname)?.label || "Vendor Panel"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {session.role === "admin" && (
              <Link
                href="/dashboard"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-xl text-xs font-bold transition-colors"
              >
                <span>👑</span> Admin Panel
              </Link>
            )}
            <Link
              href="/wifi"
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
            >
              <span>📶</span> Portal
            </Link>
          </div>
        </header>

        <main className="p-6 flex-1 animate-fadeIn">{children}</main>
      </div>
    </div>
  );
}
