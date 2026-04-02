import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET(req: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await prisma.crmItem.findMany({
    where: { userId: sessionUser.id },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);

  if (
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

  const item = await prisma.crmItem.create({
    data: {
      id: body.id,
      userId: sessionUser.id,
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