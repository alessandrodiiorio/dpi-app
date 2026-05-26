import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { dpi } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getDb();
  const { id } = await params;
  const item = await db.select().from(dpi).where(eq(dpi.id, parseInt(id)));
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
    .update(dpi)
    .set(body)
    .where(eq(dpi.id, parseInt(id)))
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
  await db.delete(dpi).where(eq(dpi.id, parseInt(id)));
  return Response.json({ success: true });
}
