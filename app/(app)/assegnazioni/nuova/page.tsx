"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";

interface DpiItem {
  id: number;
  codice_articolo: string;
  descrizione_articolo: string;
  quantita_disponibile: number;
}

interface Persona {
  id: number;
  cognome: string;
  nome: string;
  id_utente: string;
}

export default function NuovaAssegnazionePage() {
  const router = useRouter();
  const [dpiList, setDpiList] = useState<DpiItem[]>([]);
  const [persList, setPersList] = useState<Persona[]>([]);

  // DPI - multi-select
  const [dpiSearch, setDpiSearch] = useState("");
  const [selectedDpis, setSelectedDpis] = useState<DpiItem[]>([]);
  const [showDpiSuggestions, setShowDpiSuggestions] = useState(false);

  // Persona - multi-select
  const [persSearch, setPersSearch] = useState("");
  const [selectedPersone, setSelectedPersone] = useState<Persona[]>([]);
  const [showPersSuggestions, setShowPersSuggestions] = useState(false);

  const [quantita, setQuantita] = useState(1);
  const [dataAssegnazione, setDataAssegnazione] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const dpiRef = useRef<HTMLDivElement>(null);
  const persRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/dpi").then((r) => r.json()).then(setDpiList);
    fetch("/api/personale").then((r) => r.json()).then(setPersList);
  }, []);

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

  const dpiSuggestions = useMemo(() => {
    const q = dpiSearch.toLowerCase();
    const selectedIds = new Set(selectedDpis.map((d) => d.id));
    return dpiList
      .filter(
        (d) =>
          !selectedIds.has(d.id) &&
          (d.codice_articolo.toLowerCase().includes(q) ||
            d.descrizione_articolo.toLowerCase().includes(q))
      )
      .slice(0, 15);
  }, [dpiSearch, dpiList, selectedDpis]);

  const persSuggestions = useMemo(() => {
    const q = persSearch.toLowerCase();
    const selectedIds = new Set(selectedPersone.map((p) => p.id));
    return persList
      .filter(
        (p) =>
          !selectedIds.has(p.id) &&
          (p.cognome.toLowerCase().includes(q) ||
            p.nome.toLowerCase().includes(q) ||
            p.id_utente.toLowerCase().includes(q))
      )
      .slice(0, 15);
  }, [persSearch, persList, selectedPersone]);

  function addDpi(d: DpiItem) {
    setSelectedDpis((prev) => [...prev, d]);
    setDpiSearch("");
    setShowDpiSuggestions(false);
  }

  function removeDpi(id: number) {
    setSelectedDpis((prev) => prev.filter((d) => d.id !== id));
  }

  function addPersona(p: Persona) {
    setSelectedPersone((prev) => [...prev, p]);
    setPersSearch("");
    setShowPersSuggestions(false);
  }

  function removePersona(id: number) {
    setSelectedPersone((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedDpis.length === 0 || selectedPersone.length === 0) {
      setError("Seleziona almeno un DPI e una persona");
      return;
    }
    setLoading(true);
    setError("");

    for (const d of selectedDpis) {
      for (const p of selectedPersone) {
        const res = await fetch("/api/assegnazioni", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dpi_id: d.id,
            personale_id: p.id,
            quantita,
            data_assegnazione: dataAssegnazione,
            note: note || null,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          setError(err.error || "Errore creazione assegnazione");
          setLoading(false);
          return;
        }
      }
    }

    setLoading(false);
    router.push("/assegnazioni");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Nuova Assegnazione</h1>
      <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
        {/* DPI multi-select */}
        <div ref={dpiRef} className="relative">
          <label className="block text-sm font-medium text-slate-600 mb-1">DPI</label>
          {/* Selected DPI chips */}
          {selectedDpis.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {selectedDpis.map((d) => (
                <span
                  key={d.id}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-xs font-medium"
                >
                  <span className="font-mono">{d.codice_articolo}</span>
                  <button
                    type="button"
                    onClick={() => removeDpi(d.id)}
                    className="text-red-400 hover:text-red-600 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
              <span className="text-xs text-slate-400 self-center">
                {selectedDpis.length} selezionati
              </span>
            </div>
          )}
          <input
            type="text"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm"
            placeholder="Cerca DPI da aggiungere..."
            value={dpiSearch}
            onChange={(e) => {
              setDpiSearch(e.target.value);
              setShowDpiSuggestions(true);
            }}
            onFocus={() => setShowDpiSuggestions(true)}
          />
          {showDpiSuggestions && dpiSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
              {dpiSuggestions.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex justify-between items-center"
                  onClick={() => addDpi(d)}
                >
                  <span>
                    <span className="font-mono text-xs font-medium">{d.codice_articolo}</span>
                    <span className="mx-2 text-slate-300">—</span>
                    <span>{d.descrizione_articolo}</span>
                  </span>
                  <span className="text-xs text-slate-400 shrink-0 ml-4">
                    {d.quantita_disponibile} pz
                  </span>
                </button>
              ))}
            </div>
          )}
          {dpiSuggestions.length === 0 && dpiSearch && showDpiSuggestions && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs text-slate-400">
              Nessun DPI trovato.
            </div>
          )}
        </div>

        {/* Persona multi-select */}
        <div ref={persRef} className="relative">
          <label className="block text-sm font-medium text-slate-600 mb-1">Persona</label>
          {/* Selected Persona chips */}
          {selectedPersone.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {selectedPersone.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-xs font-medium"
                >
                  <span>{p.cognome} {p.nome}</span>
                  <button
                    type="button"
                    onClick={() => removePersona(p.id)}
                    className="text-red-400 hover:text-red-600 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
              <span className="text-xs text-slate-400 self-center">
                {selectedPersone.length} selezionati
              </span>
            </div>
          )}
          <input
            type="text"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm"
            placeholder="Cerca persona da aggiungere..."
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
                  className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex justify-between items-center"
                  onClick={() => addPersona(p)}
                >
                  <span className="font-medium">{p.cognome} {p.nome}</span>
                  <span className="text-xs text-slate-400">ID: {p.id_utente}</span>
                </button>
              ))}
            </div>
          )}
          {persSuggestions.length === 0 && persSearch && showPersSuggestions && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs text-slate-400">
              Nessuna persona trovata.
            </div>
          )}
        </div>

        {/* Data assegnazione */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Data Assegnazione
          </label>
          <input
            type="date"
            className="w-48 px-4 py-2 border border-slate-300 rounded-lg text-sm"
            value={dataAssegnazione}
            onChange={(e) => setDataAssegnazione(e.target.value)}
            required
          />
        </div>

        {/* Quantità */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Quantità</label>
          <input
            type="number"
            min={0}
            className="w-32 px-4 py-2 border border-slate-300 rounded-lg text-sm"
            value={quantita}
            onChange={(e) => setQuantita(parseInt(e.target.value) || 0)}
          />
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Note</label>
          <textarea
            className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note opzionali..."
          />
        </div>

        {/* Riepilogo */}
        {selectedDpis.length > 0 && selectedPersone.length > 0 && (
          <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-500">
            Verranno create <strong className="text-slate-700">{selectedDpis.length * selectedPersone.length}</strong> assegnazioni
            ({selectedDpis.length} DPI × {selectedPersone.length} persone)
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push("/assegnazioni")}
            className="px-6 py-2 rounded-lg text-sm border border-slate-300"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={loading || selectedDpis.length === 0 || selectedPersone.length === 0}
            className="px-6 py-2 rounded-lg text-sm bg-slate-800 text-white disabled:opacity-50"
          >
            {loading ? "Salvataggio..." : "Assegna DPI"}
          </button>
        </div>
      </form>
    </div>
  );
}
