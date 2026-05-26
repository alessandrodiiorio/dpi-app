import { getDb } from "@/lib/db";
import { dpi, personale, assegnazioni } from "@/db/schema";
import { sql, eq } from "drizzle-orm";

export async function GET() {
  const db = getDb();

  const [dpiRows, persRows, assRows] = await Promise.all([
    db.select().from(dpi),
    db.select().from(personale),
    db.select({
      id: assegnazioni.id,
      dpi_id: assegnazioni.dpi_id,
      personale_id: assegnazioni.personale_id,
      quantita: assegnazioni.quantita,
      data_assegnazione: assegnazioni.data_assegnazione,
      data_restituzione: assegnazioni.data_restituzione,
      stato: assegnazioni.stato,
    }).from(assegnazioni),
  ]);

  const assegnati = assRows.filter((a) => a.stato === "assegnato");
  const restituiti = assRows.filter((a) => a.stato === "restituito");

  // DPI più assegnati (count by dpi_id)
  const dpiCountMap = new Map<number, number>();
  for (const a of assRows) {
    if (a.dpi_id != null) {
      dpiCountMap.set(a.dpi_id, (dpiCountMap.get(a.dpi_id) || 0) + (a.quantita ?? 0));
    }
  }
  const topDpi = [...dpiCountMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([dpiId, qty]) => {
      const d = dpiRows.find((r) => r.id === dpiId);
      return {
        dpi_id: dpiId,
        codice: d?.codice_articolo || "?",
        descrizione: d?.descrizione_articolo || "?",
        quantita_assegnata: qty,
        disponibile: d?.quantita_disponibile ?? 0,
        totale: d?.quantita_totale ?? 0,
      };
    });

  // Personale con più assegnazioni
  const persCountMap = new Map<number, number>();
  for (const a of assRows) {
    if (a.personale_id != null) {
      persCountMap.set(a.personale_id, (persCountMap.get(a.personale_id) || 0) + 1);
    }
  }
  const topPersonale = [...persCountMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([persId, count]) => {
      const p = persRows.find((r) => r.id === persId);
      const active = assegnati.filter((a) => a.personale_id === persId).length;
      return {
        personale_id: persId,
        cognome: p?.cognome || "?",
        nome: p?.nome || "?",
        totale_assegnazioni: count,
        attive: active,
      };
    });

  // Monthly timeline (last 12 months)
  const now = new Date();
  const months: { label: string; assegnati: number; restituiti: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("it-IT", { month: "short", year: "2-digit" });
    months.push({ label, assegnati: 0, restituiti: 0 });
  }

  for (const a of assRows) {
    if (a.data_assegnazione) {
      const d = new Date(a.data_assegnazione);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const m = months.find((x) =>
        x.label === d.toLocaleDateString("it-IT", { month: "short", year: "2-digit" })
      );
      if (m) m.assegnati++;
    }
    if (a.data_restituzione) {
      const d = new Date(a.data_restituzione);
      const m = months.find((x) =>
        x.label === d.toLocaleDateString("it-IT", { month: "short", year: "2-digit" })
      );
      if (m) m.restituiti++;
    }
  }

  // Stock summary
  const stockOk = dpiRows.filter((d) => (d.quantita_disponibile ?? 0) > 0).length;
  const stockZero = dpiRows.filter((d) => (d.quantita_disponibile ?? 0) <= 0 && (d.quantita_totale ?? 0) > 0).length;
  const stockNoData = dpiRows.filter((d) => (d.quantita_totale ?? 0) === 0).length;

  return Response.json({
    summary: {
      totDpi: dpiRows.length,
      totPersonale: persRows.length,
      totAssegnazioni: assRows.length,
      attivi: assegnati.length,
      restituiti: restituiti.length,
      stockOk,
      stockZero,
      stockNoData,
    },
    topDpi,
    topPersonale,
    months,
  });
}
