import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dpi-app-secret-change-in-production"
);
const COOKIE_NAME = "dpi-auth-token";

async function verifyAuth(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth for login page and auth API
  if (pathname === "/login" || pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const isValid = token ? await verifyAuth(token) : false;

  // API routes: return 401
  if (pathname.startsWith("/api/")) {
    if (!isValid) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Page routes: redirect to login
  if (!isValid) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
