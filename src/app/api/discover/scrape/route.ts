import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { deduplicateEvents } from "@/lib/scrapers/deduplicator";
import type { CRMItem } from "@/types/crm";

const SCRAPER_URL = process.env.SCRAPER_URL ?? "http://localhost:8000";

export async function POST(req: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const city: string = body?.city?.trim() || "Bangalore";

  try {
    const scraperRes = await fetch(`${SCRAPER_URL}/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ city }),
      signal: AbortSignal.timeout(120000),
    });

    if (!scraperRes.ok) {
      const err = await scraperRes.text();
      console.error("Scraper service error:", err);
      return NextResponse.json(
        { error: "Scraper service failed. Make sure it is running." },
        { status: 502 }
      );
    }

    const scraperData = await scraperRes.json();
    const allScraped = scraperData.events ?? [];

    const existing = await prisma.crmItem.findMany({
      where: { userId: sessionUser.id },
      select: { eventLink: true, eventName: true, city: true },
    });

    const newEvents = deduplicateEvents(allScraped, existing as CRMItem[]);

    console.log(`Scrape for ${city}: scraped=${allScraped.length}, new=${newEvents.length}`);

    return NextResponse.json({
      events: newEvents,
      total: newEvents.length,
      city,
      scraped: allScraped.length,
      breakdown: scraperData.breakdown,
    });
  } catch (err: any) {
    console.error("Scrape route error:", err);
    if (err.name === "TimeoutError") {
      return NextResponse.json(
        { error: "Scraper timed out. Try again." },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: "Could not connect to scraper service. Make sure it is running on port 8000." },
      { status: 503 }
    );
  }
}