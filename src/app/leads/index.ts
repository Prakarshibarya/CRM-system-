import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../src/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const organizerId = req.query.organizerId as string | undefined;
      if (!organizerId) return res.status(400).json({ error: "organizerId is required" });

      const leads = await prisma.lead.findMany({
        where: { organizerId },
        orderBy: { updatedAt: "desc" },
      });

      return res.status(200).json({ leads });
    }

    if (req.method === "POST") {
      const { organizerId, title, contactName, contactPhone, contactEmail, notes } = req.body ?? {};
      if (!organizerId || !title) {
        return res.status(400).json({ error: "organizerId and title are required" });
      }

      const lead = await prisma.lead.create({
        data: {
          organizerId,
          title,
          contactName: contactName ?? null,
          contactPhone: contactPhone ?? null,
          contactEmail: contactEmail ?? null,
          notes: notes ?? null,
        },
      });

      return res.status(201).json({ lead });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (e: any) {
    return res.status(500).json({ error: "Server error", detail: e?.message ?? String(e) });
  }
}
