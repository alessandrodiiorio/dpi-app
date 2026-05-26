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
  const [selectedDpiId, setSelectedDpiId] = useState("");
  const [selectedPersonaId, setSelectedPersonaId] = useState("");
  const [quantita, setQuantita] = useState(1);
  const [dataAssegnazione, setDataAssegnazione] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dpi").then((r) => r.json()).then(setDpiList);
    fetch("/api/personale").then((r) => r.json()).then(setPersList);
  }, []);

  const filteredDpi = useMemo(() => {
    if (!dpiSearch) return dpiList;
    const q = dpiSearch.toLowerCase();
    return dpiList.filter(
      (d) =>
        d.codice_articolo.toLowerCase().includes(q) ||
        d.descrizione_articolo.toLowerCase().includes(q)
    );
  }, [dpiSearch, dpiList]);

  const selectedDpi = useMemo(
    () => dpiList.find((d) => d.id === parseInt(selectedDpiId)),
    [selectedDpiId, dpiList]
  );

  const filteredPers = useMemo(() => {
    if (!persSearch) return persList;
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
    if (!selectedDpiId || !selectedPersonaId) {
      setError("Seleziona DPI e persona");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/assegnazioni", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dpi_id: parseInt(selectedDpiId),
        personale_id: parseInt(selectedPersonaId),
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
        {/* DPI select — dropdown nativo */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">DPI</label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm mb-2"
            placeholder="Filtra per codice o descrizione..."
            value={dpiSearch}
            onChange={(e) => setDpiSearch(e.target.value)}
          />
          <select
            className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm bg-white"
            value={selectedDpiId}
            onChange={(e) => setSelectedDpiId(e.target.value)}
            required
          >
            <option value="">-- Seleziona DPI --</option>
            {filteredDpi.map((d) => (
              <option key={d.id} value={d.id}>
                {d.codice_articolo} — {d.descrizione_articolo} (disp: {d.quantita_disponibile})
              </option>
            ))}
          </select>
          {selectedDpi && (
            <p className="text-xs text-slate-400 mt-1">
              Disponibili: {selectedDpi.quantita_disponibile} pezzi
            </p>
          )}
        </div>

        {/* Persona select — dropdown nativo */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Persona</label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm mb-2"
            placeholder="Filtra per nome, cognome..."
            value={persSearch}
            onChange={(e) => setPersSearch(e.target.value)}
          />
          <select
            className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm bg-white"
            value={selectedPersonaId}
            onChange={(e) => setSelectedPersonaId(e.target.value)}
            required
          >
            <option value="">-- Seleziona persona --</option>
            {filteredPers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.cognome} {p.nome} ({p.id_utente})
              </option>
            ))}
          </select>
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
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}
          </div>
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
            disabled={loading || !selectedDpiId || !selectedPersonaId}
            className="px-6 py-2 rounded-lg text-sm bg-slate-800 text-white disabled:opacity-50"
          >
            {loading ? "Salvataggio..." : "Assegna DPI"}
          </button>
        </div>
      </form>
    </div>
  );
}
