"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface HotspotItem {
  id: number;
  businessName: string;
  portalSlug: string | null;
  dashboardUsername: string | null;
  location: string | null;
  routerIp: string;
  status: string;
}

export default function WifiDirectoryPage() {
  const router = useRouter();
  const [hotspots, setHotspots] = useState<HotspotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [customSlug, setCustomSlug] = useState("");

  useEffect(() => {
    // Fetch active hotspots from public endpoint
    fetch("/api/portal/hotspots")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setHotspots(data);
        } else {
          // Fallback to mine if vendor logged in
          fetch("/api/clients/mine")
            .then((r) => (r.ok ? r.json() : []))
            .then((mine) => {
              if (Array.isArray(mine)) {
                setHotspots(mine);
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleDirectGo(e: React.FormEvent) {
    e.preventDefault();
    const clean = customSlug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    if (clean) {
      router.push(`/wifi/${clean}`);
    }
  }

  const filtered = hotspots.filter((h) => {
    const q = search.toLowerCase();
    const name = (h.businessName || "").toLowerCase();
    const slug = (h.portalSlug || h.dashboardUsername || "").toLowerCase();
    const loc = (h.location || "").toLowerCase();
    return name.includes(q) || slug.includes(q) || loc.includes(q);
  });

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-brand-600 to-emerald-400 flex items-center justify-center font-black text-white shadow-md">
              S
            </div>
            <span className="font-extrabold text-lg tracking-tight">
              Said<span className="text-emerald-400">Zen</span>{" "}
              <span className="text-brand-400 font-light">WiFi</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-xs px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
            >
              🏠 Mwanzo
            </Link>
            <Link
              href="/login"
              className="text-xs px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all shadow-md"
            >
              🔑 Ingia
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-10 space-y-8">
        {/* Title */}
        <div className="text-center space-y-2.5">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-linear-to-tr from-emerald-500 to-brand-500 flex items-center justify-center text-3xl shadow-xl shadow-emerald-500/20 mb-3">
            📶
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Portal ya WiFi ya Wateja
          </h1>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            Chagua au weka jina la Hotspot uliyopo ili kuingiza vocha yako au kununua kifurushi kipya kwa M-Pesa.
          </p>
        </div>

        {/* Direct Go Form */}
        <form
          onSubmit={handleDirectGo}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3"
        >
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
            Fungua Hotspot Yoyote Moja kwa Moja
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <span className="absolute left-4 top-3 text-slate-500 font-mono text-sm">
                /wifi/
              </span>
              <input
                type="text"
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value)}
                placeholder="mfano: juma_wifi au sinza_cafe"
                className="w-full pl-16 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-white font-mono text-sm outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={!customSlug.trim()}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-2xl disabled:opacity-40 transition-all shadow-lg shadow-emerald-500/20"
            >
              Fungua Portal →
            </button>
          </div>
        </form>

        {/* Directory List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <span>📡</span> Hotspot Zilizopo Kwenye Mfumo
            </h2>
            {hotspots.length > 3 && (
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tafuta hotspot..."
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-brand-500 w-40"
              />
            )}
          </div>

          {loading ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400">Inatafuta hotspot zilizopo...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center space-y-3">
              <p className="text-4xl">🔍</p>
              <h3 className="font-bold text-white text-base">Hakuna hotspot iliyoonekana</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Unaweza kuandika jina la hotspot moja kwa moja kwenye kisanduku hapo juu, au unganisha router mpya.
              </p>
              <Link
                href="/connect"
                className="inline-block px-5 py-2.5 bg-emerald-500 text-slate-950 rounded-xl font-bold text-xs shadow-md"
              >
                ⚡ Unganisha Router Mpya
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filtered.map((h) => {
                const slug = h.portalSlug || h.dashboardUsername || String(h.id);
                return (
                  <Link
                    key={h.id}
                    href={`/wifi/${slug}`}
                    className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/80 rounded-2xl p-4 transition-all hover:scale-[1.01] hover:shadow-lg hover:shadow-emerald-500/5 group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors">
                          {h.businessName}
                        </span>
                        <span
                          className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${
                            h.status === "active"
                              ? "bg-emerald-400 animate-pulse"
                              : "bg-amber-400"
                          }`}
                        />
                      </div>
                      {h.location && (
                        <p className="text-xs text-slate-400 mb-2">
                          📍 {h.location}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="font-mono text-[11px] text-slate-500">
                        /wifi/{slug}
                      </span>
                      <span className="text-emerald-400 font-bold group-hover:translate-x-0.5 transition-transform">
                        Ingia Portal →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        <p>SaidZen WiFi • Mfumo wa Vocha za MikroTik</p>
        <p className="mt-1">
          Msaada:{" "}
          <a href="tel:0777378300" className="text-emerald-400 font-bold">
            0777 378 300
          </a>
        </p>
      </footer>
    </div>
  );
}
