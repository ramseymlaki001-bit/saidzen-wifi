"use client";

import { useState } from "react";
import Link from "next/link";
<<<<<<< HEAD
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
=======

export default function ResetPasswordPage() {
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
  const [step, setStep] = useState<1 | 2>(1);
  const [identifier, setIdentifier] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resetToken, setResetToken] = useState("");

  async function handleRequestReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Imeshindikana");
        return;
      }

      setResetToken(data.resetToken || "");
      setStep(2);
      setSuccess("Token imetengenezwa! (Kwenye production, hii ingetumwa kwa email/SMS)");
    } catch {
      setError("Kosa la mtandao");
    }
    setLoading(false);
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Manenosiri hayalingani");
      setLoading(false);
      return;
    }

    if (newPassword.length < 4) {
      setError("Nenosiri lazima liwe na herufi 4 au zaidi");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken || token, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Imeshindikana");
        return;
      }

      setSuccess("✅ Nenosiri limebadilishwa! Sasa unaweza kuingia.");
      setTimeout(() => {
<<<<<<< HEAD
        router.push("/login");
      }, 1500);
=======
        window.location.href = "/login";
      }, 2000);
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
    } catch {
      setError("Kosa la mtandao");
    }
    setLoading(false);
  }

  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-slate-900 to-brand-900 flex items-center justify-center p-4">
=======
    <div className="min-h-screen bg-linear-to-br from-brand-950 via-slate-900 to-brand-900 flex items-center justify-center p-4">
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
      <div className="w-full max-w-md animate-fadeIn">
        <Link href="/" className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-xl shadow-brand-500/30">
            S
          </div>
          <span className="text-2xl font-bold text-white">
            Said<span className="text-brand-400">Zen</span> WiFi
          </span>
        </Link>

        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-white/20">
          <h1 className="text-xl font-bold text-center mb-1 text-slate-900">
            {step === 1 ? "🔑 Sahau Nenosiri?" : "🔐 Weka Nenosiri Jipya"}
          </h1>
          <p className="text-slate-500 text-xs text-center mb-6">
            {step === 1
              ? "Weka username au IP ya router ili kuanza kurejesha nenosiri"
              : "Weka token na nenosiri jippy"}
          </p>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl mb-4 text-xs">
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl mb-4 text-xs">
              {success}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username au IP ya Router
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  placeholder="mfano: juma_wifi"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 disabled:opacity-50 text-sm"
              >
                {loading ? "Inatuma..." : "Tuma Ombi la Kurejesha"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Token (Ulipata wapi?)
                </label>
                <input
                  type="text"
                  value={resetToken || token}
                  onChange={(e) => {
                    setResetToken(e.target.value);
                    setToken(e.target.value);
                  }}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-sm font-mono"
                  placeholder="Token uliyopata"
                  required
                />
                {resetToken && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Token: {resetToken.slice(0, 16)}...
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nenosiri Jipya
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rudia Nenosiri
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50 text-sm"
              >
                {loading ? "Inabadilisha..." : "Badilisha Nenosiri"}
              </button>
            </form>
          )}

          <div className="mt-5 text-center">
            <Link href="/login" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
              ← Rudi kwenye Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
