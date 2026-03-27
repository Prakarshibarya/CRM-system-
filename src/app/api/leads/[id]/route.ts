import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await req.json().catch(() => null);

  const lead = await prisma.lead.update({
    where: { id },
    data: {
      title: body?.title,
      status: body?.status,
      contactName: body?.contactName,
      contactPhone: body?.contactPhone,
      contactEmail: body?.contactEmail,
      notes: body?.notes,
    },
  });

  return NextResponse.json({ lead });
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  await prisma.lead.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}