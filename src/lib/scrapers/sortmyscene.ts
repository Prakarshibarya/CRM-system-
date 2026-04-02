import { chromium } from "playwright";
import type { ScrapedEvent } from "./bookmyshow";

export async function scrapeSortMyScene(city: string): Promise<ScrapedEvent[]> {
  const url = `https://www.sortmyscene.com/events/${encodeURIComponent(city.toLowerCase())}`;

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

    await page.waitForSelector("a[href*='/event/'], [class*='event-card'], [class*='EventCard']", {
      timeout: 15000,
    }).catch(() => null);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);

    const rawEvents = await page.evaluate(() => {
      const cards = Array.from(
        document.querySelectorAll("a[href*='/event/']")
      );

      return cards
        .map((card) => {
          const href = (card as HTMLAnchorElement).href;
          const title =
            card.querySelector("h2, h3, h4, [class*='title'], [class*='name']")
              ?.textContent?.trim() ?? "";
          const venue =
            card.querySelector("[class*='venue'], [class*='location']")
              ?.textContent?.trim() ?? "";
          const date =
            card.querySelector("[class*='date'], time")
              ?.textContent?.trim() ?? "";
          const category =
            card.querySelector("[class*='category'], [class*='genre']")
              ?.textContent?.trim() ?? "";

          return { href, title, venue, date, category };
        })
        .filter((e) => e.title && e.href);
    });

    const seen = new Set<string>();
    for (const raw of rawEvents) {
      if (seen.has(raw.href)) continue;
      seen.add(raw.href);

      events.push({
        title: raw.title,
        eventName: raw.title,
        platform: "BookMyShow", // SortMyScene maps to Other in CRM
        eventType: raw.category || "Event",
        city,
        venue: raw.venue || "—",
        eventLink: raw.href,
        startDate: raw.date || undefined,
      });
    }
  } catch (err) {
    console.error("SortMyScene scraper error:", err);
  } finally {
    await browser.close();
  }

  return events;
}