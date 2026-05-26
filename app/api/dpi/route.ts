import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { dpi, assegnazioni } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const db = getDb();
  const [dpiItems, assRows] = await Promise.all([
    db.select().from(dpi).orderBy(dpi.codice_articolo),
    db.select({ dpi_id: assegnazioni.dpi_id, quantita: assegnazioni.quantita })
      .from(assegnazioni)
      .where(eq(assegnazioni.stato, "assegnato")),
  ]);

  const assignedMap = new Map<number, number>();
  for (const a of assRows) {
    if (a.dpi_id != null) {
      assignedMap.set(a.dpi_id, (assignedMap.get(a.dpi_id) || 0) + (a.quantita ?? 0));
    }
  }

  const items = dpiItems.map((item) => ({
    ...item,
    assegnato: assignedMap.get(item.id) || 0,
  }));

  return Response.json(items);
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();
  const item = await db.insert(dpi).values(body).returning();
  return Response.json({ ...item[0], assegnato: 0 }, { status: 201 });
}
