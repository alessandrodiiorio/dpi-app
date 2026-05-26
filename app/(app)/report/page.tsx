"use client";

import { useEffect, useState } from "react";

interface ReportData {
  summary: {
    totDpi: number;
    totPersonale: number;
    totAssegnazioni: number;
    attivi: number;
    restituiti: number;
    stockOk: number;
    stockZero: number;
    stockNoData: number;
  };
  topDpi: {
    codice: string;
    descrizione: string;
    quantita_assegnata: number;
    disponibile: number;
    totale: number;
  }[];
  topPersonale: {
    cognome: string;
    nome: string;
    totale_assegnazioni: number;
    attive: number;
  }[];
  months: {
    label: string;
    assegnati: number;
    restituiti: number;
  }[];
}

export default function ReportPage() {
  const [data, setData] = useState<ReportData | null>(null);

  useEffect(() => {
    fetch("/api/report")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return <p className="text-slate-400">Caricamento report...</p>;

  const maxMonthVal = Math.max(
    ...data.months.map((m) => Math.max(m.assegnati, m.restituiti)),
    1
  );

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-800">Reportistica</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card label="DPI Catalogo" value={data.summary.totDpi} color="bg-blue-500" />
        <Card label="Personale" value={data.summary.totPersonale} color="bg-indigo-500" />
        <Card label="Totale Assegn." value={data.summary.totAssegnazioni} color="bg-amber-500" />
        <Card label="Attivi" value={data.summary.attivi} color="bg-emerald-500" />
        <Card label="Restituiti" value={data.summary.restituiti} color="bg-teal-500" />
        <Card label="Stock > 0" value={data.summary.stockOk} color="bg-green-600" />
      </div>

      {/* Stock status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Stock disponibile</p>
          <p className="text-2xl font-bold text-green-600">{data.summary.stockOk}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Stock esaurito</p>
          <p className="text-2xl font-bold text-red-500">{data.summary.stockZero}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Stock non impostato</p>
          <p className="text-2xl font-bold text-slate-400">{data.summary.stockNoData}</p>
        </div>
      </div>

      {/* Monthly bar chart */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Andamento Mensile
        </h2>
        <div className="flex items-end gap-1 h-48">
          {data.months.map((m) => (
            <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col justify-end gap-0.5" style={{ height: 160 }}>
                <div
                  className="w-full bg-amber-400 rounded-t"
                  style={{ height: `${(m.assegnati / maxMonthVal) * 80}px` }}
                  title={`Assegnati: ${m.assegnati}`}
                />
                <div
                  className="w-full bg-emerald-500 rounded-t"
                  style={{ height: `${(m.restituiti / maxMonthVal) * 80}px` }}
                  title={`Restituiti: ${m.restituiti}`}
                />
              </div>
              <span className="text-[10px] text-slate-400 rotate-45 origin-left translate-x-2 whitespace-nowrap">
                {m.label}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-8 justify-center text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-amber-400 rounded" /> Assegnati
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-emerald-500 rounded" /> Restituiti
          </span>
        </div>
      </div>

      {/* Top DPI + Top Personale */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top DPI */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b bg-slate-50">
            <h2 className="text-sm font-semibold text-slate-700">DPI Più Assegnati</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-slate-400">
                  <th className="px-3 py-2 text-left">Codice</th>
                  <th className="px-3 py-2 text-left">Descrizione</th>
                  <th className="px-3 py-2 text-right">Assegnati</th>
                  <th className="px-3 py-2 text-right">Disp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.topDpi.map((d, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-mono">{d.codice}</td>
                    <td className="px-3 py-2 max-w-[200px] truncate">{d.descrizione}</td>
                    <td className="px-3 py-2 text-right font-medium">{d.quantita_assegnata}</td>
                    <td className="px-3 py-2 text-right">
                      <span className={d.disponibile <= 0 && d.totale > 0 ? "text-red-500" : ""}>
                        {d.disponibile}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Personale */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b bg-slate-50">
            <h2 className="text-sm font-semibold text-slate-700">Personale con Più Assegnazioni</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-slate-400">
                  <th className="px-3 py-2 text-left">Cognome Nome</th>
                  <th className="px-3 py-2 text-right">Totale</th>
                  <th className="px-3 py-2 text-right">Attive</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.topPersonale.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium">
                      {p.cognome} {p.nome}
                    </td>
                    <td className="px-3 py-2 text-right">{p.totale_assegnazioni}</td>
                    <td className="px-3 py-2 text-right">
                      <span className={p.attive > 0 ? "text-amber-600 font-medium" : ""}>
                        {p.attive}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center mb-2`}>
        <span className="text-white font-bold text-sm">{value}</span>
      </div>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
