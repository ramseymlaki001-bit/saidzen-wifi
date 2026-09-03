"use client";

import { useEffect, useState, useCallback } from "react";

interface Client {
  id: number;
  userId: number;
  dashboardUsername: string | null;
  businessName: string;
  location: string | null;
  routerIp: string;
  routerPort: number;
  vpnIp: string | null;
  status: string;
  monthlyFee: string;
  subscriptionEnd: string;
  createdAt: string;
  userName: string;
  userUsername: string | null;
  userEmail: string | null;
  userPhone: string | null;
  routerUsername?: string;
}

interface ClientVoucher {
  id: number;
  code: string;
  password: string;
  status: string;
  profileName: string;
  profilePrice: string;
  createdAt: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    password: "vendor123",
    businessName: "",
    location: "",
    routerIp: "",
    routerUsername: "admin",
    routerPassword: "",
    routerPort: "8728",
    vpnIp: "",
    monthlyFee: "50000",
  });

  const loadClients = useCallback(async () => {
    const res = await fetch("/api/clients");
    const data = await res.json();
    setClients(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        routerPort: parseInt(form.routerPort) || 8728,
      }),
    });

    if (res.ok) {
      setShowForm(false);
      setForm({
        name: "",
        username: "",
        email: "",
        phone: "",
        password: "vendor123",
        businessName: "",
        location: "",
        routerIp: "",
        routerUsername: "admin",
        routerPassword: "",
        routerPort: "8728",
        vpnIp: "",
        monthlyFee: "50000",
      });
      loadClients();
    } else {
      const data = await res.json();
      alert(data.error || "Imeshindikana kusajili");
    }
    setSaving(false);
  }

  async function toggleClient(id: number, currentStatus: string) {
    const action = currentStatus === "active" ? "suspend" : "activate";
    const res = await fetch(`/api/clients/${id}/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      loadClients();
    }
  }

  // ── KUREKEBISHA API YA ROUTER YA MTEJA (admin) ──────────────
  const [editing, setEditing] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    businessName: "",
    routerIp: "",
    routerUsername: "admin",
    routerPassword: "",
    routerPort: "8728",
    vpnIp: "",
    monthlyFee: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editMsg, setEditMsg] = useState("");

  function openEdit(c: Client) {
    setEditing(c.id);
    setEditMsg("");
    setEditForm({
      businessName: c.businessName,
      routerIp: c.routerIp,
      routerUsername: c.routerUsername || "admin",
      routerPassword: "",
      routerPort: String(c.routerPort || 8728),
      vpnIp: c.vpnIp || "",
      monthlyFee: c.monthlyFee,
    });
  }

  async function saveEdit() {
    if (!editing) return;
    setSavingEdit(true);
    setEditMsg("");

    const payload: Record<string, unknown> = {
      businessName: editForm.businessName,
      routerIp: editForm.routerIp,
      routerUsername: editForm.routerUsername,
      routerPort: parseInt(editForm.routerPort) || 8728,
      vpnIp: editForm.vpnIp,
      monthlyFee: editForm.monthlyFee,
    };
    // Nenosiri litumika ikiwa mteja ameliweka tu
    if (editForm.routerPassword.length > 0) {
      payload.routerPassword = editForm.routerPassword;
    }

    try {
      const res = await fetch(`/api/clients/${editing}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setEditMsg(`✅ ${data.message}`);
        setTimeout(() => {
          setEditing(null);
          loadClients();
        }, 1200);
      } else {
        setEditMsg(`❌ ${data.error}`);
      }
    } catch {
      setEditMsg("❌ Kosa la mtandao");
    }
    setSavingEdit(false);
  }

  // ── KUONA VOCHA ZA MTEJA (admin) ────────────────────────────
  const [viewVouchers, setViewVouchers] = useState<number | null>(null);
  const [clientVouchers, setClientVouchers] = useState<ClientVoucher[]>([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);

  async function openVouchers(clientId: number) {
    setViewVouchers(clientId);
    setLoadingVouchers(true);
    try {
      const res = await fetch(`/api/vouchers?clientId=${clientId}`);
      const data = await res.json();
      setClientVouchers(Array.isArray(data) ? data.slice(0, 30) : []);
    } catch {
      setClientVouchers([]);
    }
    setLoadingVouchers(false);
  }

  function statusBadge(status: string) {
    const styles: Record<string, string> = {
      active: "bg-emerald-100 text-emerald-800",
      suspended: "bg-amber-100 text-amber-800",
      expired: "bg-rose-100 text-rose-800",
    };
    const labels: Record<string, string> = {
      active: "Anafanya Kazi",
      suspended: "Amesimamishwa",
      expired: "Amechelewa",
    };
    return (
      <span
        className={`px-2.5 py-1 rounded-full text-xs font-bold ${styles[status] || "bg-slate-100 text-slate-600"}`}
      >
        {labels[status] || status}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Wateja na Router ({clients.length})
          </h2>
          <p className="text-slate-500 text-sm">
            Orodha ya wamiliki wa hotspot, IP za router zao, na hali ya muunganisho
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors shadow-md shadow-brand-600/20"
        >
          {showForm ? "✕ Funga Fomu" : "+ Sajili Router ya Mteja"}
        </button>
      </div>

      {/* Registration Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-md space-y-6 animate-fadeIn"
        >
          <div className="border-b pb-3">
            <h3 className="font-black text-lg text-slate-900">
              📝 Sajili Mteja Mpya & Router Yake ya MikroTik
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Mteja atatumia Username na Nenosiri kuingia moja kwa moja (bila kuhitaji email)
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* User Info */}
            <div className="space-y-4">
              <h4 className="font-bold text-xs text-brand-600 uppercase tracking-wider">
                1. Taarifa za Mteja & Akaunti
              </h4>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Jina Kamili au Jina la Mteja *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                  placeholder="Juma Hassan"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Username ya Kuingia kwenye Tovuti * (Bila Email)
                </label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-mono"
                  placeholder="mfano: juma_wifi au 0755123456"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Nenosiri la Mteja (Dashboard Password) *
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                  placeholder="vendor123"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Jina la Biashara / Hotspot *
                </label>
                <input
                  type="text"
                  value={form.businessName}
                  onChange={(e) =>
                    setForm({ ...form, businessName: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                  placeholder="Duka la Juma WiFi"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Simu ya Mteja (Hiari)
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                  placeholder="+255 755 123 456"
                />
              </div>
            </div>

            {/* Router Info */}
            <div className="space-y-4">
              <h4 className="font-bold text-xs text-emerald-600 uppercase tracking-wider">
                2. Taarifa za Router (MikroTik API)
              </h4>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold mb-1">
                    Router IP *
                  </label>
                  <input
                    type="text"
                    value={form.routerIp}
                    onChange={(e) =>
                      setForm({ ...form, routerIp: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-mono"
                    placeholder="192.168.88.1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    API Port
                  </label>
                  <input
                    type="number"
                    value={form.routerPort}
                    onChange={(e) =>
                      setForm({ ...form, routerPort: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  VPN IP (WireGuard)
                </label>
                <input
                  type="text"
                  value={form.vpnIp}
                  onChange={(e) => setForm({ ...form, vpnIp: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-mono"
                  placeholder="10.8.0.2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    MikroTik API Username
                  </label>
                  <input
                    type="text"
                    value={form.routerUsername}
                    onChange={(e) =>
                      setForm({ ...form, routerUsername: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    MikroTik API Password *
                  </label>
                  <input
                    type="password"
                    value={form.routerPassword}
                    onChange={(e) =>
                      setForm({ ...form, routerPassword: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-mono"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Ada ya Kila Mwezi (TSh)
                </label>
                <input
                  type="number"
                  value={form.monthlyFee}
                  onChange={(e) =>
                    setForm({ ...form, monthlyFee: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50"
            >
              Ghairi
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 disabled:opacity-50 shadow-md shadow-brand-600/20"
            >
              {saving ? "Inasajili..." : "Sajili Mteja & Washa Vocha"}
            </button>
          </div>
        </form>
      )}

      {/* Clients Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {clients.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-4xl mb-3">👥</p>
            <p className="font-medium text-slate-700">Hakuna wateja bado</p>
            <p className="text-xs text-slate-400 mt-1">
              Bonyeza &quot;Sajili Router ya Mteja&quot; kuanza
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b">
                <tr>
                  <th className="text-left px-6 py-3.5">Biashara</th>
                  <th className="text-left px-6 py-3.5">Username ya Kuingia</th>
                  <th className="text-left px-6 py-3.5">Router IP</th>
                  <th className="text-left px-6 py-3.5">Hali</th>
                  <th className="text-left px-6 py-3.5">Ada/Mwezi</th>
                  <th className="text-left px-6 py-3.5">Mwisho wa Malipo</th>
                  <th className="text-left px-6 py-3.5">Udhibiti wa API</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clients.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 text-sm">
                        {c.businessName}
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        {c.userName} {c.userPhone ? `• ${c.userPhone}` : ""}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold bg-slate-100 text-slate-800 px-2 py-1 rounded-lg">
                        {c.dashboardUsername || c.userUsername || "mteja"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-800">
                      <div>{c.routerIp}</div>
                      {c.vpnIp && (
                        <div className="text-[10px] text-emerald-600 font-semibold">
                          VPN: {c.vpnIp}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">{statusBadge(c.status)}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      TSh {Number(c.monthlyFee).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(c.subscriptionEnd).toLocaleDateString("sw-TZ")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => toggleClient(c.id, c.status)}
                          className={`px-2.5 py-1.5 rounded-xl font-bold transition-all text-xs ${
                            c.status === "active"
                              ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {c.status === "active" ? "🔒 Zima" : "🔓 Washa"}
                        </button>

                        <button
                          onClick={() => openEdit(c)}
                          title="Rekebisha API ya router (IP, username, password)"
                          className="px-2.5 py-1.5 rounded-xl font-bold text-xs bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200"
                        >
                          ✏️ Rekebisha API
                        </button>

                        <button
                          onClick={() => openVouchers(c.id)}
                          title="Ona vocha za mteja huu"
                          className="px-2.5 py-1.5 rounded-xl font-bold text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200"
                        >
                          🎫 Vocha
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ══════════ MODALI 1: KUREKEBISHA API YA ROUTER ══════════ */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 my-8 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-black text-lg text-slate-900">
                  ✏️ Rekebisha API ya Router
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tumia hii kama mteja amebadilisha nenosiri la router yake au
                  mfumo umeshindwa kuongea nayo
                </p>
              </div>
              <button
                onClick={() => setEditing(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {editMsg && (
              <div
                className={`px-4 py-2.5 rounded-xl text-xs font-medium ${
                  editMsg.startsWith("✅")
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                {editMsg}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Jina la Biashara
                </label>
                <input
                  value={editForm.businessName}
                  onChange={(e) =>
                    setEditForm({ ...editForm, businessName: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Router IP <span className="text-slate-400">(au VPN IP)</span>
                  </label>
                  <input
                    value={editForm.routerIp}
                    onChange={(e) =>
                      setEditForm({ ...editForm, routerIp: e.target.value })
                    }
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Port
                  </label>
                  <input
                    value={editForm.routerPort}
                    onChange={(e) =>
                      setEditForm({ ...editForm, routerPort: e.target.value })
                    }
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    API Username
                  </label>
                  <input
                    value={editForm.routerUsername}
                    onChange={(e) =>
                      setEditForm({ ...editForm, routerUsername: e.target.value })
                    }
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    VPN IP (WireGuard)
                  </label>
                  <input
                    value={editForm.vpnIp}
                    onChange={(e) =>
                      setEditForm({ ...editForm, vpnIp: e.target.value })
                    }
                    placeholder="10.8.0.2"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <label className="block text-xs font-bold text-amber-800 mb-1">
                  🔑 Nenosiri Jipya la Router (acha tupu kama haujabadilika)
                </label>
                <input
                  type="password"
                  value={editForm.routerPassword}
                  onChange={(e) =>
                    setEditForm({ ...editForm, routerPassword: e.target.value })
                  }
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 border border-amber-300 rounded-xl text-sm font-mono outline-none focus:border-amber-500 bg-white"
                />
                <p className="text-[10px] text-amber-700 mt-1">
                  Litahifadhiwa likiwa limefichwa (encrypted)
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Ada ya Kila Mwezi (TSh)
                </label>
                <input
                  type="number"
                  value={editForm.monthlyFee}
                  onChange={(e) =>
                    setEditForm({ ...editForm, monthlyFee: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditing(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50"
              >
                Ghairi
              </button>
              <button
                onClick={saveEdit}
                disabled={savingEdit}
                className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 disabled:opacity-50"
              >
                {savingEdit ? "Inahifadhi..." : "Hifadhi Mabadiliko"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ MODALI 2: VOCHA ZA MTEJA ══════════ */}
      {viewVouchers && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between sticky top-0 bg-white pb-2">
              <div>
                <h3 className="font-black text-lg text-slate-900">
                  🎫 Vocha za{" "}
                  {clients.find((c) => c.id === viewVouchers)?.businessName}
                </h3>
                <p className="text-xs text-slate-500">
                  Vocha {clientVouchers.length} (zinazoonekana: 30 za mwisho)
                </p>
              </div>
              <button
                onClick={() => setViewVouchers(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {loadingVouchers ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-7 h-7 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : clientVouchers.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <p className="text-3xl mb-2">🎫</p>
                <p className="text-sm font-medium text-slate-600">
                  Mteja hana vocha bado
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
                    <tr>
                      <th className="text-left px-3 py-2 font-bold">Code</th>
                      <th className="text-left px-3 py-2 font-bold">Pass</th>
                      <th className="text-left px-3 py-2 font-bold">Aina</th>
                      <th className="text-left px-3 py-2 font-bold">Bei</th>
                      <th className="text-left px-3 py-2 font-bold">Hali</th>
                      <th className="text-left px-3 py-2 font-bold">Tarehe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {clientVouchers.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-mono font-black text-slate-900">
                          {v.code}
                        </td>
                        <td className="px-3 py-2 font-mono text-slate-600">
                          {v.password}
                        </td>
                        <td className="px-3 py-2">{v.profileName}</td>
                        <td className="px-3 py-2 font-bold">
                          {Number(v.profilePrice).toLocaleString()}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              v.status === "unused"
                                ? "bg-emerald-100 text-emerald-800"
                                : v.status === "used"
                                  ? "bg-slate-100 text-slate-600"
                                  : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {v.status === "unused"
                              ? "Haijatumiwa"
                              : v.status === "used"
                                ? "Imetumika"
                                : "Imepitwa"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-400">
                          {new Date(v.createdAt).toLocaleDateString("sw-TZ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <a
              href={`/api/export/csv?type=vouchers&clientId=${viewVouchers}`}
              className="block w-full text-center py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700"
            >
              📥 Pakua CSV ya Vocha Hizi
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
