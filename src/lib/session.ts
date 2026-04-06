/**
 * Continuous session validation via sessionVersion.
 *
 * Problem: iron-session cookies are self-contained. Once issued, they remain
 * valid until they expire — even if you reject the user, reset their password,
 * or want to force them out. There's no server-side "invalidate this session."
 *
 * Fix: store a `sessionVersion` integer on the User row. When the session is
 * created at login, we seal the current version into the cookie. On every
 * subsequent request, requireAuth() fetches the current version from the DB
 * and compares. If they don't match (because you incremented it server-side),
 * the session is rejected immediately.
 *
 * To force any user out: prisma.user.update({ where: { id }, data: { sessionVersion: { increment: 1 } } })
 * This invalidates all existing sessions for that user instantly.
 */

import { NextResponse } from "next/server";
import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export type SessionUser = {
  id: string;
  email: string;
  name?: string;
  role: string;
  status: string;
  sessionVersion: number; // ✅ sealed into the cookie at login
};

export type AppSession = IronSession<{ user?: SessionUser }>;

const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET as string,
  cookieName: "ha_crm_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 8, // 8 hours — sessions expire automatically
  },
};

export async function getSession(): Promise<AppSession> {
  const cookieStore = await cookies();
  return getIronSession<{ user?: SessionUser }>(cookieStore, SESSION_OPTIONS);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const session = await getSession();
    return session.user ?? null;
  } catch {
    return null;
  }
}

/**
 * requireAuth()
 *
 * Called at the top of every protected route. Does three things:
 * 1. Decrypts and verifies the iron-session cookie signature
 * 2. Checks user.status === "approved" from the cookie
 * 3. Fetches the current sessionVersion from the DB and compares to the cookie
 *    — this is the continuous validation step that catches force-logouts
 */
export async function requireAuth(): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.status !== "approved") {
    return NextResponse.json(
      { error: "Your account is not approved." },
      { status: 403 }
    );
  }

  // ✅ Continuous validation: check the DB to confirm this session is still valid.
  // This runs on every authenticated request and catches:
  //   - Users who were rejected after logging in
  //   - Force-logout (sessionVersion incremented server-side)
  //   - Password resets (should also increment sessionVersion)
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { status: true, sessionVersion: true },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // User was approved when they logged in but has since been rejected/suspended
  if (dbUser.status !== "approved") {
    return NextResponse.json(
      { error: "Your account is not approved." },
      { status: 403 }
    );
  }

  // Session was invalidated server-side (password change, force logout, etc.)
  if (dbUser.sessionVersion !== user.sessionVersion) {
    return NextResponse.json(
      { error: "Session expired. Please log in again." },
      { status: 401 }
    );
  }

  return user;
}

export async function requireAdmin(): Promise<SessionUser | NextResponse> {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  if (authResult.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return authResult;
}