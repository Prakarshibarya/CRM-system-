type SlackField = {
  title: string;
  value: string;
};

function safe(value: unknown) {
  if (value === undefined || value === null || value === "") return "—";
  return String(value);
}

export async function sendSlackMessage(payload: { text: string }) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn("SLACK_WEBHOOK_URL is not set. Skipping Slack notification.");
    return;
  }

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Slack webhook failed: ${res.status} ${text}`);
  }
}

export function buildCRMSlackPayload(args: {
  title: string;
  event: string;
  fields?: SlackField[];
}) {
  const { title, event, fields = [] } = args;

  const lines = [
    `${event}`,
    `Title: ${safe(title)}`,
    ...fields.map((f) => `${safe(f.title)}: ${safe(f.value)}`),
  ];

  return {
    text: lines.join("\n"),
  };
}