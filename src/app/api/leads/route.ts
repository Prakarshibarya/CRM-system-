import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const organizerId = searchParams.get("organizerId");

  if (!organizerId) {
    return NextResponse.json({ error: "organizerId is required" }, { status: 400 });
  }

  const leads = await prisma.lead.findMany({
    where: { organizerId },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ leads });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  if (!body?.organizerId || !body?.title) {
    return NextResponse.json(
      { error: "organizerId and title are required" },
      { status: 400 }
    );
  }

  const lead = await prisma.lead.create({
    data: {
      organizerId: body.organizerId,
      title: body.title,
      contactName: body.contactName ?? null,
      contactPhone: body.contactPhone ?? null,
      contactEmail: body.contactEmail ?? null,
      notes: body.notes ?? null,
    },
  });

  return NextResponse.json({ lead }, { status: 201 });
}
