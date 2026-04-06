import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

// ✅ Rate limit: max 5 signup attempts per IP per hour.
// Prevents scripted queue-flooding and slows email enumeration.
const signupRateLimit = new Map<string, { count: number; resetAt: number }>();
const MAX_SIGNUPS_PER_HOUR = 5;

function checkSignupRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = signupRateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    signupRateLimit.set(ip, { count: 1, resetAt: now + 3_600_000 });
    return true;
  }
  if (entry.count >= MAX_SIGNUPS_PER_HOUR) return false;
  entry.count++;
  return true;
}

export async function POST(req: Request) {
  try {
    // ✅ Rate limit by IP
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    if (!checkSignupRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);

    if (!body?.email || !body?.password || !body?.name) {
      return NextResponse.json(
        { error: "Name, email and password are required." },
        { status: 400 }
      );
    }

    const email = String(body.email).trim().toLowerCase();
    const password = String(body.password);
    const name = String(body.name).trim();

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });

    // ✅ Always hash the password before responding, even if the email already exists.
    // This keeps response time constant so an attacker cannot enumerate valid emails
    // by measuring whether the response was fast (email found, early return) or slow
    // (email not found, bcrypt ran). Both paths now take the same time.
    const passwordHash = await hashPassword(password);

    if (existing) {
      // Return the same success message — do not reveal that the email exists
      return NextResponse.json({
        ok: true,
        message:
          "Account created. Please wait for admin approval before logging in.",
      });
    }

    await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        status: "pending",
        role: "user",
      },
    });

    return NextResponse.json({
      ok: true,
      message:
        "Account created. Please wait for admin approval before logging in.",
    });
  } catch (err: any) {
    console.error("Signup error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}