import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const users = await prisma.user.findMany({
    where: { status: "approved" },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  // Return name if set, otherwise fall back to email prefix
  const managers = users.map((u) => ({
    id: u.id,
    label: u.name ?? u.email.split("@")[0],
  }));

  return NextResponse.json({ managers });
}