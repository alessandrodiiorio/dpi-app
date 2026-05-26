"use client";

import { useEffect, useState } from "react";

interface ReportData {
  summary: {
    totDpi: number;
    totPersonale: number;
    totAssegnazioni: number;
    attivi: number;
    restituiti: number;
    stockOk: number;
    stockZero: number;
    stockNoData: number;
  };
  topDpi: {
    dpi_id: number;
    codice: string;
    descrizione: string;
    quantita_assegnata: number;
    disponibile: number;
    totale: number;
  }[];
  topPersonale: {
    personale_id: number;
    cognome: string;
    nome: string;
    totale_assegnazioni: number;
    attive: number;
  }[];
  months: {
    label: string;
    assegnati: number;
    restituiti: number;
  }[];
}

type DetailType =
  | "dpi"
  | "personale"
  | "assegnazioni"
  | "attivi"
  | "restituiti"
  | "stock-ok"
  | "stock-zero"
  | "stock-nodata"
  | "dpi-assegnazioni"
  | "personale-assegnazioni";

const detailLabels: Record<DetailType, string> = {
  dpi: "Catalogo DPI",
  personale: "Personale",
  assegnazioni: "Tutte le Assegnazioni",
  attivi: "Assegnazioni Attive",
  restituiti: "Assegnazioni Restituite",
  "stock-ok": "DPI con Stock Disponibile",
  "stock-zero": "DPI con Stock Esaurito",
  "stock-nodata": "DPI con Stock Non Impostato",
  "dpi-assegnazioni": "Assegnazioni del DPI",
  "personale-assegnazioni": "Assegnazioni della Persona",
};

export default function ReportPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [detailType, setDetailType] = useState<DetailType | null>(null);
  const [detailTitle, setDetailTitle] = useState("");
  const [detailData, setDetailData] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetch("/api/report")
      .then((r) => r.json())
      .then(setData);
  }, []);

  function openDetail(type: DetailType, title: string, extraParams?: string) {
    setDetailType(type);
    setDetailTitle(title);
    setDetailLoading(true);
    let url = `/api/report/detail?type=${type}`;
    if (extraParams) url += extraParams;
    fetch(url)
      .then((r) => r.json())
      .then((rows) => {
        setDetailData(rows);
        setDetailLoading(false);
      });
  }

  function closeDetail() {
    setDetailType(null);
    setDetailData([]);
  }

  // ---- Export helpers ----
  async function exportExcel() {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(detailData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dati");
    XLSX.writeFile(wb, `report-${detailType || "dati"}.xlsx`);
  }

  async function exportPdf() {
    const { jsPDF } = await import("jspdf");
    await import("jspdf-autotable");
    const doc = new (jsPDF as any)();
    doc.text(detailTitle, 14, 16);
    if (detailData.length === 0) {
      doc.text("Nessun dato.", 14, 24);
      doc.save(`report-${detailType || "dati"}.pdf`);
      return;
    }
    const headers = Object.keys(detailData[0]);
    const rows = detailData.map((r) => headers.map((h) => r[h] ?? ""));
    (doc as any).autoTable({
      head: [headers],
      body: rows,
      startY: 22,
      styles: { fontSize: 7, cellPadding: 1 },
      headStyles: { fillColor: [30, 41, 59] },
    });
    doc.save(`report-${detailType || "dati"}.pdf`);
  }

  if (!data) return <p className="text-slate-400">Caricamento report...</p>;

  const maxMonthVal = Math.max(
    ...data.months.map((m) => Math.max(m.assegnati, m.restituiti)),
    1
  );

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-800">Reportistica</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <ClickCard
          label="DPI Catalogo"
          value={data.summary.totDpi}
          color="bg-blue-500"
          onClick={() => openDetail("dpi", "Catalogo DPI")}
        />
        <ClickCard
          label="Personale"
          value={data.summary.totPersonale}
          color="bg-indigo-500"
          onClick={() => openDetail("personale", "Personale")}
        />
        <ClickCard
          label="Totale Assegn."
          value={data.summary.totAssegnazioni}
          color="bg-amber-500"
          onClick={() => openDetail("assegnazioni", "Tutte le Assegnazioni")}
        />
        <ClickCard
          label="Attivi"
          value={data.summary.attivi}
          color="bg-emerald-500"
          onClick={() => openDetail("attivi", "Assegnazioni Attive")}
        />
        <ClickCard
          label="Restituiti"
          value={data.summary.restituiti}
          color="bg-teal-500"
          onClick={() => openDetail("restituiti", "Assegnazioni Restituite")}
        />
        <ClickCard
          label="Stock > 0"
          value={data.summary.stockOk}
          color="bg-green-600"
          onClick={() => openDetail("stock-ok", "DPI con Stock > 0")}
        />
      </div>

      {/* Stock status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => openDetail("stock-ok", "DPI con Stock Disponibile")}
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 text-left hover:border-slate-400 transition-colors"
        >
          <p className="text-sm text-slate-500">Stock disponibile</p>
          <p className="text-2xl font-bold text-green-600">{data.summary.stockOk}</p>
        </button>
        <button
          onClick={() => openDetail("stock-zero", "DPI con Stock Esaurito")}
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 text-left hover:border-slate-400 transition-colors"
        >
          <p className="text-sm text-slate-500">Stock esaurito</p>
          <p className="text-2xl font-bold text-red-500">{data.summary.stockZero}</p>
        </button>
        <button
          onClick={() => openDetail("stock-nodata", "DPI con Stock Non Impostato")}
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 text-left hover:border-slate-400 transition-colors"
        >
          <p className="text-sm text-slate-500">Stock non impostato</p>
          <p className="text-2xl font-bold text-slate-400">{data.summary.stockNoData}</p>
        </button>
      </div>

      {/* Monthly bar chart */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Andamento Mensile
        </h2>
        <div className="flex items-end gap-1 h-48">
          {data.months.map((m) => (
            <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col justify-end gap-0.5" style={{ height: 160 }}>
                <div
                  className="w-full bg-amber-400 rounded-t"
                  style={{ height: `${(m.assegnati / maxMonthVal) * 80}px` }}
                  title={`Assegnati: ${m.assegnati}`}
                />
                <div
                  className="w-full bg-emerald-500 rounded-t"
                  style={{ height: `${(m.restituiti / maxMonthVal) * 80}px` }}
                  title={`Restituiti: ${m.restituiti}`}
                />
              </div>
              <span className="text-[10px] text-slate-400 rotate-45 origin-left translate-x-2 whitespace-nowrap">
                {m.label}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-8 justify-center text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-amber-400 rounded" /> Assegnati
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-emerald-500 rounded" /> Restituiti
          </span>
        </div>
      </div>

      {/* Top DPI + Top Personale */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top DPI */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b bg-slate-50">
            <h2 className="text-sm font-semibold text-slate-700">DPI Più Assegnati</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-slate-400">
                  <th className="px-3 py-2 text-left">Codice</th>
                  <th className="px-3 py-2 text-left">Descrizione</th>
                  <th className="px-3 py-2 text-right">Assegnati</th>
                  <th className="px-3 py-2 text-right">Disp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.topDpi.map((d, i) => (
                  <tr
                    key={i}
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() =>
                      openDetail(
                        "dpi-assegnazioni",
                        `Assegnazioni per DPI: ${d.codice}`,
                        `&dpi_id=${d.dpi_id}`
                      )
                    }
                  >
                    <td className="px-3 py-2 font-mono">{d.codice}</td>
                    <td className="px-3 py-2 max-w-[200px] truncate">{d.descrizione}</td>
                    <td className="px-3 py-2 text-right font-medium">{d.quantita_assegnata}</td>
                    <td className="px-3 py-2 text-right">
                      <span className={d.disponibile <= 0 && d.totale > 0 ? "text-red-500" : ""}>
                        {d.disponibile}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Personale */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b bg-slate-50">
            <h2 className="text-sm font-semibold text-slate-700">Personale con Più Assegnazioni</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-slate-400">
                  <th className="px-3 py-2 text-left">Cognome Nome</th>
                  <th className="px-3 py-2 text-right">Totale</th>
                  <th className="px-3 py-2 text-right">Attive</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.topPersonale.map((p, i) => (
                  <tr
                    key={i}
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() =>
                      openDetail(
                        "personale-assegnazioni",
                        `Assegnazioni per: ${p.cognome} ${p.nome}`,
                        `&personale_id=${p.personale_id}`
                      )
                    }
                  >
                    <td className="px-3 py-2 font-medium">
                      {p.cognome} {p.nome}
                    </td>
                    <td className="px-3 py-2 text-right">{p.totale_assegnazioni}</td>
                    <td className="px-3 py-2 text-right">
                      <span className={p.attive > 0 ? "text-amber-600 font-medium" : ""}>
                        {p.attive}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {detailType && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b bg-slate-50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">{detailTitle}</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={exportExcel}
                className="text-xs px-3 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 font-medium"
              >
                Excel
              </button>
              <button
                onClick={exportPdf}
                className="text-xs px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 font-medium"
              >
                PDF
              </button>
              <button
                onClick={closeDetail}
                className="text-xs px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 font-medium"
              >
                Chiudi
              </button>
            </div>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            {detailLoading ? (
              <p className="p-6 text-center text-slate-400">Caricamento...</p>
            ) : detailData.length === 0 ? (
              <p className="p-6 text-center text-slate-400">Nessun dato.</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-slate-400 sticky top-0 bg-slate-50">
                    {Object.keys(detailData[0]).map((key) => (
                      <th key={key} className="px-3 py-2 text-left capitalize">
                        {key.replace(/_/g, " ")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {detailData.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      {Object.values(row).map((val: any, j) => (
                        <td key={j} className="px-3 py-2">
                          {val === null ? "-" : String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ClickCard({
  label,
  value,
  color,
  onClick,
}: {
  label: string;
  value: number;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 text-left hover:border-slate-400 hover:shadow-md transition-all"
    >
      <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center mb-2`}>
        <span className="text-white font-bold text-sm">{value}</span>
      </div>
      <p className="text-xs text-slate-500">{label}</p>
    </button>
  );
}
