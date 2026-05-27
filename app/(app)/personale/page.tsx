"use client";

import { useEffect, useState } from "react";

interface Persona {
  id: number;
  cognome: string;
  nome: string;
  id_utente: string;
  matricola: string;
  sede: string;
  unita_organizzativa: string;
  competence_center: string;
  assegnato: number;
}

interface Movimento {
  id: number;
  quantita: number;
  data_assegnazione: string;
  data_restituzione: string | null;
  stato: string;
  note: string | null;
  dpi_codice: string;
  dpi_descrizione: string;
}

const emptyForm = {
  cognome: "",
  nome: "",
  id_utente: "",
  matricola: "",
  sede: "",
  unita_organizzativa: "",
  competence_center: "",
};

export default function PersonalePage() {
  const [items, setItems] = useState<Persona[]>([]);
  const [search, setSearch] = useState("");
  const [assegnatoFilter, setAssegnatoFilter] = useState("tutti");
  const [editing, setEditing] = useState<Persona | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);

  // Drill-down
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [movimenti, setMovimenti] = useState<Movimento[]>([]);
  const [loadingMov, setLoadingMov] = useState(false);

  useEffect(() => {
    fetch("/api/personale")
      .then((r) => r.json())
      .then(setItems);
  }, []);

  const filtered = items
    .filter(
      (p) =>
        p.cognome.toLowerCase().includes(search.toLowerCase()) ||
        p.nome.toLowerCase().includes(search.toLowerCase()) ||
        p.id_utente?.toLowerCase().includes(search.toLowerCase()) ||
        p.matricola?.toLowerCase().includes(search.toLowerCase())
    )
    .filter((p) => {
      if (assegnatoFilter === "assegnato") return p.assegnato > 0;
      if (assegnatoFilter === "non_assegnato") return p.assegnato === 0;
      return true;
    });

  function openEdit(p: Persona) {
    setEditing(p);
    setCreating(false);
    setForm({
      cognome: p.cognome,
      nome: p.nome,
      id_utente: p.id_utente || "",
      matricola: p.matricola || "",
      sede: p.sede || "",
      unita_organizzativa: p.unita_organizzativa || "",
      competence_center: p.competence_center || "",
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

  function toggleDetail(p: Persona) {
    if (selectedPersona?.id === p.id) {
      setSelectedPersona(null);
      setMovimenti([]);
    } else {
      setSelectedPersona(p);
      setLoadingMov(true);
      fetch(`/api/assegnazioni?personale_id=${p.id}`)
        .then((r) => r.json())
        .then((data) => {
          setMovimenti(data);
          setLoadingMov(false);
        });
    }
  }

  async function saveEdit() {
    if (!editing) return;
    const res = await fetch(`/api/personale/${editing.id}`, {
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
    const res = await fetch("/api/personale", {
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
        <h1 className="text-2xl font-bold text-slate-800">Personale</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-800 text-white hover:bg-slate-700"
        >
          + Nuova Persona
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          className="w-full max-w-md px-4 py-2 border border-slate-300 rounded-lg text-sm"
          placeholder="Cerca per nome, cognome, ID, matricola..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-1">
          {(["tutti", "assegnato", "non_assegnato"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setAssegnatoFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                assegnatoFilter === f
                  ? "bg-slate-800 text-white"
                  : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {f === "tutti" ? "Tutti" : f === "assegnato" ? "Assegnati" : "Non assegnati"}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Cognome</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">ID Utente</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Matricola</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Sede</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">U.O.</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">CC</th>
                <th className="px-4 py-3 text-right font-medium text-slate-500">Assegnato</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <>
                  <tr
                    key={p.id}
                    className={`hover:bg-slate-50 ${
                      selectedPersona?.id === p.id ? "bg-blue-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-medium">{p.cognome}</td>
                    <td className="px-4 py-3">{p.nome}</td>
                    <td className="px-4 py-3 font-mono text-xs">{p.id_utente}</td>
                    <td className="px-4 py-3 font-mono text-xs">{p.matricola}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{p.sede}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{p.unita_organizzativa}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{p.competence_center}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={p.assegnato > 0 ? "text-amber-600 font-medium" : "text-slate-300"}>
                        {p.assegnato}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => toggleDetail(p)}
                          className={`text-xs px-2 py-1 rounded font-medium ${
                            selectedPersona?.id === p.id
                              ? "bg-blue-200 text-blue-700"
                              : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                          }`}
                        >
                          Dettaglio
                        </button>
                        <button
                          onClick={() => openEdit(p)}
                          className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 font-medium"
                        >
                          Modifica
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* Inline detail row */}
                  {selectedPersona?.id === p.id && (
                    <tr key={`detail-${p.id}`}>
                      <td colSpan={9} className="p-0 bg-slate-50">
                        <div className="px-4 py-3 border-t">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-semibold text-slate-700">
                              Movimenti: {p.cognome} {p.nome}
                            </h3>
                            <button
                              onClick={() => { setSelectedPersona(null); setMovimenti([]); }}
                              className="text-[10px] px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 font-medium"
                            >
                              Chiudi
                            </button>
                          </div>
                          {loadingMov ? (
                            <p className="text-xs text-slate-400 py-2">Caricamento...</p>
                          ) : movimenti.length === 0 ? (
                            <p className="text-xs text-slate-400 py-2">Nessun movimento per questa persona.</p>
                          ) : (
                            <table className="w-full text-[11px]">
                              <thead>
                                <tr className="border-b text-slate-400">
                                  <th className="px-2 py-1.5 text-left">Codice DPI</th>
                                  <th className="px-2 py-1.5 text-left">Descrizione</th>
                                  <th className="px-2 py-1.5 text-right">Q.tà</th>
                                  <th className="px-2 py-1.5 text-left">Assegn.</th>
                                  <th className="px-2 py-1.5 text-left">Restit.</th>
                                  <th className="px-2 py-1.5 text-left">Stato</th>
                                  <th className="px-2 py-1.5 text-left">Note</th>
                                  <th className="px-2 py-1.5"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {movimenti.map((m) => (
                                  <tr key={m.id} className="border-t border-slate-100">
                                    <td className="px-2 py-1.5 font-mono">{m.dpi_codice}</td>
                                    <td className="px-2 py-1.5 max-w-[200px] truncate">{m.dpi_descrizione}</td>
                                    <td className="px-2 py-1.5 text-right">{m.quantita}</td>
                                    <td className="px-2 py-1.5">{m.data_assegnazione}</td>
                                    <td className="px-2 py-1.5">{m.data_restituzione || "-"}</td>
                                    <td className="px-2 py-1.5">
                                      <span
                                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                                          m.stato === "assegnato"
                                            ? "bg-amber-100 text-amber-700"
                                            : "bg-green-100 text-green-700"
                                        }`}
                                      >
                                        {m.stato}
                                      </span>
                                    </td>
                                    <td className="px-2 py-1.5 max-w-[120px] truncate text-slate-400">
                                      {m.note || "-"}
                                    </td>
                                    <td className="px-2 py-1.5">
                                      <button
                                        onClick={() => eliminaMovimento(m.id)}
                                        className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-600 hover:bg-red-200 font-medium"
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
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="p-6 text-center text-slate-400">Nessuna persona trovata.</p>
        )}
      </div>

      {/* Modal: create or edit */}
      {(editing || creating) && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">
              {editing ? `Modifica: ${editing.cognome} ${editing.nome}` : "Nuova Persona"}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-sm text-slate-600">Cognome</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  value={form.cognome}
                  onChange={(e) => setForm({ ...form, cognome: e.target.value })}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm text-slate-600">Nome</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm text-slate-600">ID Utente</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  value={form.id_utente}
                  onChange={(e) => setForm({ ...form, id_utente: e.target.value })}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm text-slate-600">Matricola</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  value={form.matricola}
                  onChange={(e) => setForm({ ...form, matricola: e.target.value })}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm text-slate-600">Sede</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  value={form.sede}
                  onChange={(e) => setForm({ ...form, sede: e.target.value })}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm text-slate-600">U.O.</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  value={form.unita_organizzativa}
                  onChange={(e) => setForm({ ...form, unita_organizzativa: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="block mb-1 text-sm text-slate-600">Competence Center</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  value={form.competence_center}
                  onChange={(e) => setForm({ ...form, competence_center: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
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
