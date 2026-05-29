"use client";

import { useEffect, useState, useMemo, useRef } from "react";

interface Persona {
  id: number;
  cognome: string;
  nome: string;
  id_utente: string;
}

interface Assegnazione {
  id: number;
  dpi_id: number;
  quantita: number;
  data_assegnazione: string;
  note: string | null;
  stato: string;
  dpi_codice: string;
  dpi_descrizione: string;
  personale_cognome: string;
  personale_nome: string;
}

export default function DemolizionePage() {
  const [persList, setPersList] = useState<Persona[]>([]);
  const [persSearch, setPersSearch] = useState("");
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [showPersSuggestions, setShowPersSuggestions] = useState(false);
  const [assegnazioni, setAssegnazioni] = useState<Assegnazione[]>([]);
  const [loading, setLoading] = useState(false);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [demolishQtys, setDemolishQtys] = useState<Record<number, number>>({});

  // Demolizione modal
  const [demolizioneId, setDemolizioneId] = useState<number | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [dataDemolizione, setDataDemolizione] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [noteDemolizione, setNoteDemolizione] = useState("");

  const persRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/personale").then((r) => r.json()).then(setPersList);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (persRef.current && !persRef.current.contains(e.target as Node)) {
        setShowPersSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const persSuggestions = useMemo(() => {
    const q = persSearch.toLowerCase();
    return persList
      .filter(
        (p) =>
          p.cognome.toLowerCase().includes(q) ||
          p.nome.toLowerCase().includes(q) ||
          p.id_utente.toLowerCase().includes(q)
      )
      .slice(0, 15);
  }, [persSearch, persList]);

  function selectPersona(p: Persona) {
    setSelectedPersona(p);
    setPersSearch(`${p.cognome} ${p.nome}`);
    setShowPersSuggestions(false);
    setSelectedIds([]);
    setDemolishQtys({});
    loadAssegnazioni(p.id);
  }

  async function loadAssegnazioni(personaleId: number) {
    setLoading(true);
    const res = await fetch(
      `/api/assegnazioni?personale_id=${personaleId}&stato=assegnato`
    );
    if (res.ok) setAssegnazioni(await res.json());
    setLoading(false);
  }

  function toggleSelect(id: number, qty: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    if (!selectedIds.includes(id)) {
      setDemolishQtys((prev) => ({ ...prev, [id]: qty }));
    } else {
      setDemolishQtys((prev) => { const n = { ...prev }; delete n[id]; return n; });
    }
  }

  function selectAll() {
    const all = assegnazioni.map((a) => a.id);
    setSelectedIds(all);
    const qtys: Record<number, number> = {};
    for (const a of assegnazioni) qtys[a.id] = a.quantita;
    setDemolishQtys(qtys);
  }

  function deselectAll() {
    setSelectedIds([]);
    setDemolishQtys({});
  }

  function openBulk() {
    setBulkMode(true);
    setDemolizioneId(null);
    setDataDemolizione(new Date().toISOString().split("T")[0]);
    setNoteDemolizione("");
  }

  async function demolisci(id: number) {
    const res = await fetch(`/api/assegnazioni/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "restituisci", data_restituzione: dataDemolizione }),
    });
    if (res.ok) {
      setDemolizioneId(null);
      if (selectedPersona) loadAssegnazioni(selectedPersona.id);
    }
  }

  async function demolisciBulk() {
    for (const id of selectedIds) {
      const res = await fetch(`/api/assegnazioni/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restituisci", data_restituzione: dataDemolizione }),
      });
      if (!res.ok) {
        alert(`Errore durante demolizione ID ${id}`);
        return;
      }
    }
    setBulkMode(false);
    setSelectedIds([]);
    setDemolishQtys({});
    if (selectedPersona) loadAssegnazioni(selectedPersona.id);
  }

  const selectedTotal = selectedIds.reduce((sum, id) => sum + (demolishQtys[id] || 0), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Demolizione DPI</h1>

      {/* Persona autocomplete */}
      <div ref={persRef} className="relative max-w-xl mb-6">
        <label className="block text-sm font-medium text-slate-600 mb-1">Persona</label>
        {selectedPersona ? (
          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-medium">
              {selectedPersona.cognome} {selectedPersona.nome}
            </span>
            <span className="text-xs text-slate-400">ID: {selectedPersona.id_utente}</span>
            <button
              type="button"
              onClick={() => {
                setSelectedPersona(null);
                setPersSearch("");
                setAssegnazioni([]);
                setSelectedIds([]);
                setDemolishQtys({});
              }}
              className="text-xs text-red-500 hover:underline ml-auto"
            >
              Cambia
            </button>
          </div>
        ) : (
          <>
            <input
              type="text"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm"
              placeholder="Cerca per nome, cognome o ID..."
              value={persSearch}
              onChange={(e) => {
                setPersSearch(e.target.value);
                setShowPersSuggestions(true);
              }}
              onFocus={() => setShowPersSuggestions(true)}
            />
            {showPersSuggestions && persSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                {persSuggestions.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex justify-between"
                    onClick={() => selectPersona(p)}
                  >
                    <span className="font-medium">{p.cognome} {p.nome}</span>
                    <span className="text-xs text-slate-400">ID: {p.id_utente}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Assignments table */}
      {selectedPersona && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden max-w-5xl">
          {loading ? (
            <p className="p-6 text-center text-slate-400">Caricamento...</p>
          ) : assegnazioni.length === 0 ? (
            <p className="p-6 text-center text-slate-400">
              Nessuna assegnazione attiva per {selectedPersona.cognome} {selectedPersona.nome}.
            </p>
          ) : (
            <>
              {/* Selection toolbar */}
              {selectedIds.length > 0 && (
                <div className="px-4 py-2 bg-orange-50 border-b flex items-center gap-3 text-xs">
                  <span>
                    <strong>{selectedIds.length}</strong> selezionati — totale <strong>{selectedTotal}</strong> pz
                  </span>
                  <button onClick={openBulk} className="px-3 py-1 rounded bg-orange-600 text-white hover:bg-orange-700 font-medium">
                    Demolisci selezionati
                  </button>
                  <button onClick={deselectAll} className="text-slate-500 hover:underline">Deseleziona</button>
                </div>
              )}
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-3 py-3 w-8">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === assegnazioni.length && assegnazioni.length > 0}
                        onChange={() => selectedIds.length === assegnazioni.length ? deselectAll() : selectAll()}
                        className="rounded"
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Codice DPI</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Descrizione</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-500">Q.tà</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-500">Q.tà Da Demolire</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Data Assegn.</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Note</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assegnazioni.map((a) => (
                    <tr key={a.id} className={`hover:bg-slate-50 ${selectedIds.includes(a.id) ? "bg-orange-50" : ""}`}>
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(a.id)}
                          onChange={() => toggleSelect(a.id, a.quantita)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{a.dpi_codice}</td>
                      <td className="px-4 py-3 text-xs max-w-xs truncate">{a.dpi_descrizione}</td>
                      <td className="px-4 py-3 text-right">{a.quantita}</td>
                      <td className="px-4 py-3 text-right">
                        {selectedIds.includes(a.id) ? (
                          <input
                            type="number"
                            min={1}
                            max={a.quantita}
                            value={demolishQtys[a.id] ?? a.quantita}
                            onChange={(e) => {
                              const v = parseInt(e.target.value) || 0;
                              setDemolishQtys((prev) => ({ ...prev, [a.id]: Math.min(v, a.quantita) }));
                            }}
                            className="w-16 px-1 py-0.5 border border-slate-300 rounded text-xs text-center"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">{a.data_assegnazione}</td>
                      <td className="px-4 py-3 text-xs text-slate-400 max-w-[150px] truncate">
                        {a.note || "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setDemolizioneId(a.id);
                            setBulkMode(false);
                            setDataDemolizione(new Date().toISOString().split("T")[0]);
                            setNoteDemolizione("");
                          }}
                          className="text-xs px-3 py-1 rounded bg-orange-100 text-orange-700 hover:bg-orange-200 font-medium"
                        >
                          Demolisci
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      {/* Single Demolizione modal */}
      {demolizioneId != null && !bulkMode && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">Conferma Demolizione</h3>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Data Demolizione
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border rounded-lg mb-4 text-sm"
              value={dataDemolizione}
              onChange={(e) => setDataDemolizione(e.target.value)}
            />
            <label className="block text-sm font-medium text-slate-600 mb-1">Note</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg mb-4 text-sm"
              value={noteDemolizione}
              onChange={(e) => setNoteDemolizione(e.target.value)}
              placeholder="Note demolizione..."
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDemolizioneId(null)}
                className="px-4 py-2 rounded-lg text-sm border border-slate-300"
              >
                Annulla
              </button>
              <button
                onClick={() => demolisci(demolizioneId)}
                className="px-4 py-2 rounded-lg text-sm bg-orange-600 text-white hover:bg-orange-700"
              >
                Conferma Demolizione
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Demolizione modal */}
      {bulkMode && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">Conferma Demolizione Massiva</h3>
            <p className="text-sm text-slate-600 mb-4">
              Stai per demolire <strong>{selectedIds.length}</strong> assegnazioni
              per un totale di <strong>{selectedTotal}</strong> pezzi.
            </p>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Data Demolizione
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border rounded-lg mb-4 text-sm"
              value={dataDemolizione}
              onChange={(e) => setDataDemolizione(e.target.value)}
            />
            <label className="block text-sm font-medium text-slate-600 mb-1">Note</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg mb-4 text-sm"
              value={noteDemolizione}
              onChange={(e) => setNoteDemolizione(e.target.value)}
              placeholder="Note comuni..."
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setBulkMode(false)}
                className="px-4 py-2 rounded-lg text-sm border border-slate-300"
              >
                Annulla
              </button>
              <button
                onClick={demolisciBulk}
                className="px-4 py-2 rounded-lg text-sm bg-orange-600 text-white hover:bg-orange-700"
              >
                Demolisci {selectedIds.length} Assegnazioni
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
