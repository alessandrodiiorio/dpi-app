import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { sostituzioni, assegnazioni, dpi } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getDb();
  const { id } = await params;
  const item = await db
    .select()
    .from(sostituzioni)
    .where(eq(sostituzioni.id, parseInt(id)));
  if (!item.length) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(item[0]);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getDb();
  const { id } = await params;

  const [record] = await db
    .select()
    .from(sostituzioni)
    .where(eq(sostituzioni.id, parseInt(id)));

  if (!record) return Response.json({ error: "Not found" }, { status: 404 });

  // Undo: delete the new assignment (restore stock)
  if (record.nuova_assegnazione_id) {
    const [newAss] = await db
      .select()
      .from(assegnazioni)
      .where(eq(assegnazioni.id, record.nuova_assegnazione_id));

    if (newAss && newAss.stato === "assegnato") {
      // Restore new DPI stock
      if (newAss.dpi_id != null) {
        const [dpiItem] = await db.select().from(dpi).where(eq(dpi.id, newAss.dpi_id));
        if (dpiItem) {
          await db
            .update(dpi)
            .set({ quantita_disponibile: (dpiItem.quantita_disponibile ?? 0) + (newAss.quantita ?? 0) })
            .where(eq(dpi.id, newAss.dpi_id));
        }
      }
      await db.delete(assegnazioni).where(eq(assegnazioni.id, record.nuova_assegnazione_id));
    }
  }

  // Undo: restore old assignment to "assegnato" and reduce old DPI stock back
  if (record.vecchia_assegnazione_id) {
    const [oldAss] = await db
      .select()
      .from(assegnazioni)
      .where(eq(assegnazioni.id, record.vecchia_assegnazione_id));

    if (oldAss) {
      await db
        .update(assegnazioni)
        .set({ stato: "assegnato", data_restituzione: null })
        .where(eq(assegnazioni.id, record.vecchia_assegnazione_id));

      // Re-deduct old DPI stock
      if (oldAss.dpi_id != null) {
        const [oldDpi] = await db.select().from(dpi).where(eq(dpi.id, oldAss.dpi_id));
        if (oldDpi) {
          const newStock = Math.max(0, (oldDpi.quantita_disponibile ?? 0) - (oldAss.quantita ?? 0));
          await db
            .update(dpi)
            .set({ quantita_disponibile: newStock })
            .where(eq(dpi.id, oldAss.dpi_id));
        }
      }
    }
  }

  await db.delete(sostituzioni).where(eq(sostituzioni.id, parseInt(id)));
  return Response.json({ success: true });
}
