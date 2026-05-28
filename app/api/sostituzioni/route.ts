import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { sostituzioni, assegnazioni, dpi, personale } from "@/db/schema";
import { eq, and, gte, lte, SQL, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = request.nextUrl;
  const personaleId = searchParams.get("personale_id");
  const dpiId = searchParams.get("dpi_id");
  const dataDa = searchParams.get("data_da");
  const dataA = searchParams.get("data_a");

  const conditions: SQL[] = [];
  if (personaleId) conditions.push(eq(sostituzioni.personale_id, parseInt(personaleId)));
  if (dataDa) conditions.push(gte(sostituzioni.data_sostituzione, dataDa));
  if (dataA) conditions.push(lte(sostituzioni.data_sostituzione, dataA));

  const items = await db
    .select({
      id: sostituzioni.id,
      personale_id: sostituzioni.personale_id,
      vecchia_assegnazione_id: sostituzioni.vecchia_assegnazione_id,
      nuovo_dpi_id: sostituzioni.nuovo_dpi_id,
      nuova_assegnazione_id: sostituzioni.nuova_assegnazione_id,
      quantita: sostituzioni.quantita,
      data_sostituzione: sostituzioni.data_sostituzione,
      note: sostituzioni.note,
      personale_cognome: personale.cognome,
      personale_nome: personale.nome,
    })
    .from(sostituzioni)
    .leftJoin(personale, eq(sostituzioni.personale_id, personale.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(sostituzioni.data_sostituzione));

  // Enrich with old DPI info from vecchia_assegnazione
  const enriched = await Promise.all(
    items.map(async (s) => {
      let vecchioDpiCodice = "-";
      let vecchioDpiDescrizione = "-";
      let nuovoDpiCodice = "-";
      let nuovoDpiDescrizione = "-";

      if (s.vecchia_assegnazione_id) {
        const [oldAss] = await db
          .select({ dpi_codice: dpi.codice_articolo, dpi_descrizione: dpi.descrizione_articolo })
          .from(assegnazioni)
          .leftJoin(dpi, eq(assegnazioni.dpi_id, dpi.id))
          .where(eq(assegnazioni.id, s.vecchia_assegnazione_id));
        if (oldAss) {
          vecchioDpiCodice = oldAss.dpi_codice ?? "-";
          vecchioDpiDescrizione = oldAss.dpi_descrizione ?? "-";
        }
      }

      if (s.nuovo_dpi_id) {
        const [newDpiItem] = await db
          .select({ codice: dpi.codice_articolo, descrizione: dpi.descrizione_articolo })
          .from(dpi)
          .where(eq(dpi.id, s.nuovo_dpi_id));
        if (newDpiItem) {
          nuovoDpiCodice = newDpiItem.codice ?? "-";
          nuovoDpiDescrizione = newDpiItem.descrizione ?? "-";
        }
      }

      return { ...s, vecchio_dpi_codice: vecchioDpiCodice, vecchio_dpi_descrizione: vecchioDpiDescrizione, nuovo_dpi_codice: nuovoDpiCodice, nuovo_dpi_descrizione: nuovoDpiDescrizione };
    })
  );

  return Response.json(enriched);
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();
  const { personale_id, vecchia_assegnazione_id, nuovo_dpi_id, quantita = 1, data_sostituzione, note } = body;

  // 1. Demolish old assignment
  const [oldAss] = await db
    .select()
    .from(assegnazioni)
    .where(eq(assegnazioni.id, vecchia_assegnazione_id));

  if (!oldAss) return Response.json({ error: "Vecchia assegnazione non trovata" }, { status: 404 });
  if (oldAss.stato === "restituito") return Response.json({ error: "Già demolita" }, { status: 400 });

  await db
    .update(assegnazioni)
    .set({ stato: "restituito", data_restituzione: data_sostituzione })
    .where(eq(assegnazioni.id, vecchia_assegnazione_id));

  // Return old DPI stock
  if (oldAss.dpi_id != null) {
    const [oldDpi] = await db.select().from(dpi).where(eq(dpi.id, oldAss.dpi_id));
    if (oldDpi) {
      await db
        .update(dpi)
        .set({ quantita_disponibile: (oldDpi.quantita_disponibile ?? 0) + (oldAss.quantita ?? 0) })
        .where(eq(dpi.id, oldAss.dpi_id));
    }
  }

  // 2. Check new DPI availability
  const [newDpi] = await db.select().from(dpi).where(eq(dpi.id, nuovo_dpi_id));
  if (!newDpi) return Response.json({ error: "Nuovo DPI non trovato" }, { status: 404 });
  if ((newDpi.quantita_disponibile ?? 0) < quantita) {
    return Response.json({ error: "Stock insufficiente per il nuovo DPI" }, { status: 400 });
  }

  // 3. Create new assignment
  const [newAss] = await db
    .insert(assegnazioni)
    .values({
      dpi_id: nuovo_dpi_id,
      personale_id,
      quantita,
      data_assegnazione: data_sostituzione,
      note: note || `Sostituzione da #${vecchia_assegnazione_id}`,
      stato: "assegnato",
    })
    .returning();

  // Reduce new DPI stock
  await db
    .update(dpi)
    .set({ quantita_disponibile: (newDpi.quantita_disponibile ?? 0) - quantita })
    .where(eq(dpi.id, nuovo_dpi_id));

  // 4. Insert sostituzione record
  const [record] = await db
    .insert(sostituzioni)
    .values({
      personale_id,
      vecchia_assegnazione_id,
      nuovo_dpi_id,
      nuova_assegnazione_id: newAss.id,
      quantita,
      data_sostituzione,
      note,
    })
    .returning();

  return Response.json(record, { status: 201 });
}
