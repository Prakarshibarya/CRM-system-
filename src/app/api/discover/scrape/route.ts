import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { scrapeBookMyShow } from "@/lib/scrapers/BookMyShow";
import { scrapeDistrict } from "@/lib/scrapers/District";
import { scrapeSortMyScene } from "@/lib/scrapers/SortMyScene";
import { deduplicateEvents } from "@/lib/scrapers/deduplicator";
import type { CRMItem } from "@/types/crm";

export async function POST(req: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const city: string = body?.city?.trim() || "bangalore";

  try {
    // ✅ Load existing items for this user to deduplicate against
    const existing = await prisma.crmItem.findMany({
      where: { userId: sessionUser.id },
      select: { eventLink: true, eventName: true, city: true },
    });

    // ✅ Run all 3 scrapers in parallel
    const [bmsEvents, districtEvents, smsEvents] = await Promise.allSettled([
      scrapeBookMyShow(city),
      scrapeDistrict(city),
      scrapeSortMyScene(city),
    ]);

    const allScraped = [
      ...(bmsEvents.status === "fulfilled" ? bmsEvents.value : []),
      ...(districtEvents.status === "fulfilled" ? districtEvents.value : []),
      ...(smsEvents.status === "fulfilled" ? smsEvents.value : []),
    ];

    // ✅ Deduplicate against existing DB items
    const newEvents = deduplicateEvents(allScraped, existing as CRMItem[]);

    // Log scraper results for debugging
    console.log(`Scrape results for ${city}:`, {
      bms: bmsEvents.status === "fulfilled" ? bmsEvents.value.length : `error: ${(bmsEvents as any).reason}`,
      district: districtEvents.status === "fulfilled" ? districtEvents.value.length : `error: ${(districtEvents as any).reason}`,
      sms: smsEvents.status === "fulfilled" ? smsEvents.value.length : `error: ${(smsEvents as any).reason}`,
      total: allScraped.length,
      afterDedup: newEvents.length,
    });

    return NextResponse.json({
      events: newEvents,
      total: newEvents.length,
      city,
      scraped: allScraped.length,
    });
  } catch (err: any) {
    console.error("Scrape error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Scraping failed" },
      { status: 500 }
    );
  }
}