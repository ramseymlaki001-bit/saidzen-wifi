"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Imeshindikana kuingia. Hakiki taarifa zako.");
        setLoading(false);
        return;
      }

      setSuccess("✅ Umeingia kikamilifu! Inafungua...");
      const target = data.role === "admin" ? "/dashboard" : "/vendor";
      window.location.href = target;
    } catch {
      setError("Kosa la mtandao. Jaribu tena.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-brand-950 via-slate-900 to-brand-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fadeIn">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-xl shadow-brand-500/30">
            S
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">
            Said<span className="text-brand-400">Zen</span> WiFi
          </span>
        </Link>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-white/20">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900">
              Karibu Tena! 👋
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Ingia kwa <span className="font-semibold text-slate-700">Username</span> au <span className="font-semibold text-slate-700">IP ya Router</span>
            </p>
          </div>

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl mb-5 text-sm flex items-center gap-2 animate-fadeIn">
              <span className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl mb-5 text-sm flex items-start gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Username au IP ya Router yako
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-slate-800 transition-all font-medium placeholder:text-slate-400"
                placeholder="mfano: Rajabu au juma_wifi"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Neno la Siri (Password)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-slate-800 transition-all placeholder:text-slate-400"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-600/25 mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Inathibitisha...
                </>
              ) : (
                "Ingia Kwenye Dashboard →"
              )}
            </button>
          </form>

          {/* Forgot Password Link */}
          <div className="text-center mt-3">
            <Link
              href="/reset-password"
              className="text-xs text-brand-600 hover:text-brand-700 font-medium underline"
            >
              Sahau Nenosiri? Bofya hapa
            </Link>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <Link
              href="/"
              className="hover:text-brand-600 transition-colors"
            >
              ← Mwanzo
            </Link>
            <Link
              href="/connect"
              className="hover:text-emerald-600 font-medium transition-colors"
            >
              📋 Command ya WinBox
            </Link>
            <Link
              href="/wifi"
              className="hover:text-brand-600 font-bold transition-colors text-emerald-600"
            >
              📶 WiFi Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
