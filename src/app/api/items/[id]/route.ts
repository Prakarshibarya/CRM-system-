import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const data: any = {};

    // simple fields
    if (typeof body.title === "string") data.title = body.title;
    if (typeof body.platform === "string") data.platform = body.platform;
    if (typeof body.eventType === "string") data.eventType = body.eventType;
    if (typeof body.manager === "string") data.manager = body.manager;
    if (typeof body.stage === "string") data.stage = body.stage;

    // nullable strings
    if (body.orgName === null || typeof body.orgName === "string") data.orgName = body.orgName;
    if (body.eventName === null || typeof body.eventName === "string") data.eventName = body.eventName;
    if (body.city === null || typeof body.city === "string") data.city = body.city;
    if (body.venue === null || typeof body.venue === "string") data.venue = body.venue;
    if (body.eventLink === null || typeof body.eventLink === "string") data.eventLink = body.eventLink;

    // disable logic
    if (typeof body.disabled === "boolean") data.disabled = body.disabled;
    if (body.disabledReason === null || typeof body.disabledReason === "string")
      data.disabledReason = body.disabledReason;

    if (body.disabledAt === null) {
      data.disabledAt = null;
    } else if (typeof body.disabledAt === "string") {
      data.disabledAt = new Date(body.disabledAt);
    }

    // JSON blobs
    if (body.onboarding !== undefined) data.onboarding = body.onboarding;
    if (body.active !== undefined) data.active = body.active;
    if (body.activity !== undefined) data.activity = body.activity;

    const updated = await prisma.crmItem.update({
      where: { id },
      data,
    });

    return NextResponse.json({ item: updated });
  } catch (err: any) {
    console.error("PATCH /api/items/[id] failed:", err);

    return NextResponse.json(
      {
        error: err?.message ?? "Unknown error",
        name: err?.name,
        code: err?.code,
      },
      { status: 500 }
    );
  }
}
