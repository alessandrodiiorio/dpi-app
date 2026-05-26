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

export default function PersonalePage() {
  const [items, setItems] = useState<Persona[]>([]);
  const [search, setSearch] = useState("");

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

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Personale</h1>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="p-6 text-center text-slate-400">Nessuna persona trovata.</p>
        )}
      </div>
    </div>
  );
}
