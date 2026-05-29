import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { assegnazioni, dpi } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getDb();
  const { id } = await params;
  const item = await db
    .select()
    .from(assegnazioni)
    .where(eq(assegnazioni.id, parseInt(id)));
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
  const { action, data_restituzione, ...fields } = body;

  if (action === "restituisci") {
    const [assignment] = await db
      .select()
      .from(assegnazioni)
      .where(eq(assegnazioni.id, parseInt(id)));

    if (!assignment) return Response.json({ error: "Not found" }, { status: 404 });
    if (assignment.stato === "restituito") {
      return Response.json({ error: "Già restituito" }, { status: 400 });
    }

    const [updated] = await db
      .update(assegnazioni)
      .set({
        stato: "restituito",
        data_restituzione: data_restituzione || new Date().toISOString().split("T")[0],
      })
      .where(eq(assegnazioni.id, parseInt(id)))
      .returning();

    if (assignment.dpi_id != null) {
      const [dpiItem] = await db
        .select()
        .from(dpi)
        .where(eq(dpi.id, assignment.dpi_id));
      if (dpiItem) {
        await db
          .update(dpi)
          .set({ quantita_disponibile: (dpiItem.quantita_disponibile ?? 0) + (assignment.quantita ?? 0) })
          .where(eq(dpi.id, assignment.dpi_id));
      }
    }

    return Response.json(updated);
  }

  // Regular update with stock adjustment
  const [old] = await db
    .select()
    .from(assegnazioni)
    .where(eq(assegnazioni.id, parseInt(id)));

  if (!old) return Response.json({ error: "Not found" }, { status: 404 });

  const newQty = fields.quantita !== undefined ? fields.quantita : old.quantita;

  // Stock adjustment for active assignments when quantity changes
  if (old.stato === "assegnato" && fields.quantita !== undefined) {
    const dpiId = old.dpi_id;
    if (dpiId != null) {
      const [dpiItem] = await db.select().from(dpi).where(eq(dpi.id, dpiId));
      if (dpiItem) {
        const diff = (fields.quantita ?? 0) - (old.quantita ?? 0);
        if (diff !== 0) {
          const newStock = (dpiItem.quantita_disponibile ?? 0) - diff;
          await db
            .update(dpi)
            .set({ quantita_disponibile: Math.max(0, newStock) })
            .where(eq(dpi.id, dpiId));
        }
      }
    }
  }

  const updateData: Record<string, unknown> = {};
  if (fields.quantita !== undefined) updateData.quantita = fields.quantita;
  if (fields.data_assegnazione !== undefined) updateData.data_assegnazione = fields.data_assegnazione;
  if (fields.data_restituzione !== undefined) updateData.data_restituzione = fields.data_restituzione;
  if (fields.note !== undefined) updateData.note = fields.note;
  if (fields.stato !== undefined) updateData.stato = fields.stato;

  if (Object.keys(updateData).length === 0) {
    return Response.json(old);
  }

  const [item] = await db
    .update(assegnazioni)
    .set(updateData)
    .where(eq(assegnazioni.id, parseInt(id)))
    .returning();

  return Response.json(item);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getDb();
  const { id } = await params;

  const [assignment] = await db
    .select()
    .from(assegnazioni)
    .where(eq(assegnazioni.id, parseInt(id)));

  if (!assignment) return Response.json({ error: "Not found" }, { status: 404 });

  if (assignment.stato === "assegnato" && assignment.dpi_id != null) {
    const [dpiItem] = await db
      .select()
      .from(dpi)
      .where(eq(dpi.id, assignment.dpi_id));
    if (dpiItem) {
      await db
        .update(dpi)
        .set({ quantita_disponibile: (dpiItem.quantita_disponibile ?? 0) + (assignment.quantita ?? 0) })
        .where(eq(dpi.id, assignment.dpi_id));
    }
  }

  await db.delete(assegnazioni).where(eq(assegnazioni.id, parseInt(id)));
  return Response.json({ success: true });
}
