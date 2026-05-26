import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { dpi } from "@/db/schema";

export async function GET() {
  const db = getDb();
  const items = await db.select().from(dpi).orderBy(dpi.codice_articolo);
  return Response.json(items);
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();
  const item = await db.insert(dpi).values(body).returning();
  return Response.json(item[0], { status: 201 });
}
