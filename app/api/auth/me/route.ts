import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Non autenticato" }, { status: 401 });
  }
  return Response.json({ username: session.username, ruolo: session.ruolo });
}
