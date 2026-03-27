import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();

    // ✅ Verify the item belongs to this user before updating
    const existing = await prisma.crmItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (existing.organizerId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data: any = {};

    if (typeof body.title === "string") data.title = body.title;
    if (typeof body.platform === "string") data.platform = body.platform;
    if (typeof body.eventType === "string") data.eventType = body.eventType;
    if (typeof body.manager === "string") data.manager = body.manager;
    if (typeof body.stage === "string") data.stage = body.stage;

    if (body.orgName === null || typeof body.orgName === "string") data.orgName = body.orgName;
    if (body.eventName === null || typeof body.eventName === "string") data.eventName = body.eventName;
    if (body.city === null || typeof body.city === "string") data.city = body.city;
    if (body.venue === null || typeof body.venue === "string") data.venue = body.venue;
    if (body.eventLink === null || typeof body.eventLink === "string") data.eventLink = body.eventLink;

    if (body.startDate === null || typeof body.startDate === "string") data.startDate = body.startDate;
    if (body.endDate === null || typeof body.endDate === "string") data.endDate = body.endDate;
    if (body.sourceType === null || typeof body.sourceType === "string") data.sourceType = body.sourceType;

    if (typeof body.disabled === "boolean") data.disabled = body.disabled;
    if (body.disabledReason === null || typeof body.disabledReason === "string") data.disabledReason = body.disabledReason;
    if (body.disabledAt === null) {
      data.disabledAt = null;
    } else if (typeof body.disabledAt === "string") {
      data.disabledAt = new Date(body.disabledAt);
    }

    if (body.onboarding !== undefined) data.onboarding = body.onboarding;
    if (body.active !== undefined) data.active = body.active;
    if (body.activity !== undefined) data.activity = body.activity;

    const updated = await prisma.crmItem.update({ where: { id }, data });
    return NextResponse.json({ item: updated });
  } catch (err: any) {
    console.error("PATCH /api/items/[id] failed:", err);
    return NextResponse.json(
      { error: err?.message ?? "Unknown error", code: err?.code },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const existing = await prisma.crmItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (existing.organizerId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.crmItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/items/[id] failed:", err);
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}