import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { action } = await req.json();

    let data: any = {};

    if (action === "approve") {
      data.status = "approved";
    } else if (action === "reject") {
      data.status = "rejected";
    } else if (action === "make_admin") {
      data.role = "admin";
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({ user });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}