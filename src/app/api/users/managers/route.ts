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

  const managers = users.map((u) => ({
    id: u.id,
    label: u.name || u.email,
  }));

  return NextResponse.json({ managers });
}