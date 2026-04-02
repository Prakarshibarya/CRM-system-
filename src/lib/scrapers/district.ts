import { chromium } from "playwright";
import type { ScrapedEvent } from "./bookmyshow";

export async function scrapeDistrict(city: string): Promise<ScrapedEvent[]> {
  const url = `https://district.in/events?city=${encodeURIComponent(city)}`;

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

    await page.waitForSelector("a[href*='/e/'], [class*='event'], [class*='Event']", {
      timeout: 15000,
    }).catch(() => null);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);

    const rawEvents = await page.evaluate(() => {
      const cards = Array.from(
        document.querySelectorAll("a[href*='/e/']")
      );

      return cards
        .map((card) => {
          const href = (card as HTMLAnchorElement).href;
          const title =
            card.querySelector("h2, h3, [class*='title'], [class*='name']")
              ?.textContent?.trim() ??
            card.textContent?.trim().split("\n")[0] ??
            "";
          const venue =
            card.querySelector("[class*='venue'], [class*='location'], [class*='place']")
              ?.textContent?.trim() ?? "";
          const date =
            card.querySelector("[class*='date'], time")
              ?.textContent?.trim() ?? "";
          const category =
            card.querySelector("[class*='tag'], [class*='category'], [class*='type']")
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
        platform: "BookMyShow", // District not in CRM type — map to Other
        eventType: raw.category || "Event",
        city,
        venue: raw.venue || "—",
        eventLink: raw.href,
        startDate: raw.date || undefined,
      });
    }
  } catch (err) {
    console.error("District scraper error:", err);
  } finally {
    await browser.close();
  }

  return events;
}