type NotifySlackPayload = {
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

export async function notifySlack(payload: NotifySlackPayload) {
  try {
    await fetch("/api/slack/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Slack notification failed:", error);
  }
}