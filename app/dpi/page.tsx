"use client";

import { useEffect, useState } from "react";

interface DpiItem {
  id: number;
  codice_articolo: string;
  descrizione_articolo: string;
  quantita_totale: number;
  quantita_disponibile: number;
}

export default function DpiPage() {
  const [items, setItems] = useState<DpiItem[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<DpiItem | null>(null);
  const [form, setForm] = useState({ quantita_totale: 0, quantita_disponibile: 0 });

  useEffect(() => {
    fetch("/api/dpi")
      .then((r) => r.json())
      .then(setItems);
  }, []);

  const filtered = items.filter(
    (i) =>
      i.codice_articolo.toLowerCase().includes(search.toLowerCase()) ||
      i.descrizione_articolo.toLowerCase().includes(search.toLowerCase())
  );

  function openEdit(item: DpiItem) {
    setEditing(item);
    setForm({ quantita_totale: item.quantita_totale, quantita_disponibile: item.quantita_disponibile });
  }

  async function saveEdit() {
    if (!editing) return;
    const res = await fetch(`/api/dpi/${editing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const updated = await res.json();
      setItems((prev) => prev.map((i) => (i.id === editing.id ? updated : i)));
      setEditing(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Catalogo DPI</h1>
      <input
        className="w-full max-w-md mb-4 px-4 py-2 border border-slate-300 rounded-lg text-sm"
        placeholder="Cerca per codice o descrizione..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Codice</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Descrizione</th>
                <th className="px-4 py-3 text-right font-medium text-slate-500">Q.tà Tot.</th>
                <th className="px-4 py-3 text-right font-medium text-slate-500">Q.tà Disp.</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">{item.codice_articolo}</td>
                  <td className="px-4 py-3">{item.descrizione_articolo}</td>
                  <td className="px-4 py-3 text-right">{item.quantita_totale}</td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={
                        item.quantita_disponibile < 5 ? "text-red-600 font-semibold" : ""
                      }
                    >
                      {item.quantita_disponibile}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(item)}
                      className="text-xs px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 font-medium"
                    >
                      Modifica q.tà
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="p-6 text-center text-slate-400">Nessun DPI trovato.</p>
        )}
      </div>

      {/* Modal edit */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">
              Modifica q.tà: {editing.codice_articolo}
            </h3>
            <label className="block mb-2 text-sm text-slate-600">Quantità Totale</label>
            <input
              type="number"
              className="w-full px-3 py-2 border rounded-lg mb-3"
              value={form.quantita_totale}
              onChange={(e) => setForm({ ...form, quantita_totale: parseInt(e.target.value) || 0 })}
            />
            <label className="block mb-2 text-sm text-slate-600">Quantità Disponibile</label>
            <input
              type="number"
              className="w-full px-3 py-2 border rounded-lg mb-4"
              value={form.quantita_disponibile}
              onChange={(e) =>
                setForm({ ...form, quantita_disponibile: parseInt(e.target.value) || 0 })
              }
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-lg text-sm border border-slate-300"
              >
                Annulla
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 rounded-lg text-sm bg-slate-800 text-white"
              >
                Salva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
