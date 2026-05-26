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
  const { action, data_restituzione } = body;

  if (action === "restituisci") {
    const [assignment] = await db
      .select()
      .from(assegnazioni)
      .where(eq(assegnazioni.id, parseInt(id)));

    if (!assignment) return Response.json({ error: "Not found" }, { status: 404 });
    if (assignment.stato === "restituito") {
      return Response.json({ error: "Già restituito" }, { status: 400 });
    }

    // Update assignment
    const [updated] = await db
      .update(assegnazioni)
      .set({
        stato: "restituito",
        data_restituzione: data_restituzione || new Date().toISOString().split("T")[0],
      })
      .where(eq(assegnazioni.id, parseInt(id)))
      .returning();

    // Return stock
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

  // Regular update
  const item = await db
    .update(assegnazioni)
    .set(body)
    .where(eq(assegnazioni.id, parseInt(id)))
    .returning();

  if (!item.length) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(item[0]);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getDb();
  const { id } = await params;

  // Fetch assignment before deleting to restore stock if active
  const [assignment] = await db
    .select()
    .from(assegnazioni)
    .where(eq(assegnazioni.id, parseInt(id)));

  if (!assignment) return Response.json({ error: "Not found" }, { status: 404 });

  // If still active, return stock to DPI
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
