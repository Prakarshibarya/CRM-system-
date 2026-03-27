import { NextResponse } from "next/server";
import { buildCRMSlackPayload, sendSlackMessage } from "@/lib/slack";

type Body = {
  event:
    | "lead_created"
    | "event_created"
    | "onboarding_step_completed"
    | "milestone_updated"
    | "lead_disabled";
  item?: {
    title?: string;
    orgName?: string;
    eventName?: string;
    manager?: string;
    platform?: string;
    city?: string;
    venue?: string;
    startDate?: string;
    endDate?: string;
    sourceType?: string;
    disabledReason?: string;
  };
  stepName?: string;
  extra?: Record<string, string | undefined>;
};

function eventLabel(event: Body["event"]) {
  switch (event) {
    case "lead_created":
      return "New Lead Created";
    case "event_created":
      return "New Event Created";
    case "onboarding_step_completed":
      return "Onboarding Step Completed";
    case "milestone_updated":
      return "Active Milestone Updated";
    case "lead_disabled":
      return "Lead Disabled";
    default:
      return "CRM Update";
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const item = body.item || {};
    const label = eventLabel(body.event);

    const fields = [
      { title: "Organizer", value: item.orgName || "—" },
      { title: "Event", value: item.eventName || "—" },
      { title: "Manager", value: item.manager || "—" },
      { title: "Platform", value: item.platform || "—" },
      { title: "City", value: item.city || "—" },
      { title: "Venue", value: item.venue || "—" },
      { title: "Start Date", value: item.startDate || "—" },
      { title: "End Date", value: item.endDate || "—" },
      { title: "Source Type", value: item.sourceType || "—" },
      ...(body.stepName ? [{ title: "Step", value: body.stepName }] : []),
      ...(item.disabledReason
        ? [{ title: "Disable Reason", value: item.disabledReason }]
        : []),
      ...Object.entries(body.extra || {}).map(([key, value]) => ({
        title: key,
        value: value || "—",
      })),
    ];

    await sendSlackMessage(
      buildCRMSlackPayload({
        title: item.title || item.eventName || item.orgName || "CRM Item",
        event: label,
        fields,
      })
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Slack notify error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to send Slack notification" },
      { status: 500 }
    );
  }
}