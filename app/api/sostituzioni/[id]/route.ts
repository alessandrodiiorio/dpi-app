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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getDb();
  const { id } = await params;
  const body = await request.json();
  const { data_sostituzione, note, quantita, nuovo_dpi_id } = body;

  const [record] = await db
    .select()
    .from(sostituzioni)
    .where(eq(sostituzioni.id, parseInt(id)));

  if (!record) return Response.json({ error: "Not found" }, { status: 404 });

  // Handle quantity change on the new assignment
  if (quantita !== undefined && quantita !== record.quantita && record.nuova_assegnazione_id) {
    const [newAss] = await db
      .select()
      .from(assegnazioni)
      .where(eq(assegnazioni.id, record.nuova_assegnazione_id));

    if (newAss && newAss.stato === "assegnato") {
      const dpiId = record.nuovo_dpi_id;
      if (dpiId != null) {
        const [dpiItem] = await db.select().from(dpi).where(eq(dpi.id, dpiId));
        if (dpiItem) {
          const diff = quantita - (record.quantita ?? 0);
          const newStock = (dpiItem.quantita_disponibile ?? 0) - diff;
          await db
            .update(dpi)
            .set({ quantita_disponibile: Math.max(0, newStock) })
            .where(eq(dpi.id, dpiId));
        }
      }
      // Update the new assignment quantity
      await db
        .update(assegnazioni)
        .set({ quantita })
        .where(eq(assegnazioni.id, record.nuova_assegnazione_id));
    }
  }

  // Handle DPI change on replacement
  if (nuovo_dpi_id !== undefined && nuovo_dpi_id !== record.nuovo_dpi_id && record.nuova_assegnazione_id) {
    // Return stock to old replacement DPI
    const oldDpiId = record.nuovo_dpi_id;
    if (oldDpiId != null) {
      const [oldDpi] = await db.select().from(dpi).where(eq(dpi.id, oldDpiId));
      if (oldDpi) {
        await db
          .update(dpi)
          .set({ quantita_disponibile: (oldDpi.quantita_disponibile ?? 0) + (record.quantita ?? 0) })
          .where(eq(dpi.id, oldDpiId));
      }
    }
    // Deduct stock from new DPI
    const [newDpiItem] = await db.select().from(dpi).where(eq(dpi.id, nuovo_dpi_id));
    if (newDpiItem) {
      await db
        .update(dpi)
        .set({ quantita_disponibile: (newDpiItem.quantita_disponibile ?? 0) - (quantita ?? record.quantita ?? 0) })
        .where(eq(dpi.id, nuovo_dpi_id));
    }
    // Update the assignment with new DPI
    await db
      .update(assegnazioni)
      .set({ dpi_id: nuovo_dpi_id })
      .where(eq(assegnazioni.id, record.nuova_assegnazione_id));
  }

  // Update sostituzione record
  const updateData: Record<string, unknown> = {};
  if (data_sostituzione !== undefined) updateData.data_sostituzione = data_sostituzione;
  if (note !== undefined) updateData.note = note;
  if (quantita !== undefined) updateData.quantita = quantita;
  if (nuovo_dpi_id !== undefined) updateData.nuovo_dpi_id = nuovo_dpi_id;

  if (Object.keys(updateData).length === 0) return Response.json(record);

  const [updated] = await db
    .update(sostituzioni)
    .set(updateData)
    .where(eq(sostituzioni.id, parseInt(id)))
    .returning();

  return Response.json(updated);
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
