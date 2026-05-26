import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { assegnazioni, dpi, personale } from "@/db/schema";
import { eq, and, gte, lte, SQL } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = request.nextUrl;
  const stato = searchParams.get("stato");
  const personaleId = searchParams.get("personale_id");
  const dpiId = searchParams.get("dpi_id");
  const dataDa = searchParams.get("data_da");
  const dataA = searchParams.get("data_a");

  const conditions: SQL[] = [];
  if (stato) conditions.push(eq(assegnazioni.stato, stato as "assegnato" | "restituito"));
  if (personaleId) conditions.push(eq(assegnazioni.personale_id, parseInt(personaleId)));
  if (dpiId) conditions.push(eq(assegnazioni.dpi_id, parseInt(dpiId)));
  if (dataDa) conditions.push(gte(assegnazioni.data_assegnazione, dataDa));
  if (dataA) conditions.push(lte(assegnazioni.data_assegnazione, dataA));

  const items = await db
    .select({
      id: assegnazioni.id,
      dpi_id: assegnazioni.dpi_id,
      personale_id: assegnazioni.personale_id,
      quantita: assegnazioni.quantita,
      data_assegnazione: assegnazioni.data_assegnazione,
      data_restituzione: assegnazioni.data_restituzione,
      note: assegnazioni.note,
      stato: assegnazioni.stato,
      dpi_codice: dpi.codice_articolo,
      dpi_descrizione: dpi.descrizione_articolo,
      personale_cognome: personale.cognome,
      personale_nome: personale.nome,
    })
    .from(assegnazioni)
    .leftJoin(dpi, eq(assegnazioni.dpi_id, dpi.id))
    .leftJoin(personale, eq(assegnazioni.personale_id, personale.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(assegnazioni.data_assegnazione);

  return Response.json(items);
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();
  const { dpi_id, personale_id, quantita = 1, data_assegnazione, note } = body;

  // Verify DPI exists
  const [dpiItem] = await db.select().from(dpi).where(eq(dpi.id, dpi_id));
  if (!dpiItem) {
    return Response.json({ error: "DPI not found" }, { status: 404 });
  }

  // Create assignment and update stock
  const item = await db
    .insert(assegnazioni)
    .values({
      dpi_id,
      personale_id,
      quantita,
      data_assegnazione,
      note,
      stato: "assegnato",
    })
    .returning();

  const disponibile = dpiItem.quantita_disponibile ?? 0;
  await db
    .update(dpi)
    .set({ quantita_disponibile: disponibile - quantita })
    .where(eq(dpi.id, dpi_id));

  return Response.json(item[0], { status: 201 });
}
