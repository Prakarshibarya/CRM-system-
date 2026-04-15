import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from"); // ISO date string e.g. "2026-01-01"
  const to   = searchParams.get("to");   // ISO date string e.g. "2026-12-31"

  // Fetch ALL CRM items across ALL users
  const allItems = await prisma.crmItem.findMany({
    select: {
      id: true,
      title: true,
      manager: true,
      activity: true,
      stage: true,
      disabled: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  // Flatten all activity entries across all items
  type HistoryEntry = {
    at: string;
    text: string;
    by: string;
    itemId: string;
    itemTitle: string;
    manager: string;
    stage: string;
  };

  const entries: HistoryEntry[] = [];

  for (const item of allItems) {
    const activity = item.activity as any[];
    if (!Array.isArray(activity)) continue;

    for (const act of activity) {
      if (!act?.at || !act?.text) continue;

      // Date range filter
      if (from && act.at < from) continue;
      if (to) {
        // Include full "to" day by comparing against end of day
        const endOfDay = to + "T23:59:59.999Z";
        if (act.at > endOfDay) continue;
      }

      entries.push({
        at:        act.at,
        text:      act.text,
        by:        act.by ?? item.manager ?? "—",
        itemId:    item.id,
        itemTitle: item.title,
        manager:   item.manager,
        stage:     item.stage,
      });
    }
  }

  // Sort newest first
  entries.sort((a, b) => b.at.localeCompare(a.at));

  return NextResponse.json({ entries });
}