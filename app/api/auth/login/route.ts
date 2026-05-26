import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createToken, setAuthCookie, verifyPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const db = getDb();
  const { username, password } = await request.json();

  if (!username || !password) {
    return Response.json({ error: "Username e password richiesti" }, { status: 400 });
  }

  const [user] = await db.select().from(users).where(eq(users.username, username));

  if (!user) {
    return Response.json({ error: "Credenziali non valide" }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return Response.json({ error: "Credenziali non valide" }, { status: 401 });
  }

  const token = await createToken({
    id: user.id,
    username: user.username,
    ruolo: user.ruolo,
  });

  return Response.json(
    { success: true, user: { username: user.username, ruolo: user.ruolo } },
    {
      status: 200,
      headers: { "Set-Cookie": setAuthCookie(token) },
    }
  );
}
