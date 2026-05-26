import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { personale } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getDb();
  const { id } = await params;
  const item = await db.select().from(personale).where(eq(personale.id, parseInt(id)));
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
  const item = await db
    .update(personale)
    .set(body)
    .where(eq(personale.id, parseInt(id)))
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
  await db.delete(personale).where(eq(personale.id, parseInt(id)));
  return Response.json({ success: true });
}
