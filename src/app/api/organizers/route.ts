import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export async function POST(req: Request) {
  // ✅ Only admins can create organizer records
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);

  if (!body?.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const organizer = await prisma.organizer.create({
    data: {
      name: body.name,
      email: body.email ?? null,
      phone: body.phone ?? null,
      city: body.city ?? null,
    },
  });

  return NextResponse.json({ organizer }, { status: 201 });
}