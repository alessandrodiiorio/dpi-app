"use client";

import { useEffect, useState } from "react";

interface Stats {
  totDpi: number;
  totPersonale: number;
  totAssegnazioni: number;
  daDemolire: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    async function load() {
      const [dpiRes, persRes, assRes] = await Promise.all([
        fetch("/api/dpi"),
        fetch("/api/personale"),
        fetch("/api/assegnazioni?stato=assegnato"),
      ]);
      const dpiData = await dpiRes.json();
      const persData = await persRes.json();
      const assData = await assRes.json();

      setStats({
        totDpi: dpiData.length,
        totPersonale: persData.length,
        totAssegnazioni: assData.length,
        daDemolire: assData.filter((a: { stato: string }) => a.stato === "assegnato")
          .length,
      });
    }
    load();
  }, []);

  if (!stats) return <p>Caricamento...</p>;

  const cards = [
    { label: "DPI in catalogo", value: stats.totDpi, color: "bg-blue-500" },
    { label: "Personale", value: stats.totPersonale, color: "bg-green-500" },
    { label: "Assegnazioni attive", value: stats.totAssegnazioni, color: "bg-amber-500" },
    { label: "Da demolire", value: stats.daDemolire, color: "bg-red-500" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className={`w-10 h-10 rounded-lg ${c.color} flex items-center justify-center mb-3`}>
              <span className="text-white font-bold text-lg">{c.value}</span>
            </div>
            <p className="text-sm text-slate-500">{c.label}</p>
            <p className="text-2xl font-bold text-slate-800">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
