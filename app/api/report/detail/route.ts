import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { dpi, personale, assegnazioni, sostituzioni } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type");

  switch (type) {
    case "dpi": {
      const rows = await db.select().from(dpi).orderBy(dpi.codice_articolo);
      return Response.json(rows);
    }
    case "personale": {
      const rows = await db.select().from(personale).orderBy(personale.cognome);
      return Response.json(rows);
    }
    case "assegnazioni": {
      const rows = await db
        .select({
          id: assegnazioni.id,
          quantita: assegnazioni.quantita,
          data_assegnazione: assegnazioni.data_assegnazione,
          data_restituzione: assegnazioni.data_restituzione,
          stato: assegnazioni.stato,
          note: assegnazioni.note,
          dpi_codice: dpi.codice_articolo,
          dpi_descrizione: dpi.descrizione_articolo,
          personale_cognome: personale.cognome,
          personale_nome: personale.nome,
        })
        .from(assegnazioni)
        .leftJoin(dpi, eq(assegnazioni.dpi_id, dpi.id))
        .leftJoin(personale, eq(assegnazioni.personale_id, personale.id))
        .orderBy(assegnazioni.data_assegnazione);
      return Response.json(rows);
    }
    case "attivi": {
      const rows = await db
        .select({
          id: assegnazioni.id,
          quantita: assegnazioni.quantita,
          data_assegnazione: assegnazioni.data_assegnazione,
          note: assegnazioni.note,
          dpi_codice: dpi.codice_articolo,
          dpi_descrizione: dpi.descrizione_articolo,
          personale_cognome: personale.cognome,
          personale_nome: personale.nome,
        })
        .from(assegnazioni)
        .leftJoin(dpi, eq(assegnazioni.dpi_id, dpi.id))
        .leftJoin(personale, eq(assegnazioni.personale_id, personale.id))
        .where(eq(assegnazioni.stato, "assegnato"))
        .orderBy(assegnazioni.data_assegnazione);
      return Response.json(rows);
    }
    case "restituiti": {
      const rows = await db
        .select({
          id: assegnazioni.id,
          quantita: assegnazioni.quantita,
          data_assegnazione: assegnazioni.data_assegnazione,
          data_restituzione: assegnazioni.data_restituzione,
          note: assegnazioni.note,
          dpi_codice: dpi.codice_articolo,
          dpi_descrizione: dpi.descrizione_articolo,
          personale_cognome: personale.cognome,
          personale_nome: personale.nome,
        })
        .from(assegnazioni)
        .leftJoin(dpi, eq(assegnazioni.dpi_id, dpi.id))
        .leftJoin(personale, eq(assegnazioni.personale_id, personale.id))
        .where(eq(assegnazioni.stato, "restituito"))
        .orderBy(assegnazioni.data_restituzione);
      return Response.json(rows);
    }
    case "sostituzioni": {
      const rows = await db
        .select({
          id: sostituzioni.id,
          personale_cognome: personale.cognome,
          personale_nome: personale.nome,
          quantita: sostituzioni.quantita,
          data_sostituzione: sostituzioni.data_sostituzione,
          note: sostituzioni.note,
        })
        .from(sostituzioni)
        .leftJoin(personale, eq(sostituzioni.personale_id, personale.id))
        .orderBy(sostituzioni.data_sostituzione);
      return Response.json(rows);
    }
    case "stock-ok": {
      const all = await db.select().from(dpi).orderBy(dpi.codice_articolo);
      return Response.json(all.filter((d) => (d.quantita_disponibile ?? 0) > 0));
    }
    case "stock-zero": {
      const all = await db.select().from(dpi).orderBy(dpi.codice_articolo);
      return Response.json(
        all.filter((d) => (d.quantita_disponibile ?? 0) <= 0 && (d.quantita_totale ?? 0) > 0)
      );
    }
    case "stock-nodata": {
      const all = await db.select().from(dpi).orderBy(dpi.codice_articolo);
      return Response.json(all.filter((d) => (d.quantita_totale ?? 0) === 0));
    }
    case "dpi-assegnazioni": {
      const dpiId = searchParams.get("dpi_id");
      if (!dpiId) return Response.json({ error: "dpi_id required" }, { status: 400 });
      const rows = await db
        .select({
          id: assegnazioni.id,
          quantita: assegnazioni.quantita,
          data_assegnazione: assegnazioni.data_assegnazione,
          data_restituzione: assegnazioni.data_restituzione,
          stato: assegnazioni.stato,
          note: assegnazioni.note,
          personale_cognome: personale.cognome,
          personale_nome: personale.nome,
        })
        .from(assegnazioni)
        .leftJoin(personale, eq(assegnazioni.personale_id, personale.id))
        .where(eq(assegnazioni.dpi_id, parseInt(dpiId)))
        .orderBy(assegnazioni.data_assegnazione);
      return Response.json(rows);
    }
    case "personale-assegnazioni": {
      const personaId = searchParams.get("personale_id");
      if (!personaId) return Response.json({ error: "personale_id required" }, { status: 400 });
      const rows = await db
        .select({
          id: assegnazioni.id,
          quantita: assegnazioni.quantita,
          data_assegnazione: assegnazioni.data_assegnazione,
          data_restituzione: assegnazioni.data_restituzione,
          stato: assegnazioni.stato,
          note: assegnazioni.note,
          dpi_codice: dpi.codice_articolo,
          dpi_descrizione: dpi.descrizione_articolo,
        })
        .from(assegnazioni)
        .leftJoin(dpi, eq(assegnazioni.dpi_id, dpi.id))
        .where(eq(assegnazioni.personale_id, parseInt(personaId)))
        .orderBy(assegnazioni.data_assegnazione);
      return Response.json(rows);
    }
    default:
      return Response.json({ error: "Unknown detail type" }, { status: 400 });
  }
}
