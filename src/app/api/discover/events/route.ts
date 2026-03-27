import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { loadItemsFromDB, createItemInDB } from "@/lib/store";
import { generateId } from "@/lib/store";

export async function POST() {
  // ✅ FIX 1: Require auth — we need a real organizerId to attach items to
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  // ✅ FIX 2: Pass organizerId to loadItemsFromDB
  const existing = await loadItemsFromDB(userId);

  const created = [];

  for (const event of discoveredEvents) {
    const duplicate = existing.some(
      (item) => item.eventLink === event.eventLink
    );

    if (duplicate) continue;

    const newItem = {
      id: generateId("item"),
      title: event.title,
      platform: event.platform,
      eventType: event.eventType,
      manager: "AUTO",
      stage: "ONBOARDING" as const,
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
      activity: [
        {
          at: new Date().toISOString(),
          text: "Lead auto-discovered",
        },
      ],
      disabled: false,
    };

    // ✅ FIX 3: Pass organizerId as first arg to createItemInDB
    const saved = await createItemInDB(userId, newItem as any);
    created.push(saved);
  }

  return NextResponse.json({ createdCount: created.length });
}