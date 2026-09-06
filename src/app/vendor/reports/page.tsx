"use client";

import { useEffect, useState, useCallback } from "react";
<<<<<<< HEAD
import { authFetch } from "@/lib/client-auth";
=======
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a

interface Voucher {
  id: number;
  code: string;
  status: string;
  createdAt: string;
  usedAt: string | null;
  profileName: string;
  profileDuration: string;
  profilePrice: string;
}

interface DailyStat {
  date: string;
  generated: number;
  used: number;
  revenue: number;
}

export default function ReportsPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
<<<<<<< HEAD
    const res = await authFetch("/api/vouchers");
=======
    const res = await fetch("/api/vouchers");
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
    const data = await res.json();
    setVouchers(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Calculate stats
  const totalGenerated = vouchers.length;
  const totalUsed = vouchers.filter((v) => v.status === "used").length;
  const totalUnused = vouchers.filter((v) => v.status === "unused").length;
  const totalRevenue = vouchers
    .filter((v) => v.status === "used")
    .reduce((sum, v) => sum + Number(v.profilePrice), 0);
  const potentialRevenue = vouchers
    .filter((v) => v.status === "unused")
    .reduce((sum, v) => sum + Number(v.profilePrice), 0);

  // Group by profile
  const profileStats = vouchers.reduce(
    (acc, v) => {
      const key = v.profileName;
      if (!acc[key]) {
        acc[key] = {
          name: v.profileName,
          duration: v.profileDuration,
          price: Number(v.profilePrice),
          generated: 0,
          used: 0,
          revenue: 0,
        };
      }
      acc[key].generated++;
      if (v.status === "used") {
        acc[key].used++;
        acc[key].revenue += Number(v.profilePrice);
      }
      return acc;
    },
    {} as Record<
      string,
      {
        name: string;
        duration: string;
        price: number;
        generated: number;
        used: number;
        revenue: number;
      }
    >
  );

  // Group by date (last 7 days)
  const dailyStats: DailyStat[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const dayVouchers = vouchers.filter(
      (v) => v.createdAt.split("T")[0] === dateStr
    );
    const dayUsed = vouchers.filter(
      (v) => v.usedAt && v.usedAt.split("T")[0] === dateStr
    );

    dailyStats.push({
      date: dateStr,
      generated: dayVouchers.length,
      used: dayUsed.length,
      revenue: dayUsed.reduce((s, v) => s + Number(v.profilePrice), 0),
    });
  }

  const maxGenerated = Math.max(...dailyStats.map((d) => d.generated), 1);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">📊 Ripoti ya Mauzo</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Vocha Zilizozalishwa",
            value: totalGenerated,
            icon: "🎫",
            color: "bg-blue-50 text-blue-700",
          },
          {
            label: "Zimetumika",
            value: totalUsed,
            icon: "✅",
            color: "bg-green-50 text-green-700",
          },
          {
            label: "Mapato (Zimetumika)",
            value: `TSh ${totalRevenue.toLocaleString()}`,
            icon: "💰",
            color: "bg-emerald-50 text-emerald-700",
          },
          {
            label: "Mapato Yanayosubiri",
            value: `TSh ${potentialRevenue.toLocaleString()}`,
            icon: "⏳",
            color: "bg-orange-50 text-orange-700",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">{card.label}</p>
                <p className="text-xl font-bold mt-1">{card.value}</p>
              </div>
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}
              >
                <span className="text-lg">{card.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Daily Chart */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h3 className="font-bold text-lg mb-4">📅 Siku 7 Zilizopita</h3>
        <div className="flex items-end gap-2 h-40">
          {dailyStats.map((day) => (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-medium text-slate-600">
                {day.generated}
              </span>
              <div
                className="w-full bg-emerald-400 rounded-t-lg transition-all"
                style={{
                  height: `${(day.generated / maxGenerated) * 100}%`,
                  minHeight: day.generated > 0 ? "8px" : "2px",
                }}
              />
              <span className="text-[10px] text-slate-400">
                {new Date(day.date).toLocaleDateString("sw-TZ", {
                  weekday: "short",
                })}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-emerald-400 rounded" /> Vocha zilizozalishwa
          </span>
        </div>
      </div>

      {/* Profile Stats */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 pb-3">
          <h3 className="font-bold text-lg">🎫 Utendaji kwa Aina ya Vocha</h3>
        </div>
        {Object.keys(profileStats).length === 0 ? (
          <div className="px-6 pb-6 text-slate-400 text-sm">
            Hakuna data bado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="text-left px-6 py-3 font-medium">Aina</th>
                  <th className="text-left px-6 py-3 font-medium">Muda</th>
                  <th className="text-left px-6 py-3 font-medium">Bei</th>
                  <th className="text-left px-6 py-3 font-medium">
                    Zimezalishwa
                  </th>
                  <th className="text-left px-6 py-3 font-medium">
                    Zimetumika
                  </th>
                  <th className="text-left px-6 py-3 font-medium">Mapato</th>
                  <th className="text-left px-6 py-3 font-medium">Asilimia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.values(profileStats).map((p) => (
                  <tr key={p.name} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-medium">{p.name}</td>
                    <td className="px-6 py-3">{p.duration}</td>
                    <td className="px-6 py-3">
                      TSh {p.price.toLocaleString()}
                    </td>
                    <td className="px-6 py-3">{p.generated}</td>
                    <td className="px-6 py-3">{p.used}</td>
                    <td className="px-6 py-3 font-medium text-emerald-600">
                      TSh {p.revenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{
                              width: `${p.generated > 0 ? (p.used / p.generated) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs">
                          {p.generated > 0
                            ? Math.round((p.used / p.generated) * 100)
                            : 0}
                          %
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Usage tip */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
        <h4 className="font-semibold text-blue-800 mb-2">
          💡 Kidokezo
        </h4>
        <p className="text-sm text-blue-700">
          Vocha zinapozalishwa, zinatumwa moja kwa moja kwenye router yako ya
          MikroTik kupitia API. Mtumiaji anapotumia vocha, hali yake inabadilika
          kuwa &quot;Imetumika&quot; na mapato yanarekodiwa kwenye mfumo.
        </p>
      </div>
    </div>
  );
}
