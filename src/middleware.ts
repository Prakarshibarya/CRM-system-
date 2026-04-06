import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getIronSession } from "iron-session";

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/me",
];

const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET as string,
  cookieName: "ha_crm_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
  },
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // ✅ API routes must return 401 JSON, not a redirect.
  // Redirecting an API call causes the browser/fetch to silently follow
  // the redirect and return the login page HTML with a 200 — which breaks
  // all API clients and makes auth failures invisible to callers.
  const isApiRoute = pathname.startsWith("/api/");

  const res = NextResponse.next();

  try {
    const session = await getIronSession<{
      user?: { id: string; status: string; sessionVersion: number };
    }>(req, res, SESSION_OPTIONS);

    if (!session.user?.id) {
      if (isApiRoute) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (session.user.status !== "approved") {
      if (isApiRoute) {
        return NextResponse.json({ error: "Your account is not approved." }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/login", req.url));
    }

  } catch {
    // Cookie decryption failed — forged or tampered cookie
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\..*).*)"],
};