import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { generateId } from "@/lib/store.client";

export async function POST() {
  // ✅ Use iron-session (your actual auth), not Clerk (not configured in this project)
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  // Mock events (later replaced with scraper)
  const discoveredEvents = [
    {
      title: "Sunburn Goa EDM Night",
      platform: "BookMyShow",
      eventType: "Music",
      city: "Goa",
      venue: "Vagator Beach",
      eventName: "Sunburn Festival",
      eventLink: "https://bookmyshow.com/sunburn",
    },
    {
      title: "Standup Comedy Night",
      platform: "District",
      eventType: "Comedy",
      city: "Bangalore",
      venue: "Indiranagar",
      eventName: "Comedy Special",
      eventLink: "https://district.com/comedy",
    },
  ];

  // ✅ Load existing items from DB directly — no client-side store import on server
  const existing = await prisma.crmItem.findMany({
    where: { userId: auth.id },
    select: { eventLink: true },
  });
  const existingLinks = new Set(existing.map((i) => i.eventLink));

  const created = [];

  for (const event of discoveredEvents) {
    if (existingLinks.has(event.eventLink)) continue;

    const newItem = await prisma.crmItem.create({
      data: {
        id: generateId("item"),
        userId: auth.id,
        title: event.title,
        platform: event.platform,
        eventType: event.eventType,
        manager: "AUTO",
        stage: "ONBOARDING",
        orgName: "",
        eventName: event.eventName,
        city: event.city,
        venue: event.venue,
        eventLink: event.eventLink,
        onboarding: {
          contactDetails: { checked: false },
          commissionSettled: { checked: false },
          partnerCreated: { checked: false },
        },
        active: {
          orgVerified: { checked: false },
          discountAsked: { checked: false },
          promoCardShared: { checked: false },
          mysiteMade: { checked: false },
          mysiteGiven: { checked: false },
          promoFollowUp: { checked: false },
          discountFollowUp: { checked: false },
          firstSalesUpdate: { checked: false },
        },
        activity: [{ at: new Date().toISOString(), text: "Lead auto-discovered" }],
      },
    });

    created.push(newItem);
  }

  return NextResponse.json({ createdCount: created.length });
}