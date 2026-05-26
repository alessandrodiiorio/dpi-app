"use client";

import { useEffect, useState, useMemo } from "react";
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
  const [dpiSearch, setDpiSearch] = useState("");
  const [persSearch, setPersSearch] = useState("");
  const [selectedDpi, setSelectedDpi] = useState<DpiItem | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [quantita, setQuantita] = useState(1);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dpi").then((r) => r.json()).then(setDpiList);
    fetch("/api/personale").then((r) => r.json()).then(setPersList);
  }, []);

  const filteredDpi = useMemo(() => {
    if (!dpiSearch) return [];
    const q = dpiSearch.toLowerCase();
    return dpiList.filter(
      (d) =>
        d.codice_articolo.toLowerCase().includes(q) ||
        d.descrizione_articolo.toLowerCase().includes(q)
    );
  }, [dpiSearch, dpiList]);

  const filteredPers = useMemo(() => {
    if (!persSearch) return [];
    const q = persSearch.toLowerCase();
    return persList.filter(
      (p) =>
        p.cognome.toLowerCase().includes(q) ||
        p.nome.toLowerCase().includes(q) ||
        p.id_utente.toLowerCase().includes(q)
    );
  }, [persSearch, persList]);

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
        data_assegnazione: new Date().toISOString().split("T")[0],
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
        {/* DPI select */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">DPI</label>
          {selectedDpi ? (
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-mono text-xs">{selectedDpi.codice_articolo}</span>
              <span className="text-sm flex-1 truncate">{selectedDpi.descrizione_articolo}</span>
              <span className="text-xs text-slate-400">
                Disp: {selectedDpi.quantita_disponibile}
              </span>
              <button
                type="button"
                onClick={() => setSelectedDpi(null)}
                className="text-xs text-red-500 hover:underline"
              >
                Cambia
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm"
                placeholder="Cerca DPI per codice o descrizione..."
                value={dpiSearch}
                onChange={(e) => setDpiSearch(e.target.value)}
              />
              {dpiSearch && filteredDpi.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredDpi.slice(0, 10).map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex justify-between"
                      onClick={() => {
                        setSelectedDpi(d);
                        setDpiSearch("");
                      }}
                    >
                      <span>
                        <span className="font-mono text-xs">{d.codice_articolo}</span> -{" "}
                        {d.descrizione_articolo}
                      </span>
                      <span className="text-xs text-slate-400">Disp: {d.quantita_disponibile}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Persona select */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Persona</label>
          {selectedPersona ? (
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-medium">
                {selectedPersona.cognome} {selectedPersona.nome}
              </span>
              <span className="text-xs text-slate-400">ID: {selectedPersona.id_utente}</span>
              <button
                type="button"
                onClick={() => setSelectedPersona(null)}
                className="text-xs text-red-500 hover:underline ml-auto"
              >
                Cambia
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm"
                placeholder="Cerca persona per nome, cognome o ID..."
                value={persSearch}
                onChange={(e) => setPersSearch(e.target.value)}
              />
              {persSearch && filteredPers.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredPers.slice(0, 10).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                      onClick={() => {
                        setSelectedPersona(p);
                        setPersSearch("");
                      }}
                    >
                      {p.cognome} {p.nome}{" "}
                      <span className="text-xs text-slate-400">({p.id_utente})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
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
