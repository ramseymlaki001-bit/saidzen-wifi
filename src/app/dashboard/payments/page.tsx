"use client";

import { useEffect, useState, useCallback } from "react";

interface Client {
  id: number;
  businessName: string;
  monthlyFee: string;
  status: string;
  subscriptionEnd: string;
}

interface Payment {
  id: number;
  amount: string;
  method: string;
  reference: string | null;
  paidAt: string;
  periodStart: string;
  periodEnd: string;
  clientId: number;
  businessName: string;
}

export default function PaymentsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    clientId: "",
    amount: "",
    method: "cash",
    reference: "",
  });

  const loadData = useCallback(async () => {
    const [cRes, pRes] = await Promise.all([
      fetch("/api/clients"),
      fetch("/api/payments"),
    ]);
    const clientsData = await cRes.json();
    const paymentsData = await pRes.json();
    setClients(Array.isArray(clientsData) ? clientsData : []);
    setPayments(Array.isArray(paymentsData) ? paymentsData : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: parseInt(form.clientId),
        amount: form.amount || undefined,
        method: form.method,
        reference: form.reference || undefined,
      }),
    });

    if (res.ok) {
      setShowForm(false);
      setForm({ clientId: "", amount: "", method: "cash", reference: "" });
      loadData();
    } else {
      const data = await res.json();
      alert(data.error || "Imeshindikana");
    }
    setSaving(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">💰 Malipo</h2>
          <p className="text-slate-500 text-sm">
            Rekodi na fuatilia malipo ya kila mwezi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/export/csv?type=payments"
            className="px-5 py-2.5 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
          >
            📥 Pakua CSV
          </a>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
          >
            {showForm ? "✕ Funga" : "+ Rekodi Malipo"}
          </button>
        </div>
      </div>

      {/* Payment Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4 animate-fadeIn"
        >
          <h3 className="font-bold text-lg">💳 Rekodi Malipo Mapya</h3>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Mteja</label>
              <select
                value={form.clientId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    clientId: e.target.value,
                    amount:
                      clients.find((c) => c.id === parseInt(e.target.value))
                        ?.monthlyFee || "",
                  })
                }
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                required
              >
                <option value="">-- Chagua Mteja --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.businessName} (TSh{" "}
                    {Number(c.monthlyFee).toLocaleString()}/mwezi)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Kiasi (TSh)
              </label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                placeholder="50000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Njia ya Malipo
              </label>
              <select
                value={form.method}
                onChange={(e) => setForm({ ...form, method: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
              >
                <option value="cash">Taslimu</option>
                <option value="mpesa">M-Pesa</option>
                <option value="tigopesa">Tigo Pesa</option>
                <option value="airtel">Airtel Money</option>
                <option value="bank">Benki</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Namba ya Rejeleo
              </label>
              <input
                type="text"
                value={form.reference}
                onChange={(e) =>
                  setForm({ ...form, reference: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                placeholder="TXN123456"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 border border-slate-200 rounded-xl font-medium hover:bg-slate-50"
            >
              Ghairi
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? "Inasajili..." : "Rekodi Malipo & Ongeza Siku 30"}
            </button>
          </div>
        </form>
      )}

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {payments.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-4xl mb-3">💳</p>
            <p className="font-medium">Hakuna malipo bado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="text-left px-6 py-3 font-medium">Mteja</th>
                  <th className="text-left px-6 py-3 font-medium">Kiasi</th>
                  <th className="text-left px-6 py-3 font-medium">Njia</th>
                  <th className="text-left px-6 py-3 font-medium">Rejeleo</th>
                  <th className="text-left px-6 py-3 font-medium">
                    Tarehe ya Malipo
                  </th>
                  <th className="text-left px-6 py-3 font-medium">
                    Kipindi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-medium">
                      {p.businessName}
                    </td>
                    <td className="px-6 py-3">
                      TSh {Number(p.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-3 capitalize">{p.method}</td>
                    <td className="px-6 py-3 text-slate-500 font-mono text-xs">
                      {p.reference || "-"}
                    </td>
                    <td className="px-6 py-3">
                      {new Date(p.paidAt).toLocaleDateString("sw-TZ")}
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-500">
                      {new Date(p.periodStart).toLocaleDateString("sw-TZ")} →{" "}
                      {new Date(p.periodEnd).toLocaleDateString("sw-TZ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
