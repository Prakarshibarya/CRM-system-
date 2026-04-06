import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export async function GET(req: Request) {
  // ✅ Validate session first
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  // ✅ organizerId comes from the session-authenticated user's own organizer,
  // not from a client-supplied query param. A user can only see their own leads.
  const organizer = await prisma.organizer.findFirst({
    where: { email: auth.email },
    select: { id: true },
  });

  if (!organizer) {
    return NextResponse.json({ leads: [] });
  }

  const leads = await prisma.lead.findMany({
    where: { organizerId: organizer.id },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ leads });
}

export async function POST(req: Request) {
  // ✅ Validate session first
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);

  if (!body?.title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  // ✅ organizerId resolved server-side from the session user — client cannot supply it
  const organizer = await prisma.organizer.findFirst({
    where: { email: auth.email },
    select: { id: true },
  });

  if (!organizer) {
    return NextResponse.json(
      { error: "No organizer record found for your account." },
      { status: 404 }
    );
  }

  const lead = await prisma.lead.create({
    data: {
      organizerId: organizer.id,
      title: body.title,
      contactName: body.contactName ?? null,
      contactPhone: body.contactPhone ?? null,
      contactEmail: body.contactEmail ?? null,
      notes: body.notes ?? null,
    },
  });

  return NextResponse.json({ lead }, { status: 201 });
}