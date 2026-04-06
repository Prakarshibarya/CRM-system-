import { chromium } from "playwright";

export type ScrapedEvent = {
  title: string;
  eventName: string;
  platform: "BookMyShow" | "District" | "SortMyScene" | "Other";
  eventType: string;
  city: string;
  venue: string;
  eventLink: string;
  startDate?: string;
};

const CITY_SLUGS: Record<string, string> = {
  bangalore: "bangalore",
  bengaluru: "bangalore",
  mumbai: "mumbai",
  delhi: "ncr",
  hyderabad: "hyderabad",
  chennai: "chennai",
  pune: "pune",
  kolkata: "kolkata",
  ahmedabad: "ahmedabad",
  goa: "goa",
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
      "--disable-web-security",
    ],
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 900 },
    extraHTTPHeaders: {
      "Accept-Language": "en-IN,en;q=0.9",
    },
  });

  const page = await context.newPage();
  const events: ScrapedEvent[] = [];

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });

    // Give JS extra time to render
    await page.waitForTimeout(3000);

    // Scroll to trigger lazy loading
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout(1000);
    }

    // ✅ Dump ALL links and filter by BMS event URL pattern
    const allLinks = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("a[href]")).map((a) => {
        const el = a as HTMLAnchorElement;
        const href = el.href;

        // Walk up the DOM to find text content near this link
        const text = el.innerText?.trim() ||
          el.querySelector("*")?.textContent?.trim() || "";

        // Try to find an image alt as title fallback
        const imgAlt = el.querySelector("img")?.alt?.trim() || "";

        return {
          href,
          text: text || imgAlt,
        };
      });
    });

    // Filter to only event links
    const eventLinks = allLinks.filter(
      (l) =>
        l.href.includes("bookmyshow.com") &&
        (l.href.includes("/events/") ||
          l.href.includes("/activities/") ||
          l.href.includes("/show/")) &&
        l.text.length > 2 &&
        !l.href.includes("explore") &&
        !l.href.includes("undefined")
    );

    const seen = new Set<string>();
    for (const link of eventLinks) {
      if (seen.has(link.href)) continue;
      seen.add(link.href);

      // Extract event name from URL slug as fallback
      const urlSlug = link.href
        .split("/")
        .pop()
        ?.split("?")[0]
        ?.replace(/-/g, " ") ?? "";

      events.push({
        title: link.text || urlSlug,
        eventName: link.text || urlSlug,
        platform: "BookMyShow",
        eventType: "Event",
        city,
        venue: "—",
        eventLink: link.href,
      });
    }

    console.log(`BMS: found ${eventLinks.length} event links on page`);
  } catch (err) {
    console.error("BMS scraper error:", err);
  } finally {
    await browser.close();
  }

  return events;
}