"use client";

import { useEffect, useState, useCallback } from "react";
<<<<<<< HEAD
import { authFetch } from "@/lib/client-auth";
=======
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a

interface Log {
  id: number;
  action: string;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
  userName: string | null;
  userRole: string | null;
}

interface ByAction {
  action: string;
  count: number;
}

const ACTION_META: Record<string, { label: string; icon: string; color: string }> = {
  login: { label: "Kuingia", icon: "🔑", color: "bg-emerald-100 text-emerald-800" },
  logout: { label: "Kutoka", icon: "🚪", color: "bg-slate-100 text-slate-700" },
  failed_login: { label: "Kuingia Kulikosea", icon: "⛔", color: "bg-rose-100 text-rose-800" },
  generate_voucher: { label: "Kuzalisha Vocha", icon: "🎫", color: "bg-brand-100 text-brand-800" },
  delete_voucher: { label: "Kufuta Vocha", icon: "🗑️", color: "bg-rose-100 text-rose-800" },
  toggle_router: { label: "Kuwasha/Kuzima Router", icon: "📡", color: "bg-amber-100 text-amber-800" },
  record_payment: { label: "Kurekodi Malipo", icon: "💰", color: "bg-emerald-100 text-emerald-800" },
  change_password: { label: "Kubadilisha Nenosiri", icon: "🔒", color: "bg-purple-100 text-purple-800" },
  create_client: { label: "Kuongeza Router", icon: "➕", color: "bg-blue-100 text-blue-800" },
  update_client: { label: "Kusasisha Router", icon: "✏️", color: "bg-blue-100 text-blue-800" },
  password_reset_request: { label: "Ombi la Nenosiri", icon: "📧", color: "bg-amber-100 text-amber-800" },
  password_reset: { label: "Nenosiri Limebadilishwa", icon: "🔐", color: "bg-purple-100 text-purple-800" },
};

export default function ActivityPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [byAction, setByAction] = useState<ByAction[]>([]);
  const [failedLogins, setFailedLogins] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    try {
      const qs = filter ? `?action=${filter}&limit=100` : "?limit=100";
<<<<<<< HEAD
      const res = await authFetch(`/api/audit${qs}`);
=======
      const res = await fetch(`/api/audit${qs}`);
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
      const data = await res.json();
      if (data.logs) setLogs(data.logs);
      if (data.byAction) setByAction(data.byAction);
      if (typeof data.failedLogins === "number") setFailedLogins(data.failedLogins);
    } catch {
      /* kimya */
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    load();
    // Live refresh kila sekunde 20 — kurasa zinabaki "zikiwasiliana"
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">📜 Kumbukumbu za Matendo</h2>
          <p className="text-slate-500 text-sm">
            Kila kitendo kwenye mfumo kinarekodiwa — nani alifanya nini, lini, kutoka wapi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Inasasisha kila sekunde 20
          </span>
          <button
            onClick={() => { setLoading(true); load(); }}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50"
          >
            🔄 Sasa
          </button>
        </div>
      </div>

      {/* Usalama */}
      <div
        className={`rounded-2xl p-4 border ${
          failedLogins > 10
            ? "bg-rose-50 border-rose-300"
            : "bg-emerald-50 border-emerald-200"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{failedLogins > 10 ? "🚨" : "🛡️"}</span>
          <div>
            <div className="font-bold text-sm text-slate-800">
              Jaribio lililoshindwa la kuingia: {failedLogins}
            </div>
            <p className="text-xs text-slate-500">
              {failedLogins > 10
                ? "Mengi sana! Kuna mtu anajaribu kuvunja nenosiri. Mfumo umeziba kwa muda (rate limit)."
                : "Usalama uko salama (siku 30 zilizopita)."}
            </p>
          </div>
        </div>
      </div>

      {/* Hesabu kwa aina */}
      {byAction.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {byAction.map((a) => {
            const meta = ACTION_META[a.action] || {
              label: a.action,
              icon: "•",
              color: "bg-slate-100 text-slate-700",
            };
            return (
              <button
                key={a.action}
                onClick={() => setFilter(filter === a.action ? "" : a.action)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  filter === a.action
                    ? "border-brand-500 bg-brand-50"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">{meta.icon}</span>
                  <span className="text-xl font-black text-slate-900">{a.count}</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {meta.label}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Orodha */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {filter && (
          <div className="px-5 py-2.5 bg-brand-50 border-b border-brand-100 flex items-center justify-between">
            <span className="text-xs font-bold text-brand-800">
              Inachuja: {ACTION_META[filter]?.label || filter}
            </span>
            <button
              onClick={() => setFilter("")}
              className="text-xs text-brand-600 hover:text-brand-800 font-bold"
            >
              ✕ Ondoa kichujio
            </button>
          </div>
        )}

        {logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-3xl mb-2">📜</p>
            <p className="font-medium text-slate-600">Hakuna kumbukumbu bado</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => {
              const meta = ACTION_META[log.action] || {
                label: log.action,
                icon: "•",
                color: "bg-slate-100 text-slate-700",
              };
              return (
                <div key={log.id} className="px-5 py-3 hover:bg-slate-50/70 flex items-start gap-3">
                  <span className="text-lg mt-0.5">{meta.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${meta.color}`}
                      >
                        {meta.label}
                      </span>
                      <span className="text-xs font-semibold text-slate-700">
                        {log.userName || "Mgeni"}
                        {log.userRole === "admin" && (
                          <span className="ml-1 text-[10px] bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded font-bold">
                            ADMIN
                          </span>
                        )}
                      </span>
                    </div>
                    {log.details && (
                      <p className="text-xs text-slate-600 mt-1 break-words">
                        {log.details}
                      </p>
                    )}
                    <div className="text-[10px] text-slate-400 mt-1 flex gap-2">
                      <span>
                        {new Date(log.createdAt).toLocaleString("sw-TZ", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {log.ipAddress && (
                        <span className="font-mono">• {log.ipAddress}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
