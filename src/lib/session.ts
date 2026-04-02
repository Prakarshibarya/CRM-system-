import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";
import type { SessionUser } from "./auth";

export type AppSession = {
  user?: SessionUser;
};

const sessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: "ha_crm_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export async function getSession(): Promise<IronSession<AppSession>> {
  const cookieStore = await cookies();
  return getIronSession<AppSession>(cookieStore, sessionOptions);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getSession();
  return session.user ?? null;
}