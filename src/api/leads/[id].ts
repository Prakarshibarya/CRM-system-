import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../src/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const id = req.query.id as string;

    if (req.method === "PATCH") {
      const body = req.body ?? {};
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
      return res.status(200).json({ lead });
    }

    if (req.method === "DELETE") {
      await prisma.lead.delete({ where: { id } });
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", ["PATCH", "DELETE"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (e: any) {
    return res.status(500).json({ error: "Server error", detail: e?.message ?? String(e) });
  }
}
