import { chromium } from "playwright";
import type { ScrapedEvent } from "./BookMyShow";

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
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 900 },
  });

  const page = await context.newPage();
  const events: ScrapedEvent[] = [];

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForTimeout(3000);

    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout(1000);
    }

    const allLinks = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("a[href]")).map((a) => {
        const el = a as HTMLAnchorElement;
        return {
          href: el.href,
          text:
            el.innerText?.trim() ||
            el.querySelector("img")?.alt?.trim() ||
            "",
        };
      });
    });

    const eventLinks = allLinks.filter(
      (l) =>
        l.href.includes("sortmyscene.com") &&
        (l.href.includes("/event/") || l.href.includes("/e/")) &&
        l.text.length > 2
    );

    const seen = new Set<string>();
    for (const link of eventLinks) {
      if (seen.has(link.href)) continue;
      seen.add(link.href);

      const urlSlug = link.href
        .split("/")
        .pop()
        ?.split("?")[0]
        ?.replace(/-/g, " ") ?? "";

      events.push({
        title: link.text || urlSlug,
        eventName: link.text || urlSlug,
        platform: "SortMyScene",
        eventType: "Event",
        city,
        venue: "—",
        eventLink: link.href,
      });
    }

    console.log(`SortMyScene: found ${eventLinks.length} event links on page`);
  } catch (err) {
    console.error("SortMyScene scraper error:", err);
  } finally {
    await browser.close();
  }

  return events;
}