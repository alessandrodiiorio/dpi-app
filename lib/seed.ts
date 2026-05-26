import "dotenv/config";
import * as XLSX from "xlsx";
import path from "path";
import { getDb } from "./db";
import { dpi, personale } from "@/db/schema";

const DPI_DIR = path.join(process.cwd(), "..", "DPI");

async function importDpi() {
  const db = getDb();
  const filePath = path.join(DPI_DIR, "totale DPI.xlsx");
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

  const records = data.map((row) => ({
    codice_articolo: String(row["CODICE ARTICOLO"] || "").trim(),
    descrizione_articolo: String(row["DESCRIZIONE ARTICOLO"] || "").trim(),
    quantita_totale: 0,
    quantita_disponibile: 0,
  }));

  for (const r of records) {
    await db.insert(dpi).values(r).onConflictDoNothing();
  }

  console.log(`Imported ${records.length} DPI records`);
}

async function importPersonale() {
  const db = getDb();
  const filePath = path.join(DPI_DIR, "totale anagrafica.xlsx");
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

  const records = data.map((row) => ({
    cognome: String(row["Cognome utente"] || "").trim(),
    nome: String(row["Nome utente"] || "").trim(),
    id_utente: String(row["ID utente"] || "").trim(),
    matricola: String(row["Matricola Utente"] || "").trim(),
    sede: String(row["Sede"] || "").trim(),
    unita_organizzativa: String(row["Unità Organizzativa (descrizione)"] || "").trim(),
    competence_center: String(row["Competence Center"] || "").trim(),
  }));

  for (const r of records) {
    await db.insert(personale).values(r).onConflictDoNothing();
  }

  console.log(`Imported ${records.length} personale records`);
}

async function main() {
  console.log("Starting seed...");
  await importDpi();
  await importPersonale();
  console.log("Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
