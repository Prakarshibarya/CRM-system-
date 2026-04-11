import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const CITIES    = ["Bangalore", "Mumbai", "Pune", "Delhi NCR", "Goa", "Hyderabad"];
const PLATFORMS = ["All", "BookMyShow", "District", "SortMyScene"];

const CITY_ALIASES: Record<string, string[]> = {
  "Bangalore":  ["bangalore", "bengaluru", "blr"],
  "Mumbai":     ["mumbai", "bombay"],
  "Pune":       ["pune"],
  "Delhi NCR":  ["delhi", "ncr", "gurugram", "noida", "gurgaon"],
  "Goa":        ["goa"],
  "Hyderabad":  ["hyderabad", "hyd"],
};

const PLATFORM_CONFIG: Record<string, { domain: string }> = {
  BookMyShow:  { domain: "in.bookmyshow.com" },
  District:    { domain: "district.in" },
  SortMyScene: { domain: "sortmyscene.com" },
};

function getCurrentMonthYear() {
  return new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
}
function getNextMonthYear() {
  const d = new Date(); d.setMonth(d.getMonth() + 1);
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}
function normaliseUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname}${u.pathname}`.replace(/\/+$/, "").toLowerCase();
  } catch { return url.toLowerCase(); }
}
function isEventPage(url: string): boolean {
  try {
    const { hostname, pathname } = new URL(url);
    const parts = pathname.toLowerCase().split("/").filter(Boolean);
    if (parts.length < 2) return false;
    if (hostname.includes("bookmyshow")) return parts[0] === "events";
    if (hostname.includes("district"))   return parts[0] === "event" || parts[0] === "events";
    if (hostname.includes("sortmyscene"))return parts[0] === "event" || parts[0] === "events";
  } catch {}
  return false;
}
function hasValidETCode(url: string): boolean {
  return /\/ET\d{6,}/i.test(url);
}
function mentionsCity(url: string, title: string, snippet: string, city: string): boolean {
  const aliases = CITY_ALIASES[city] ?? [city.toLowerCase()];
  const haystack = `${url} ${title} ${snippet}`.toLowerCase();
  return aliases.some((a) => haystack.includes(a));
}
function cleanTitle(raw: string): string {
  return raw
    .replace(/^Book Tickets?\s+(for\s+)?/i, "")
    .replace(/^Buy Tickets?\s+(for\s+)?/i, "")
    .replace(/^Get Tickets?\s+(for\s+)?/i, "")
    .replace(/\s*→.*$/i, "")
    .replace(/\s*[|\-–]\s*(BookMyShow|District|SortMyScene|BMS|Buy Tickets?|Book Tickets?|Tickets?).*$/i, "")
    .replace(/\s*::\s*.*/i, "")
    .replace(/\s*-\s*(Buy|Book|Get)\s+Tickets?.*$/i, "")
    .replace(/\s+(music-shows?|comedy-shows?|event-tickets?|conferences?|workshops?)\s*.*$/i, "")
    .replace(/\s+Event Tickets?\s+.*$/i, "")
    .replace(/\*\*/g, "")
    .replace(/&amp;/g, "&")
    .replace(/\s*[-,]\s*(bass|electronic|psychedelic|melodic|deep house|techno|edm|dnb|house|groov)[^)]*$/i, "")
    .replace(/\s+-\s+(jamming|indie|commercial|bollywood)\s+event in.*$/i, "")
    .trim();
}
function extractPlatform(url: string): string {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes("bookmyshow")) return "BookMyShow";
    if (host.includes("district"))   return "District";
    if (host.includes("sortmyscene"))return "SortMyScene";
  } catch {}
  return "Other";
}
function titleFromSlug(url: string): string {
  try {
    const slug = new URL(url).pathname.split("/").filter(Boolean).pop() ?? "";
    const withoutDate = slug
      .replace(/-(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)-\d{1,2}-\d{4}$/i, "")
      .replace(/-\d{4}$/, "")
      .replace(/-buy-tickets?$/i, "")
      .replace(/ET\d+$/i, "")
      .replace(/-+$/, "");
    return withoutDate.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ").trim();
  } catch { return ""; }
}
function parseDate(raw: string): string | undefined {
  if (!raw) return undefined;
  try {
    const cleaned = raw.replace(/\b(mon|tue|wed|thu|fri|sat|sun),?\s*/i, "").replace(/\s*(IST|UTC|GMT.*)$/i, "").trim();
    const d = new Date(cleaned);
    if (!isNaN(d.getTime()) && d.getFullYear() > 2020 && d.getFullYear() < 2030) {
      return d.toISOString().split("T")[0];
    }
  } catch {}
  return undefined;
}
function isDateInPast(dateStr: string): boolean {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return new Date(dateStr) < today;
}

// ── Extract date + venue from any text block ──────────────────
// Used for BMS where we can't scrape — we parse whatever
// Tavily returned in its content/snippet field
function extractDetailsFromText(text: string): { startDate?: string; venue?: string } {
  let startDate: string | undefined;
  let venue:     string | undefined;

  // Date — find all date-like strings, keep first future one
  const allMatches = [
    ...[...text.matchAll(/(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/gi)],
    ...[...text.matchAll(/((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})/gi)],
    ...[...text.matchAll(/(\d{4}-\d{2}-\d{2})/g)],
    // BMS often has formats like "Sat, 19 Apr 2026" or "Sunday, 20 Apr"
    ...[...text.matchAll(/(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*,?\s+(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/gi)],
  ];

  for (const match of allMatches) {
    const raw    = match[1] ?? match[0];
    const parsed = parseDate(raw);
    if (parsed && !isDateInPast(parsed)) { startDate = parsed; break; }
  }

  // Venue — look for common patterns
  // BMS snippets often contain "Venue Name, City" or "at Venue"
  const venuePatterns = [
    // "Venue: Phoenix Marketcity" or "Venue - MMRDA"
    /[Vv]enue\s*[:\-]\s*([^,\n|.]{3,60})/,
    // "at Phoenix Mall" or "@ The Burrow"
    /\bat\s+([A-Z][^,\n|.\d]{3,50})(?:\s*[,|.])/,
    /\b@\s+([A-Z][^,\n|.\d]{3,50})(?:\s*[,|.])/,
    // "held at" or "taking place at"
    /(?:held|taking place|happening)\s+at\s+([^,\n|.]{3,60})/i,
    // Location patterns like "Phoenix Marketcity, Bangalore"
    /([A-Z][a-zA-Z\s&']{3,40}),\s*(?:Bangalore|Bengaluru|Mumbai|Pune|Delhi|Goa|Hyderabad)/,
  ];

  for (const pattern of venuePatterns) {
    const match = text.match(pattern);
    if (match) {
      const candidate = match[1].trim().replace(/&amp;/g, "&");
      if (
        candidate.length > 3 && candidate.length < 80 &&
        !candidate.toLowerCase().includes("book") &&
        !candidate.toLowerCase().includes("ticket") &&
        !candidate.toLowerCase().includes("event") &&
        !["the", "a", "an", "for"].includes(candidate.toLowerCase())
      ) {
        venue = candidate;
        break;
      }
    }
  }

  return { startDate, venue };
}

// ── Scrape District / SortMyScene only ────────────────────────
// BMS blocks server scraping via Cloudflare, so we don't even try.
// For District and SortMyScene, we fetch the page and parse JSON-LD.
async function scrapeNonBMSPage(url: string, tavilyContent: string): Promise<{
  valid: boolean;
  title?: string;
  startDate?: string;
  endDate?: string;
  venue?: string;
}> {
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
      },
    });

    const finalPath = new URL(res.url).pathname.toLowerCase();
    if (url.includes("district.in")) {
      if (finalPath === "/" || finalPath === "/events" || finalPath === "/events/") return { valid: false };
    }
    if (url.includes("sortmyscene")) {
      if (finalPath === "/" || finalPath === "/home") return { valid: false };
    }
    if (!res.ok) return { valid: false };

    const html = await res.text();

    // ── JSON-LD (best source) ─────────────────────────────────
    const jsonLdBlocks = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) ?? [];
    for (const block of jsonLdBlocks) {
      try {
        const raw   = block.replace(/<script[^>]*>|<\/script>/gi, "").trim();
        const json  = JSON.parse(raw);
        const items = Array.isArray(json) ? json : [json];

        for (const item of items) {
          const eventTypes = ["Event","MusicEvent","SocialEvent","TheaterEvent","ComedyEvent","Festival","SportsEvent"];
          const events = item["@graph"]
            ? item["@graph"].filter((g: any) => eventTypes.includes(g["@type"]))
            : eventTypes.includes(item["@type"]) ? [item] : [];

          for (const event of events) {
            let title     = String(event.name ?? "").trim().replace(/&amp;/g, "&");
            const startDate = parseDate(event.startDate ?? "");
            const endDate   = parseDate(event.endDate   ?? "");
            const venue     = String(
              event.location?.name ??
              event.location?.address?.name ??
              event.location?.address?.streetAddress ?? ""
            ).trim().replace(/&amp;/g, "&");

            if (startDate && isDateInPast(startDate)) {
              console.log(`[Scrape] expired: ${startDate} → ${url}`);
              return { valid: false };
            }

            const badNames = ["sort my scene","sortmyscene","bookmyshow","district"];
            if (badNames.includes(title.toLowerCase())) title = "";

            if (title || startDate) {
              console.log(`[Scrape] ✅ "${title || "(no title)"}" | ${startDate ?? "-"} | ${venue || "-"}`);
              return { valid: true, title: title || undefined, startDate, endDate, venue: venue || undefined };
            }
          }
        }
      } catch {}
    }

    // ── OG + HTML fallback ────────────────────────────────────
    const ogTitle = (
      html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
      html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? ""
    ).trim().replace(/&amp;/g, "&");

    const ogDesc = (
      html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? ""
    ).replace(/&amp;/g, "&");

    // Combine all available text to extract date/venue
    const allText = `${ogTitle} ${ogDesc} ${tavilyContent} ${html.slice(0, 8000)}`;
    const { startDate, venue } = extractDetailsFromText(allText);

    // Reject if only past dates found
    if (!startDate) {
      // Check if HTML has only past dates
      const anyFutureDate = [...html.matchAll(/(\d{4}-\d{2}-\d{2})/g)]
        .some(m => { const p = parseDate(m[1]); return p && !isDateInPast(p); });
      const anyFutureDateText = [...html.matchAll(/((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})/gi)]
        .some(m => { const p = parseDate(m[1]); return p && !isDateInPast(p); });
      // If page has dates but all are past, reject it
      const hasPastOnly = html.match(/\d{4}-\d{2}-\d{2}/) && !anyFutureDate && !anyFutureDateText;
      if (hasPastOnly) {
        console.log(`[Scrape] all dates past → ${url}`);
        return { valid: false };
      }
    }

    const cleaned = cleanTitle(ogTitle);
    const badNames = ["sort my scene","sortmyscene","bookmyshow","district","home",""];
    if (cleaned && !badNames.includes(cleaned.toLowerCase())) {
      console.log(`[Scrape] OG: "${cleaned}" | ${startDate ?? "-"} | ${venue ?? "-"}`);
      return { valid: true, title: cleaned, startDate, venue };
    }

    return { valid: true, startDate, venue };

  } catch (err: any) {
    if (err?.name === "AbortError") return { valid: true };
    return { valid: true };
  }
}

// ── Tavily search ─────────────────────────────────────────────
async function fetchFromTavily(
  city: string, platforms: string[], apiKey: string
): Promise<{ url: string; title: string; snippet: string }[]> {
  const monthYear     = getCurrentMonthYear();
  const nextMonthYear = getNextMonthYear();
  const year          = new Date().getFullYear();

  const queries = [
    `upcoming events in ${city} ${monthYear} tickets`,
    `upcoming events in ${city} ${nextMonthYear} tickets`,
    `live music concerts ${city} ${year}`,
    `comedy shows festivals ${city} ${year}`,
    `events ${city} ${year} book now`,
  ];

  const searches: Promise<any>[] = [];
  for (const p of platforms) {
    const domain = PLATFORM_CONFIG[p]?.domain;
    if (!domain) continue;
    for (const query of queries) {
      searches.push(
        fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: apiKey, query,
            search_depth: "advanced",
            max_results: 10,
            include_domains: [domain],
          }),
        })
        .then((r) => r.ok ? r.json() : { results: [] })
        .then((d) => (d.results ?? []).map((r: any) => ({
          url:     String(r.url     ?? ""),
          title:   String(r.title   ?? ""),
          snippet: String(r.content ?? ""),
        })))
        .catch(() => [])
      );
    }
  }

  const settled = await Promise.allSettled(searches);
  const results: { url: string; title: string; snippet: string }[] = [];
  for (const s of settled) {
    if (s.status === "fulfilled") results.push(...s.value);
  }
  console.log(`[Tavily] ${results.length} raw results`);
  return results;
}

// ── Main handler ──────────────────────────────────────────────
export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const body     = await req.json().catch(() => null);
  const city     = String(body?.city     ?? "");
  const platform = String(body?.platform ?? "All");

  if (!CITIES.includes(city))        return NextResponse.json({ error: "Invalid city" },     { status: 400 });
  if (!PLATFORMS.includes(platform)) return NextResponse.json({ error: "Invalid platform" }, { status: 400 });

  const tavilyKey = process.env.TAVILY_API_KEY;
  if (!tavilyKey) return NextResponse.json({ error: "Tavily API key not configured." }, { status: 500 });

  const platformsToSearch = platform === "All"
    ? ["BookMyShow", "District", "SortMyScene"]
    : [platform];

  const existingItems = await prisma.crmItem.findMany({
    where: { userId: auth.id, eventLink: { not: null } },
    select: { eventLink: true },
  });
  const existingUrls = new Set(existingItems.map((i) => normaliseUrl(i.eventLink!)));
  console.log(`[CRM] ${existingUrls.size} existing links`);

  const rawResults = await fetchFromTavily(city, platformsToSearch, tavilyKey);

  const seen       = new Set<string>();
  const candidates: { url: string; title: string; snippet: string }[] = [];

  for (const result of rawResults) {
    const url = result.url.trim();
    if (!url) continue;
    const normUrl = normaliseUrl(url);
    if (seen.has(normUrl))         { console.log("⏭ duplicate:", url); continue; }
    seen.add(normUrl);
    if (existingUrls.has(normUrl)) { console.log("⏭ in CRM:", url); continue; }
    if (!isEventPage(url))         { console.log("❌ not event page:", url); continue; }
    if (url.includes("bookmyshow") && !hasValidETCode(url)) {
      console.log("❌ BMS no ET code:", url); continue;
    }
    if (!mentionsCity(url, result.title, result.snippet, city)) {
      console.log("❌ wrong city:", url); continue;
    }
    candidates.push(result);
  }

  console.log(`[Process] ${candidates.length} candidates`);

  const processed = await Promise.all(
    candidates.map(async (result) => {
      const isBMS = result.url.includes("bookmyshow");

      if (isBMS) {
        // BMS blocked by Cloudflare — parse title/date/venue from Tavily content
        // Tavily's content field has the actual text it scraped from the page
        const combinedText = `${result.title} ${result.snippet}`;
        const { startDate, venue } = extractDetailsFromText(combinedText);

        // Log full snippet so we can see what Tavily captured
        console.log(`[BMS] snippet (first 200): ${result.snippet.slice(0, 200)}`);

        const title = cleanTitle(result.title) || titleFromSlug(result.url);
        if (!title) return null;

        console.log(`[BMS] ✅ "${title}" | ${startDate ?? "-"} | ${venue ?? "-"}`);
        return {
          title, eventLink: result.url, city,
          platform: "BookMyShow",
          startDate, endDate: undefined, venue,
        };
      }

      // District / SortMyScene — scrape for JSON-LD data
      const details = await scrapeNonBMSPage(result.url, result.snippet);
      if (!details.valid) return null;

      const slug  = titleFromSlug(result.url);
      const title = details.title
        ? cleanTitle(details.title)
        : cleanTitle(result.title) || slug;

      const badTitles = ["sort my scene","sortmyscene","bookmyshow","district","home",""];
      if (badTitles.includes(title.toLowerCase())) return null;

      return {
        title, eventLink: result.url, city,
        platform: extractPlatform(result.url),
        startDate: details.startDate,
        endDate:   details.endDate,
        venue:     details.venue,
      };
    })
  );

  const events = processed.filter((r): r is NonNullable<typeof r> => r !== null);
  console.log(`[Result] ${events.length} verified events`);

  if (events.length === 0) {
    return NextResponse.json(
      { error: `No verified upcoming events found in ${city}${platform !== "All" ? ` on ${platform}` : ""}. Try a different city or platform.` },
      { status: 404 }
    );
  }

  return NextResponse.json({ events });
}