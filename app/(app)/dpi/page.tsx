"use client";

import { useEffect, useState } from "react";

interface DpiItem {
  id: number;
  codice_articolo: string;
  descrizione_articolo: string;
  quantita_totale: number;
  quantita_disponibile: number;
  assegnato: number;
}

interface Movimento {
  id: number;
  quantita: number;
  data_assegnazione: string;
  data_restituzione: string | null;
  stato: string;
  note: string | null;
  personale_cognome: string;
  personale_nome: string;
}

const emptyForm = { codice_articolo: "", descrizione_articolo: "", quantita_totale: 0, quantita_disponibile: 0 };

export default function DpiPage() {
  const [items, setItems] = useState<DpiItem[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<DpiItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);

  // Drill-down
  const [selectedDpi, setSelectedDpi] = useState<DpiItem | null>(null);
  const [movimenti, setMovimenti] = useState<Movimento[]>([]);
  const [loadingMov, setLoadingMov] = useState(false);

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
    setCreating(false);
    setForm({
      codice_articolo: item.codice_articolo,
      descrizione_articolo: item.descrizione_articolo,
      quantita_totale: item.quantita_totale,
      quantita_disponibile: item.quantita_disponibile,
    });
  }

  function openCreate() {
    setEditing(null);
    setCreating(true);
    setForm(emptyForm);
  }

  function closeModal() {
    setEditing(null);
    setCreating(false);
  }

  async function eliminaMovimento(id: number) {
    if (!confirm("Eliminare questa assegnazione?")) return;
    const res = await fetch(`/api/assegnazioni/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMovimenti((prev) => prev.filter((m) => m.id !== id));
    }
  }

  function toggleDetail(item: DpiItem) {
    if (selectedDpi?.id === item.id) {
      setSelectedDpi(null);
      setMovimenti([]);
    } else {
      setSelectedDpi(item);
      setLoadingMov(true);
      fetch(`/api/assegnazioni?dpi_id=${item.id}`)
        .then((r) => r.json())
        .then((data) => {
          setMovimenti(data);
          setLoadingMov(false);
        });
    }
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
      closeModal();
    }
  }

  async function saveCreate() {
    const res = await fetch("/api/dpi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const created = await res.json();
      setItems((prev) => [...prev, created]);
      closeModal();
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Catalogo DPI</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-800 text-white hover:bg-slate-700"
        >
          + Nuovo DPI
        </button>
      </div>
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
                <th className="px-4 py-3 text-right font-medium text-slate-500">Assegnato</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  className={`hover:bg-slate-50 ${
                    selectedDpi?.id === item.id ? "bg-blue-50" : ""
                  }`}
                >
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
                    <span className={item.assegnato > 0 ? "text-amber-600 font-medium" : "text-slate-300"}>
                      {item.assegnato}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => toggleDetail(item)}
                        className={`text-xs px-2 py-1 rounded font-medium ${
                          selectedDpi?.id === item.id
                            ? "bg-blue-200 text-blue-700"
                            : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                        }`}
                      >
                        Dettaglio
                      </button>
                      <button
                        onClick={() => openEdit(item)}
                        className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 font-medium"
                      >
                        Modifica
                      </button>
                    </div>
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

      {/* Drill-down movimenti */}
      {selectedDpi && (
        <div className="mt-4 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b bg-slate-50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">
              Movimenti: {selectedDpi.codice_articolo} - {selectedDpi.descrizione_articolo}
            </h2>
            <button
              onClick={() => { setSelectedDpi(null); setMovimenti([]); }}
              className="text-xs px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 font-medium"
            >
              Chiudi
            </button>
          </div>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            {loadingMov ? (
              <p className="p-6 text-center text-slate-400">Caricamento...</p>
            ) : movimenti.length === 0 ? (
              <p className="p-6 text-center text-slate-400">Nessun movimento per questo DPI.</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-slate-400 sticky top-0 bg-white">
                    <th className="px-3 py-2 text-left">Persona</th>
                    <th className="px-3 py-2 text-right">Q.tà</th>
                    <th className="px-3 py-2 text-left">Data Assegn.</th>
                    <th className="px-3 py-2 text-left">Data Restit.</th>
                    <th className="px-3 py-2 text-left">Stato</th>
                    <th className="px-3 py-2 text-left">Note</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {movimenti.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-medium">
                        {m.personale_cognome} {m.personale_nome}
                      </td>
                      <td className="px-3 py-2 text-right">{m.quantita}</td>
                      <td className="px-3 py-2">{m.data_assegnazione}</td>
                      <td className="px-3 py-2">{m.data_restituzione || "-"}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            m.stato === "assegnato"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {m.stato}
                        </span>
                      </td>
                      <td className="px-3 py-2 max-w-[150px] truncate text-slate-400">
                        {m.note || "-"}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => eliminaMovimento(m.id)}
                          className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-600 hover:bg-red-200 font-medium"
                          title="Elimina"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Modal: create or edit */}
      {(editing || creating) && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">
              {editing ? `Modifica: ${editing.codice_articolo}` : "Nuovo DPI"}
            </h3>
            <label className="block mb-1 text-sm text-slate-600">Codice Articolo</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg mb-3 text-sm"
              value={form.codice_articolo}
              onChange={(e) => setForm({ ...form, codice_articolo: e.target.value })}
            />
            <label className="block mb-1 text-sm text-slate-600">Descrizione</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg mb-3 text-sm"
              value={form.descrizione_articolo}
              onChange={(e) => setForm({ ...form, descrizione_articolo: e.target.value })}
            />
            <label className="block mb-1 text-sm text-slate-600">Quantità Totale</label>
            <input
              type="number"
              className="w-full px-3 py-2 border rounded-lg mb-3 text-sm"
              value={form.quantita_totale}
              onChange={(e) => setForm({ ...form, quantita_totale: parseInt(e.target.value) || 0 })}
            />
            <label className="block mb-1 text-sm text-slate-600">Quantità Disponibile</label>
            <input
              type="number"
              className="w-full px-3 py-2 border rounded-lg mb-4 text-sm"
              value={form.quantita_disponibile}
              onChange={(e) => setForm({ ...form, quantita_disponibile: parseInt(e.target.value) || 0 })}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg text-sm border border-slate-300"
              >
                Annulla
              </button>
              <button
                onClick={editing ? saveEdit : saveCreate}
                className="px-4 py-2 rounded-lg text-sm bg-slate-800 text-white hover:bg-slate-700"
              >
                {editing ? "Salva" : "Crea"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
