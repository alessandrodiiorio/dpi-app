import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, hashPassword } from "@/lib/auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getDb();
  const session = await getSession();
  if (!session || session.ruolo !== "admin") {
    return Response.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const { id } = await params;
  const userId = parseInt(id);

  // Prevent deleting yourself
  if (userId === session.id) {
    return Response.json({ error: "Non puoi eliminare il tuo account" }, { status: 400 });
  }

  await db.delete(users).where(eq(users.id, userId));
  return Response.json({ success: true });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getDb();
  const session = await getSession();
  if (!session || session.ruolo !== "admin") {
    return Response.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const { id } = await params;
  const { password, ruolo } = await request.json();

  const updateData: Record<string, unknown> = {};
  if (password) {
    updateData.password_hash = await hashPassword(password);
  }
  if (ruolo) {
    updateData.ruolo = ruolo;
  }

  if (Object.keys(updateData).length === 0) {
    return Response.json({ error: "Nessun dato da aggiornare" }, { status: 400 });
  }

  const [updated] = await db.update(users)
    .set(updateData)
    .where(eq(users.id, parseInt(id)))
    .returning({ id: users.id, username: users.username, ruolo: users.ruolo });

  if (!updated) {
    return Response.json({ error: "Utente non trovato" }, { status: 404 });
  }

  return Response.json(updated);
}
