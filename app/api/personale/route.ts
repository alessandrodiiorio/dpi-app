import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { personale, assegnazioni } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const db = getDb();
  const [persItems, assRows] = await Promise.all([
    db.select().from(personale).orderBy(personale.cognome),
    db.select({ personale_id: assegnazioni.personale_id })
      .from(assegnazioni)
      .where(eq(assegnazioni.stato, "assegnato")),
  ]);

  const assignedMap = new Map<number, number>();
  for (const a of assRows) {
    if (a.personale_id != null) {
      assignedMap.set(a.personale_id, (assignedMap.get(a.personale_id) || 0) + 1);
    }
  }

  const items = persItems.map((p) => ({
    ...p,
    assegnato: assignedMap.get(p.id) || 0,
  }));

  return Response.json(items);
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();
  const item = await db.insert(personale).values(body).returning();
  return Response.json({ ...item[0], assegnato: 0 }, { status: 201 });
}
