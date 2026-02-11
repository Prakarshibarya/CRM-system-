import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  if (!body?.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const organizer = await prisma.organizer.create({
    data: {
      // optional: allow passing a custom id for testing
      id: body.id ?? undefined,
      name: body.name,
      email: body.email ?? null,
      phone: body.phone ?? null,
      city: body.city ?? null,
    },
  });

  return NextResponse.json({ organizer }, { status: 201 });
}
