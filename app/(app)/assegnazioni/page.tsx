"use client";

import { useEffect, useState } from "react";

interface Assegnazione {
  id: number;
  dpi_id: number;
  personale_id: number;
  quantita: number;
  data_assegnazione: string;
  data_restituzione: string | null;
  note: string | null;
  stato: string;
  dpi_codice: string;
  dpi_descrizione: string;
  personale_cognome: string;
  personale_nome: string;
}

export default function AssegnazioniPage() {
  const [items, setItems] = useState<Assegnazione[]>([]);
  const [filter, setFilter] = useState("tutti");

  useEffect(() => {
    const params = filter !== "tutti" ? `?stato=${filter}` : "";
    fetch(`/api/assegnazioni${params}`)
      .then((r) => r.json())
      .then(setItems);
  }, [filter]);

  async function restituisci(id: number) {
    const res = await fetch(`/api/assegnazioni/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "restituisci" }),
    });
    if (res.ok) {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, stato: "restituito" } : i))
      );
    } else {
      const err = await res.json();
      alert(err.error || "Errore");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Assegnazioni</h1>
      <div className="flex gap-2 mb-4">
        {["tutti", "assegnato", "restituito"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === s
                ? "bg-slate-800 text-white"
                : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-100"
            }`}
          >
            {s === "tutti" ? "Tutti" : s === "assegnato" ? "Assegnati" : "Restituiti"}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-500">DPI</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Persona</th>
                <th className="px-4 py-3 text-right font-medium text-slate-500">Q.tà</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Assegnazione</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Restituzione</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Stato</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs">{a.dpi_codice}</div>
                    <div className="text-xs text-slate-400 max-w-[200px] truncate">
                      {a.dpi_descrizione}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {a.personale_cognome} {a.personale_nome}
                  </td>
                  <td className="px-4 py-3 text-right">{a.quantita}</td>
                  <td className="px-4 py-3 text-xs">{a.data_assegnazione}</td>
                  <td className="px-4 py-3 text-xs">
                    {a.data_restituzione || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        a.stato === "assegnato"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {a.stato}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {a.stato === "assegnato" && (
                      <button
                        onClick={() => restituisci(a.id)}
                        className="text-xs px-3 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 font-medium"
                      >
                        Restituisci
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {items.length === 0 && (
          <p className="p-6 text-center text-slate-400">Nessuna assegnazione.</p>
        )}
      </div>
    </div>
  );
}
