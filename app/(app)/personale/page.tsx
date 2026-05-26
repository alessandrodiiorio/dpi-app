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
  const [editing, setEditing] = useState<Persona | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetch("/api/personale")
      .then((r) => r.json())
      .then(setItems);
  }, []);

  const filtered = items.filter(
    (p) =>
      p.cognome.toLowerCase().includes(search.toLowerCase()) ||
      p.nome.toLowerCase().includes(search.toLowerCase()) ||
      p.id_utente?.toLowerCase().includes(search.toLowerCase()) ||
      p.matricola?.toLowerCase().includes(search.toLowerCase())
  );

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
      <input
        className="w-full max-w-md mb-4 px-4 py-2 border border-slate-300 rounded-lg text-sm"
        placeholder="Cerca per nome, cognome, ID, matricola..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
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
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{p.cognome}</td>
                  <td className="px-4 py-3">{p.nome}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.id_utente}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.matricola}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{p.sede}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{p.unita_organizzativa}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{p.competence_center}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(p)}
                      className="text-xs px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 font-medium"
                    >
                      Modifica
                    </button>
                  </td>
                </tr>
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
