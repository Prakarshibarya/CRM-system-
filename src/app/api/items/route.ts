import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  // ✅ Verify the request is from a logged-in user
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const organizerId = searchParams.get("organizerId");

  // ✅ Ensure the user can only access their own data
  if (!organizerId || organizerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const items = await prisma.crmItem.findMany({
    where: { organizerId },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);

  if (
    !body?.organizerId ||
    !body?.id ||
    !body?.title ||
    !body?.platform ||
    !body?.eventType ||
    !body?.manager
  ) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // ✅ Prevent users from writing to other users' data
  if (body.organizerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ✅ Auto-create Organizer row if this is their first item
  await prisma.organizer.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      name: body.manager ?? "Unknown",
    },
  });

  const item = await prisma.crmItem.create({
    data: {
      id: body.id,
      organizerId: userId,
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
      startDate: body.startDate ?? null,
      endDate: body.endDate ?? null,
      sourceType: body.sourceType ?? null,
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