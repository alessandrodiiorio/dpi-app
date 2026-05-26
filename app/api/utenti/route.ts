import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, hashPassword } from "@/lib/auth";

export async function GET() {
  const db = getDb();
  const session = await getSession();
  if (!session || session.ruolo !== "admin") {
    return Response.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const items = await db.select({
    id: users.id,
    username: users.username,
    ruolo: users.ruolo,
  }).from(users).orderBy(users.username);

  return Response.json(items);
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const session = await getSession();
  if (!session || session.ruolo !== "admin") {
    return Response.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const { username, password, ruolo } = await request.json();

  if (!username || !password) {
    return Response.json({ error: "Username e password richiesti" }, { status: 400 });
  }

  const existing = await db.select().from(users).where(eq(users.username, username));
  if (existing.length > 0) {
    return Response.json({ error: "Username già esistente" }, { status: 409 });
  }

  const password_hash = await hashPassword(password);
  const [user] = await db.insert(users).values({
    username,
    password_hash,
    ruolo: ruolo || "operatore",
  }).returning({ id: users.id, username: users.username, ruolo: users.ruolo });

  return Response.json(user, { status: 201 });
}
