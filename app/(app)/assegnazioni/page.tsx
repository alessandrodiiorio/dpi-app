"use client";

import { useEffect, useState, useMemo, useRef } from "react";

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

interface DpiItem {
  id: number;
  codice_articolo: string;
  descrizione_articolo: string;
}

interface Persona {
  id: number;
  cognome: string;
  nome: string;
  id_utente: string;
}

export default function AssegnazioniPage() {
  const [items, setItems] = useState<Assegnazione[]>([]);
  const [dpiList, setDpiList] = useState<DpiItem[]>([]);
  const [persList, setPersList] = useState<Persona[]>([]);

  // Stato filter
  const [filter, setFilter] = useState("tutti");

  // Date filter
  const [dataDa, setDataDa] = useState("");
  const [dataA, setDataA] = useState("");

  // DPI filter - intelligent autocomplete
  const [dpiSearch, setDpiSearch] = useState("");
  const [selectedDpi, setSelectedDpi] = useState<DpiItem | null>(null);
  const [showDpiSuggestions, setShowDpiSuggestions] = useState(false);

  // Persona filter - intelligent autocomplete
  const [persSearch, setPersSearch] = useState("");
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [showPersSuggestions, setShowPersSuggestions] = useState(false);

  const dpiRef = useRef<HTMLDivElement>(null);
  const persRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/dpi").then((r) => r.json()).then(setDpiList);
    fetch("/api/personale").then((r) => r.json()).then(setPersList);
  }, []);

  // Click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dpiRef.current && !dpiRef.current.contains(e.target as Node)) {
        setShowDpiSuggestions(false);
      }
      if (persRef.current && !persRef.current.contains(e.target as Node)) {
        setShowPersSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function load() {
    const params = new URLSearchParams();
    if (filter !== "tutti") params.set("stato", filter);
    if (dataDa) params.set("data_da", dataDa);
    if (dataA) params.set("data_a", dataA);
    if (selectedDpi) params.set("dpi_id", String(selectedDpi.id));
    if (selectedPersona) params.set("personale_id", String(selectedPersona.id));
    const qs = params.toString();
    fetch(`/api/assegnazioni${qs ? `?${qs}` : ""}`)
      .then((r) => r.json())
      .then(setItems);
  }

  useEffect(() => {
    load();
  }, [filter, dataDa, dataA, selectedDpi, selectedPersona]);

  // DPI suggestions
  const dpiSuggestions = useMemo(() => {
    const q = dpiSearch.toLowerCase();
    return dpiList
      .filter(
        (d) =>
          d.codice_articolo.toLowerCase().includes(q) ||
          d.descrizione_articolo.toLowerCase().includes(q)
      )
      .slice(0, 15);
  }, [dpiSearch, dpiList]);

  // Persona suggestions
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

  function selectDpi(d: DpiItem) {
    setSelectedDpi(d);
    setDpiSearch(`${d.codice_articolo} — ${d.descrizione_articolo}`);
    setShowDpiSuggestions(false);
  }

  function clearDpi() {
    setSelectedDpi(null);
    setDpiSearch("");
  }

  function selectPersona(p: Persona) {
    setSelectedPersona(p);
    setPersSearch(`${p.cognome} ${p.nome}`);
    setShowPersSuggestions(false);
  }

  function clearPersona() {
    setSelectedPersona(null);
    setPersSearch("");
  }

  async function demolisci(id: number) {
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

  async function elimina(id: number) {
    if (!confirm("Eliminare questa assegnazione?")) return;
    const res = await fetch(`/api/assegnazioni/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  }

  const hasActiveFilters = selectedDpi || selectedPersona || dataDa || dataA || filter !== "tutti";

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Assegnazioni</h1>

      {/* Filter row 1: Stato + Date */}
      <div className="flex flex-wrap gap-2 mb-2 items-center">
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
            {s === "tutti" ? "Tutti" : s === "assegnato" ? "Assegnati" : "Demoliti"}
          </button>
        ))}
        <div className="flex items-center gap-2 ml-4">
          <label className="text-xs text-slate-500">Da</label>
          <input
            type="date"
            value={dataDa}
            onChange={(e) => setDataDa(e.target.value)}
            className="px-2 py-1.5 border border-slate-300 rounded text-sm"
          />
          <label className="text-xs text-slate-500">A</label>
          <input
            type="date"
            value={dataA}
            onChange={(e) => setDataA(e.target.value)}
            className="px-2 py-1.5 border border-slate-300 rounded text-sm"
          />
        </div>
      </div>

      {/* Filter row 2: DPI + Persona autocomplete */}
      <div className="flex flex-wrap gap-3 mb-4">
        {/* DPI filter */}
        <div ref={dpiRef} className="relative">
          {selectedDpi ? (
            <div className="flex items-center gap-1 px-3 py-2 bg-slate-100 rounded-lg text-xs">
              <span className="font-mono font-medium">{selectedDpi.codice_articolo}</span>
              <span className="text-slate-400 max-w-[120px] truncate">{selectedDpi.descrizione_articolo}</span>
              <button
                type="button"
                onClick={clearDpi}
                className="ml-1 text-red-400 hover:text-red-600 font-bold"
              >
                ×
              </button>
            </div>
          ) : (
            <>
              <input
                type="text"
                className="w-56 px-3 py-2 border border-slate-300 rounded-lg text-xs"
                placeholder="Filtra per DPI..."
                value={dpiSearch}
                onChange={(e) => {
                  setDpiSearch(e.target.value);
                  setShowDpiSuggestions(true);
                }}
                onFocus={() => setShowDpiSuggestions(true)}
              />
              {showDpiSuggestions && dpiSuggestions.length > 0 && (
                <div className="absolute z-10 w-72 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {dpiSuggestions.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 flex justify-between"
                      onClick={() => selectDpi(d)}
                    >
                      <span>
                        <span className="font-mono font-medium">{d.codice_articolo}</span>
                        <span className="mx-2 text-slate-300">—</span>
                        <span>{d.descrizione_articolo}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Persona filter */}
        <div ref={persRef} className="relative">
          {selectedPersona ? (
            <div className="flex items-center gap-1 px-3 py-2 bg-slate-100 rounded-lg text-xs">
              <span className="font-medium">{selectedPersona.cognome} {selectedPersona.nome}</span>
              <span className="text-slate-400">({selectedPersona.id_utente})</span>
              <button
                type="button"
                onClick={clearPersona}
                className="ml-1 text-red-400 hover:text-red-600 font-bold"
              >
                ×
              </button>
            </div>
          ) : (
            <>
              <input
                type="text"
                className="w-48 px-3 py-2 border border-slate-300 rounded-lg text-xs"
                placeholder="Filtra per persona..."
                value={persSearch}
                onChange={(e) => {
                  setPersSearch(e.target.value);
                  setShowPersSuggestions(true);
                }}
                onFocus={() => setShowPersSuggestions(true)}
              />
              {showPersSuggestions && persSuggestions.length > 0 && (
                <div className="absolute z-10 w-64 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {persSuggestions.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 flex justify-between"
                      onClick={() => selectPersona(p)}
                    >
                      <span className="font-medium">{p.cognome} {p.nome}</span>
                      <span className="text-slate-400">ID: {p.id_utente}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Reset all */}
        {hasActiveFilters && (
          <button
            onClick={() => {
              setFilter("tutti");
              setDataDa("");
              setDataA("");
              clearDpi();
              clearPersona();
            }}
            className="text-xs text-red-500 hover:underline self-center"
          >
            Reset filtri
          </button>
        )}
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
                <th className="px-4 py-3 text-left font-medium text-slate-500">Demolizione</th>
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
                    <div className="flex items-center gap-1 justify-end">
                      {a.stato === "assegnato" && (
                        <button
                          onClick={() => demolisci(a.id)}
                          className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-700 hover:bg-orange-200 font-medium"
                        >
                          Demolisci
                        </button>
                      )}
                      <button
                        onClick={() => elimina(a.id)}
                        className="text-xs px-2 py-1 rounded bg-red-100 text-red-600 hover:bg-red-200 font-medium"
                        title="Elimina"
                      >
                        ✕
                      </button>
                    </div>
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
