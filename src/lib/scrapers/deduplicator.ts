import type { ScrapedEvent } from "./BookMyShow";
import type { CRMItem } from "@/types/crm";

export function deduplicateEvents(
  scraped: ScrapedEvent[],
  existing: CRMItem[]
): ScrapedEvent[] {
  // Build lookup sets from existing items
  const existingLinks = new Set(
    existing.map((i) => i.eventLink?.trim().toLowerCase()).filter(Boolean)
  );

  const existingNameCity = new Set(
    existing.map((i) =>
      `${i.eventName?.trim().toLowerCase()}__${i.city?.trim().toLowerCase()}`
    )
  );

  return scraped.filter((event) => {
    // Check 1: exact URL match
    if (existingLinks.has(event.eventLink.trim().toLowerCase())) {
      return false;
    }

    // Check 2: same event name + city combo
    const key = `${event.eventName.trim().toLowerCase()}__${event.city.trim().toLowerCase()}`;
    if (existingNameCity.has(key)) {
      return false;
    }

    return true;
  });
}