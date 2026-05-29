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
}

interface DpiItem {
  id: number;
  codice_articolo: string;
  descrizione_articolo: string;
  quantita_disponibile: number;
}

interface Sostituzione {
  id: number;
  personale_id: number;
  vecchia_assegnazione_id: number;
  nuovo_dpi_id: number;
  quantita: number;
  data_sostituzione: string;
  note: string | null;
  personale_cognome: string;
  personale_nome: string;
  vecchio_dpi_codice: string;
  vecchio_dpi_descrizione: string;
  nuovo_dpi_codice: string;
  nuovo_dpi_descrizione: string;
}

export default function SostituzioniPage() {
  // Person autocomplete
  const [persList, setPersList] = useState<Persona[]>([]);
  const [persSearch, setPersSearch] = useState("");
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [showPersSuggestions, setShowPersSuggestions] = useState(false);

  // Active assignments of selected person
  const [assegnazioni, setAssegnazioni] = useState<Assegnazione[]>([]);
  const [selectedAss, setSelectedAss] = useState<number | null>(null);
  const [loadingAss, setLoadingAss] = useState(false);

  // DPI autocomplete (replacement)
  const [dpiList, setDpiList] = useState<DpiItem[]>([]);
  const [dpiSearch, setDpiSearch] = useState("");
  const [selectedDpi, setSelectedDpi] = useState<DpiItem | null>(null);
  const [showDpiSuggestions, setShowDpiSuggestions] = useState(false);

  // Form
  const [quantita, setQuantita] = useState(1);
  const [dataSost, setDataSost] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  // History
  const [items, setItems] = useState<Sostituzione[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters for history
  const [filtroPersSearch, setFiltroPersSearch] = useState("");
  const [filtroPersona, setFiltroPersona] = useState<Persona | null>(null);
  const [showFiltroPers, setShowFiltroPers] = useState(false);
  const [dataDa, setDataDa] = useState("");
  const [dataA, setDataA] = useState("");

  // Edit modal for history
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDpiSearch, setEditDpiSearch] = useState("");
  const [editDpi, setEditDpi] = useState<DpiItem | null>(null);
  const [showEditDpi, setShowEditDpi] = useState(false);
  const [editForm, setEditForm] = useState({ quantita: 1, data_sostituzione: "", note: "" });
  const editDpiRef = useRef<HTMLDivElement>(null);

  const persRef = useRef<HTMLDivElement>(null);
  const dpiRef = useRef<HTMLDivElement>(null);
  const filtroPersRef = useRef<HTMLDivElement>(null);

  // Load lists
  useEffect(() => {
    fetch("/api/personale").then((r) => r.json()).then(setPersList);
    fetch("/api/dpi").then((r) => r.json()).then(setDpiList);
  }, []);

  // Click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (persRef.current && !persRef.current.contains(e.target as Node))
        setShowPersSuggestions(false);
      if (dpiRef.current && !dpiRef.current.contains(e.target as Node))
        setShowDpiSuggestions(false);
      if (filtroPersRef.current && !filtroPersRef.current.contains(e.target as Node))
        setShowFiltroPers(false);
      if (editDpiRef.current && !editDpiRef.current.contains(e.target as Node))
        setShowEditDpi(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Load history
  function loadItems() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filtroPersona) params.set("personale_id", String(filtroPersona.id));
    if (dataDa) params.set("data_da", dataDa);
    if (dataA) params.set("data_a", dataA);
    fetch(`/api/sostituzioni${params.toString() ? `?${params}` : ""}`)
      .then((r) => r.json())
      .then(setItems)
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadItems(); }, [filtroPersona, dataDa, dataA]);

  // Suggestions
  const persSuggestions = useMemo(() => {
    const q = persSearch.toLowerCase();
    return persList.filter(
      (p) => p.cognome.toLowerCase().includes(q) || p.nome.toLowerCase().includes(q) || p.id_utente.toLowerCase().includes(q)
    ).slice(0, 15);
  }, [persSearch, persList]);

  const filtroPersSuggestions = useMemo(() => {
    const q = filtroPersSearch.toLowerCase();
    return persList.filter(
      (p) => p.cognome.toLowerCase().includes(q) || p.nome.toLowerCase().includes(q) || p.id_utente.toLowerCase().includes(q)
    ).slice(0, 15);
  }, [filtroPersSearch, persList]);

  const dpiSuggestions = useMemo(() => {
    const q = dpiSearch.toLowerCase();
    return dpiList.filter(
      (d) => d.codice_articolo.toLowerCase().includes(q) || d.descrizione_articolo.toLowerCase().includes(q)
    ).slice(0, 15);
  }, [dpiSearch, dpiList]);

  const editDpiSuggestions = useMemo(() => {
    const q = editDpiSearch.toLowerCase();
    return dpiList.filter(
      (d) => d.codice_articolo.toLowerCase().includes(q) || d.descrizione_articolo.toLowerCase().includes(q)
    ).slice(0, 15);
  }, [editDpiSearch, dpiList]);

  function selectPersona(p: Persona) {
    setSelectedPersona(p);
    setPersSearch(`${p.cognome} ${p.nome}`);
    setShowPersSuggestions(false);
    setSelectedAss(null);
    setSelectedDpi(null);
    setDpiSearch("");
    setLoadingAss(true);
    fetch(`/api/assegnazioni?personale_id=${p.id}&stato=assegnato`)
      .then((r) => r.json())
      .then(setAssegnazioni)
      .finally(() => setLoadingAss(false));
  }

  function selectDpi(d: DpiItem) {
    setSelectedDpi(d);
    setDpiSearch(`${d.codice_articolo} — ${d.descrizione_articolo}`);
    setShowDpiSuggestions(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPersona || !selectedDpi || !selectedAss) return;
    setSaving(true);
    const res = await fetch("/api/sostituzioni", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personale_id: selectedPersona.id,
        vecchia_assegnazione_id: selectedAss,
        nuovo_dpi_id: selectedDpi.id,
        quantita,
        data_sostituzione: dataSost,
        note: note || null,
      }),
    });
    if (res.ok) {
      // Reset form
      setSelectedPersona(null);
      setPersSearch("");
      setAssegnazioni([]);
      setSelectedAss(null);
      setSelectedDpi(null);
      setDpiSearch("");
      setQuantita(1);
      setNote("");
      loadItems();
    } else {
      const err = await res.json();
      alert(err.error || "Errore");
    }
    setSaving(false);
  }

  async function eliminaSostituzione(id: number) {
    if (!confirm("Annullare questa sostituzione? Verranno ripristinate le assegnazioni originali.")) return;
    const res = await fetch(`/api/sostituzioni/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  }

  function openEdit(s: Sostituzione) {
    setEditingId(s.id);
    setEditForm({
      quantita: s.quantita,
      data_sostituzione: s.data_sostituzione || "",
      note: s.note || "",
    });
    setEditDpiSearch("");
    setEditDpi(null);
  }

  async function saveEdit() {
    if (!editingId) return;
    const body: Record<string, unknown> = {
      quantita: editForm.quantita,
      data_sostituzione: editForm.data_sostituzione,
      note: editForm.note || null,
    };
    if (editDpi) body.nuovo_dpi_id = editDpi.id;
    const res = await fetch(`/api/sostituzioni/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setEditingId(null);
      loadItems();
    }
  }

  const hasFilters = filtroPersona || dataDa || dataA;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-800">Sostituzione DPI</h1>

      {/* New sostituzione form */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-2xl">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Nuova Sostituzione</h2>

        {/* Step 1: Select person */}
        <div ref={persRef} className="relative mb-4">
          <label className="block text-sm font-medium text-slate-600 mb-1">Persona</label>
          {selectedPersona ? (
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-medium">{selectedPersona.cognome} {selectedPersona.nome}</span>
              <span className="text-xs text-slate-400">ID: {selectedPersona.id_utente}</span>
              <button
                type="button"
                onClick={() => { setSelectedPersona(null); setPersSearch(""); setAssegnazioni([]); setSelectedAss(null); setSelectedDpi(null); setDpiSearch(""); }}
                className="text-xs text-red-500 hover:underline ml-auto"
              >Cambia</button>
            </div>
          ) : (
            <>
              <input
                type="text"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm"
                placeholder="Cerca persona..."
                value={persSearch}
                onChange={(e) => { setPersSearch(e.target.value); setShowPersSuggestions(true); }}
                onFocus={() => setShowPersSuggestions(true)}
              />
              {showPersSuggestions && persSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {persSuggestions.map((p) => (
                    <button key={p.id} type="button" className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex justify-between" onClick={() => selectPersona(p)}>
                      <span className="font-medium">{p.cognome} {p.nome}</span>
                      <span className="text-xs text-slate-400">ID: {p.id_utente}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Step 2: Select assignment to replace */}
        {selectedPersona && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-600 mb-1">Assegnazione da sostituire</label>
            {loadingAss ? (
              <p className="text-xs text-slate-400">Caricamento...</p>
            ) : assegnazioni.length === 0 ? (
              <p className="text-xs text-slate-400">Nessuna assegnazione attiva per questa persona.</p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {assegnazioni.map((a) => (
                  <label
                    key={a.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm ${
                      selectedAss === a.id ? "border-orange-400 bg-orange-50" : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="oldAss"
                      checked={selectedAss === a.id}
                      onChange={() => setSelectedAss(a.id)}
                    />
                    <span className="font-mono text-xs">{a.dpi_codice}</span>
                    <span className="text-xs truncate max-w-[250px]">{a.dpi_descrizione}</span>
                    <span className="text-xs text-slate-400 ml-auto">Q.tà: {a.quantita}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Select replacement DPI */}
        {selectedAss != null && (
          <>
            <div ref={dpiRef} className="relative mb-4">
              <label className="block text-sm font-medium text-slate-600 mb-1">Nuovo DPI (sostitutivo)</label>
              {selectedDpi ? (
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-mono font-medium">{selectedDpi.codice_articolo}</span>
                  <span className="text-sm truncate">{selectedDpi.descrizione_articolo}</span>
                  <span className="text-xs text-slate-400 ml-auto">Disp: {selectedDpi.quantita_disponibile}</span>
                  <button type="button" onClick={() => { setSelectedDpi(null); setDpiSearch(""); }} className="text-xs text-red-500 hover:underline">Cambia</button>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm"
                    placeholder="Cerca DPI sostitutivo..."
                    value={dpiSearch}
                    onChange={(e) => { setDpiSearch(e.target.value); setShowDpiSuggestions(true); }}
                    onFocus={() => setShowDpiSuggestions(true)}
                  />
                  {showDpiSuggestions && dpiSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {dpiSuggestions.map((d) => (
                        <button key={d.id} type="button" className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex justify-between" onClick={() => selectDpi(d)}>
                          <span><span className="font-mono font-medium">{d.codice_articolo}</span><span className="mx-2 text-slate-300">—</span><span>{d.descrizione_articolo}</span></span>
                          <span className="text-xs text-slate-400">Disp: {d.quantita_disponibile}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Step 4: quantity + date + note */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Quantità</label>
                  <input type="number" min={1} className="w-full px-3 py-2 border rounded-lg text-sm" value={quantita} onChange={(e) => setQuantita(parseInt(e.target.value) || 1)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Data Sostituzione</label>
                  <input type="date" className="w-full px-3 py-2 border rounded-lg text-sm" value={dataSost} onChange={(e) => setDataSost(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Note</label>
                <input type="text" className="w-full px-3 py-2 border rounded-lg text-sm" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Motivo sostituzione..." />
              </div>
              <button type="submit" disabled={saving || !selectedDpi} className="px-6 py-2 rounded-lg text-sm font-medium bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50">
                {saving ? "Salvataggio..." : "Conferma Sostituzione"}
              </button>
            </form>
          </>
        )}
      </div>

      {/* History */}
      <div>
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Storico Sostituzioni</h2>

        {/* History filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div ref={filtroPersRef} className="relative">
            {filtroPersona ? (
              <div className="flex items-center gap-1 px-3 py-2 bg-slate-100 rounded-lg text-xs">
                <span className="font-medium">{filtroPersona.cognome} {filtroPersona.nome}</span>
                <button type="button" onClick={() => { setFiltroPersona(null); setFiltroPersSearch(""); }} className="ml-1 text-red-400 hover:text-red-600 font-bold">x</button>
              </div>
            ) : (
              <>
                <input type="text" className="w-48 px-3 py-2 border border-slate-300 rounded-lg text-xs" placeholder="Filtra persona..." value={filtroPersSearch}
                  onChange={(e) => { setFiltroPersSearch(e.target.value); setShowFiltroPers(true); }} onFocus={() => setShowFiltroPers(true)} />
                {showFiltroPers && filtroPersSuggestions.length > 0 && (
                  <div className="absolute z-10 w-64 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filtroPersSuggestions.map((p) => (
                      <button key={p.id} type="button" className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 flex justify-between" onClick={() => { setFiltroPersona(p); setFiltroPersSearch(`${p.cognome} ${p.nome}`); setShowFiltroPers(false); }}>
                        <span className="font-medium">{p.cognome} {p.nome}</span>
                        <span className="text-slate-400">ID: {p.id_utente}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          <input type="date" value={dataDa} onChange={(e) => setDataDa(e.target.value)} className="px-2 py-1.5 border border-slate-300 rounded text-sm" />
          <span className="text-xs text-slate-400">a</span>
          <input type="date" value={dataA} onChange={(e) => setDataA(e.target.value)} className="px-2 py-1.5 border border-slate-300 rounded text-sm" />
          {hasFilters && (
            <button onClick={() => { setFiltroPersona(null); setFiltroPersSearch(""); setDataDa(""); setDataA(""); }} className="text-xs text-red-500 hover:underline">Reset filtri</button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <p className="p-6 text-center text-slate-400">Caricamento...</p>
          ) : items.length === 0 ? (
            <p className="p-6 text-center text-slate-400">Nessuna sostituzione registrata.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Persona</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">DPI Sostituito</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Nuovo DPI</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-500">Q.tà</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Data</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Note</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">{s.personale_cognome} {s.personale_nome}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs">{s.vecchio_dpi_codice}</span>
                        <div className="text-xs text-slate-400 max-w-[150px] truncate">{s.vecchio_dpi_descrizione}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-orange-700">{s.nuovo_dpi_codice}</span>
                        <div className="text-xs text-slate-400 max-w-[150px] truncate">{s.nuovo_dpi_descrizione}</div>
                      </td>
                      <td className="px-4 py-3 text-right">{s.quantita}</td>
                      <td className="px-4 py-3 text-xs">{s.data_sostituzione}</td>
                      <td className="px-4 py-3 text-xs text-slate-400 max-w-[120px] truncate">{s.note || "-"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => openEdit(s)} className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 font-medium">Modifica</button>
                          <button onClick={() => eliminaSostituzione(s.id)} className="text-xs px-2 py-1 rounded bg-red-100 text-red-600 hover:bg-red-200 font-medium" title="Annulla">✕</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {editingId != null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">Modifica Sostituzione</h3>

            <div ref={editDpiRef} className="relative mb-3">
              <label className="block text-sm font-medium text-slate-600 mb-1">Nuovo DPI (opzionale)</label>
              {editDpi ? (
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 text-sm">
                  <span className="font-mono font-medium">{editDpi.codice_articolo}</span>
                  <span className="truncate">{editDpi.descrizione_articolo}</span>
                  <button type="button" onClick={() => { setEditDpi(null); setEditDpiSearch(""); }} className="text-xs text-red-500 hover:underline ml-auto">×</button>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="Cerca DPI per cambiare..."
                    value={editDpiSearch}
                    onChange={(e) => { setEditDpiSearch(e.target.value); setShowEditDpi(true); }}
                    onFocus={() => setShowEditDpi(true)}
                  />
                  {showEditDpi && editDpiSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {editDpiSuggestions.map((d) => (
                        <button key={d.id} type="button" className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 flex justify-between" onClick={() => { setEditDpi(d); setEditDpiSearch(""); setShowEditDpi(false); }}>
                          <span><span className="font-mono font-medium">{d.codice_articolo}</span><span className="mx-2 text-slate-300">—</span><span>{d.descrizione_articolo}</span></span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <label className="block text-sm font-medium text-slate-600 mb-1">Quantità</label>
            <input
              type="number"
              min={1}
              className="w-full px-3 py-2 border rounded-lg mb-3 text-sm"
              value={editForm.quantita}
              onChange={(e) => setEditForm({ ...editForm, quantita: parseInt(e.target.value) || 1 })}
            />
            <label className="block text-sm font-medium text-slate-600 mb-1">Data Sostituzione</label>
            <input
              type="date"
              className="w-full px-3 py-2 border rounded-lg mb-3 text-sm"
              value={editForm.data_sostituzione}
              onChange={(e) => setEditForm({ ...editForm, data_sostituzione: e.target.value })}
            />
            <label className="block text-sm font-medium text-slate-600 mb-1">Note</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg mb-4 text-sm"
              value={editForm.note}
              onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditingId(null)}
                className="px-4 py-2 rounded-lg text-sm border border-slate-300"
              >
                Annulla
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 rounded-lg text-sm bg-slate-800 text-white hover:bg-slate-700"
              >
                Salva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
