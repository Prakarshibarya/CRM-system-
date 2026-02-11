import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const organizerId = searchParams.get("organizerId");

  if (!organizerId) {
    return NextResponse.json({ error: "organizerId is required" }, { status: 400 });
  }

  const items = await prisma.crmItem.findMany({
    where: { organizerId },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  // minimal required fields
  if (!body?.organizerId || !body?.id || !body?.title || !body?.platform || !body?.eventType || !body?.manager) {
    return NextResponse.json(
      { error: "Missing required fields: organizerId, id, title, platform, eventType, manager" },
      { status: 400 }
    );
  }

  const item = await prisma.crmItem.create({
    data: {
      id: body.id,
      organizerId: body.organizerId,
      title: body.title,
      platform: body.platform,
      eventType: body.eventType,
      manager: body.manager,
      stage: body.stage ?? "ONBOARDING",

      orgName: body.orgName ?? null,
      eventName: body.eventName ?? null,
      city: body.city ?? null,
      venue: body.venue ?? null,
      eventLink: body.eventLink ?? null,

      disabled: body.disabled ?? false,
      disabledReason: body.disabledReason ?? null,
      disabledAt: body.disabledAt ? new Date(body.disabledAt) : null,

      onboarding: body.onboarding ?? {},
      active: body.active ?? {},
      activity: body.activity ?? [],
    },
  });

  return NextResponse.json({ item }, { status: 201 });
}
