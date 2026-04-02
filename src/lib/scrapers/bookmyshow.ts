import { chromium } from "playwright";

export type ScrapedEvent = {
  title: string;
  eventName: string;
  platform: "BookMyShow";
  eventType: string;
  city: string;
  venue: string;
  eventLink: string;
  startDate?: string;
};

const CITY_SLUGS: Record<string, string> = {
  bangalore: "bangalore",
  mumbai: "mumbai",
  delhi: "ncr",
  hyderabad: "hyderabad",
  chennai: "chennai",
  pune: "pune",
  kolkata: "kolkata",
  ahmedabad: "ahmedabad",
};

export async function scrapeBookMyShow(city: string): Promise<ScrapedEvent[]> {
  const citySlug = CITY_SLUGS[city.toLowerCase()] ?? city.toLowerCase();
  const url = `https://in.bookmyshow.com/explore/events-${citySlug}`;

  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();
  const events: ScrapedEvent[] = [];

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    // Wait for event cards to load
    await page.waitForSelector("[class*='event-card'], [class*='EventCard'], a[href*='/events/']", {
      timeout: 15000,
    }).catch(() => null);

    // Scroll to load more events
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);

    const rawEvents = await page.evaluate(() => {
      const cards = Array.from(
        document.querySelectorAll("a[href*='/events/']")
      );

      return cards
        .map((card) => {
          const href = (card as HTMLAnchorElement).href;
          const title =
            card.querySelector("h3, h2, [class*='title'], [class*='name']")
              ?.textContent?.trim() ?? "";
          const venue =
            card.querySelector("[class*='venue'], [class*='location']")
              ?.textContent?.trim() ?? "";
          const date =
            card.querySelector("[class*='date'], [class*='time'], time")
              ?.textContent?.trim() ?? "";
          const category =
            card.querySelector("[class*='category'], [class*='genre'], [class*='tag']")
              ?.textContent?.trim() ?? "";

          return { href, title, venue, date, category };
        })
        .filter((e) => e.title && e.href && e.href.includes("/events/"));
    });

    // Deduplicate by href
    const seen = new Set<string>();
    for (const raw of rawEvents) {
      if (seen.has(raw.href)) continue;
      seen.add(raw.href);

      events.push({
        title: raw.title,
        eventName: raw.title,
        platform: "BookMyShow",
        eventType: raw.category || "Event",
        city: city,
        venue: raw.venue || "—",
        eventLink: raw.href,
        startDate: raw.date || undefined,
      });
    }
  } catch (err) {
    console.error("BMS scraper error:", err);
  } finally {
    await browser.close();
  }

  return events;
}