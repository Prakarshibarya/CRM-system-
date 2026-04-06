import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

// ✅ Helper: confirm the lead belongs to the session user's organizer.
// This prevents any authenticated user from patching/deleting another user's leads.
async function verifyLeadOwnership(leadId: string, userEmail: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { organizer: { select: { email: true } } },
  });
  if (!lead) return null;
  if (lead.organizer.email !== userEmail) return null;
  return lead;
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;

  // ✅ Ownership check before any mutation
  const existing = await verifyLeadOwnership(id, auth.email);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

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
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;

  // ✅ Ownership check before any mutation
  const existing = await verifyLeadOwnership(id, auth.email);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.lead.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}