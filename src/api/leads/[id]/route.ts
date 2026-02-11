import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const id = ctx.params.id;
  const body = await req.json();

  const lead = await prisma.lead.update({
    where: { id },
    data: {
      title: body.title,
      status: body.status,
      contactName: body.contactName,
      contactPhone: body.contactPhone,
      contactEmail: body.contactEmail,
      notes: body.notes,
    },
  });

  return NextResponse.json({ lead });
}

export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
  const id = ctx.params.id;

  await prisma.lead.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
