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

  // DPI
  const [dpiSearch, setDpiSearch] = useState("");
  const [selectedDpi, setSelectedDpi] = useState<DpiItem | null>(null);
  const [showDpiSuggestions, setShowDpiSuggestions] = useState(false);

  // Persona
  const [persSearch, setPersSearch] = useState("");
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
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

  // Close suggestions on click outside
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
    return dpiList.filter(
      (d) =>
        d.codice_articolo.toLowerCase().includes(q) ||
        d.descrizione_articolo.toLowerCase().includes(q)
    ).slice(0, 15);
  }, [dpiSearch, dpiList]);

  const persSuggestions = useMemo(() => {
    const q = persSearch.toLowerCase();
    return persList.filter(
      (p) =>
        p.cognome.toLowerCase().includes(q) ||
        p.nome.toLowerCase().includes(q) ||
        p.id_utente.toLowerCase().includes(q)
    ).slice(0, 15);
  }, [persSearch, persList]);

  function selectDpi(d: DpiItem) {
    setSelectedDpi(d);
    setDpiSearch(`${d.codice_articolo} — ${d.descrizione_articolo}`);
    setShowDpiSuggestions(false);
  }

  function selectPersona(p: Persona) {
    setSelectedPersona(p);
    setPersSearch(`${p.cognome} ${p.nome}`);
    setShowPersSuggestions(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDpi || !selectedPersona) {
      setError("Seleziona DPI e persona");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/assegnazioni", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dpi_id: selectedDpi.id,
        personale_id: selectedPersona.id,
        quantita,
        data_assegnazione: dataAssegnazione,
        note: note || null,
      }),
    });
    if (res.ok) {
      router.push("/assegnazioni");
    } else {
      const err = await res.json();
      setError(err.error || "Errore creazione assegnazione");
    }
    setLoading(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Nuova Assegnazione</h1>
      <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
        {/* DPI autocomplete */}
        <div ref={dpiRef} className="relative">
          <label className="block text-sm font-medium text-slate-600 mb-1">DPI</label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm"
            placeholder="Cerca per codice o descrizione..."
            value={dpiSearch}
            onChange={(e) => {
              setDpiSearch(e.target.value);
              setSelectedDpi(null);
              setShowDpiSuggestions(true);
            }}
            onFocus={() => { if (!selectedDpi) setShowDpiSuggestions(true); }}
          />
          {showDpiSuggestions && dpiSuggestions.length > 0 && !selectedDpi && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
              {dpiSuggestions.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex justify-between items-center"
                  onClick={() => selectDpi(d)}
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
          {selectedDpi && (
            <p className="text-xs text-slate-400 mt-1">
              Disponibili: <strong>{selectedDpi.quantita_disponibile}</strong> pezzi
            </p>
          )}
        </div>

        {/* Persona autocomplete */}
        <div ref={persRef} className="relative">
          <label className="block text-sm font-medium text-slate-600 mb-1">Persona</label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm"
            placeholder="Cerca per nome, cognome o ID..."
            value={persSearch}
            onChange={(e) => {
              setPersSearch(e.target.value);
              setSelectedPersona(null);
              setShowPersSuggestions(true);
            }}
            onFocus={() => { if (!selectedPersona) setShowPersSuggestions(true); }}
          />
          {showPersSuggestions && persSuggestions.length > 0 && !selectedPersona && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
              {persSuggestions.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex justify-between items-center"
                  onClick={() => selectPersona(p)}
                >
                  <span>
                    <span className="font-medium">{p.cognome} {p.nome}</span>
                  </span>
                  <span className="text-xs text-slate-400">
                    ID: {p.id_utente}
                  </span>
                </button>
              ))}
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
            min={1}
            max={selectedDpi?.quantita_disponibile || 999}
            className="w-32 px-4 py-2 border border-slate-300 rounded-lg text-sm"
            value={quantita}
            onChange={(e) => setQuantita(parseInt(e.target.value) || 1)}
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
            disabled={loading || !selectedDpi || !selectedPersona}
            className="px-6 py-2 rounded-lg text-sm bg-slate-800 text-white disabled:opacity-50"
          >
            {loading ? "Salvataggio..." : "Assegna DPI"}
          </button>
        </div>
      </form>
    </div>
  );
}
