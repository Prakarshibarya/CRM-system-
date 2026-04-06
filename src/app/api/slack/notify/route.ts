import { NextResponse } from "next/server";
import { buildCRMSlackPayload, sendSlackMessage } from "@/lib/slack";
import { requireAuth } from "@/lib/session";

// ✅ Simple in-memory rate limiter: max 10 Slack notifications per user per minute.
// This is per-instance (not distributed), which is fine for a small internal tool.
// For multi-instance deployments, move this to Redis.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MAX_PER_MINUTE = 10;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60_000 });
    return true;
  }

  if (entry.count >= MAX_PER_MINUTE) return false;

  entry.count++;
  return true;
}

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

const ALLOWED_EVENTS: Body["event"][] = [
  "lead_created",
  "event_created",
  "onboarding_step_completed",
  "milestone_updated",
  "lead_disabled",
];

function eventLabel(event: Body["event"]) {
  switch (event) {
    case "lead_created": return "New Lead Created";
    case "event_created": return "New Event Created";
    case "onboarding_step_completed": return "Onboarding Step Completed";
    case "milestone_updated": return "Active Milestone Updated";
    case "lead_disabled": return "Lead Disabled";
    default: return "CRM Update";
  }
}

export async function POST(req: Request) {
  // ✅ Require a valid session — anonymous callers cannot trigger Slack
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  // ✅ Rate limit per user
  if (!checkRateLimit(auth.id)) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429 }
    );
  }

  try {
    const body = (await req.json()) as Body;

    // ✅ Validate the event type against an allowlist
    if (!body?.event || !ALLOWED_EVENTS.includes(body.event)) {
      return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
    }

    const item = body.item || {};
    const label = eventLabel(body.event);

    // ✅ Sanitize extra fields — only allow string values, no arbitrary objects
    const safeExtra = Object.fromEntries(
      Object.entries(body.extra || {})
        .filter(([, v]) => typeof v === "string" || v === undefined)
        .slice(0, 10) // cap the number of extra fields
    );

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
      ...(item.disabledReason ? [{ title: "Disable Reason", value: item.disabledReason }] : []),
      ...Object.entries(safeExtra).map(([key, value]) => ({
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