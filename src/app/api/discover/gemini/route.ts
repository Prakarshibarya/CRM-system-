import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";

const CITIES = ["Bangalore", "Mumbai", "Pune", "Delhi NCR", "Goa", "Hyderabad"];

const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

async function callGemini(apiKey: string, prompt: string): Promise<{ text?: string; error?: string }> {
  for (const model of MODELS) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 8192, // ✅ increased from 2048 — was causing truncation
          },
        }),
      }
    );

    if (res.ok) {
      const data = await res.json();
      const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      console.log(`Gemini success with model: ${model}`);
      return { text };
    }

    const errText = await res.text();
    console.warn(`Model ${model} failed (${res.status}):`, errText);

    if (res.status !== 429 && res.status !== 404) {
      let message = `Gemini error (${res.status})`;
      try { message = JSON.parse(errText)?.error?.message ?? message; } catch {}
      return { error: message };
    }
  }

  return { error: "All Gemini models exceeded quota. Please check your API key or enable billing at console.cloud.google.com." };
}

// ✅ Tries to extract a JSON array even if response has extra text around it
function extractJsonArray(raw: string): any[] | null {
  // Strip markdown fences
  const stripped = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  // Try direct parse first
  try {
    const parsed = JSON.parse(stripped);
    if (Array.isArray(parsed)) return parsed;
  } catch {}

  // Find the first [ ... ] block in the text
  const start = stripped.indexOf("[");
  const end = stripped.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) {
    try {
      const parsed = JSON.parse(stripped.slice(start, end + 1));
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }

  return null;
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);
  const city: string = body?.city ?? "";

  if (!city || !CITIES.includes(city)) {
    return NextResponse.json({ error: "Invalid city" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini API key not configured. Add GEMINI_API_KEY to your .env file." },
      { status: 500 }
    );
  }

  const prompt = `You are an event discovery assistant. Find upcoming live events in ${city}, India listed on BookMyShow (in.bookmyshow.com), District (district.in), or SortMyScene (sortmyscene.com).

Return ONLY a JSON array — no explanation, no markdown, no code fences. Each object must have exactly these fields:
- "title": the event name (string)
- "eventLink": the full URL to the event page (string, must start with https://)
- "city": "${city}" (string)
- "platform": one of "BookMyShow", "District", "SortMyScene", or "Other" (string)

Rules:
- Include only real, specific upcoming events (not category pages or homepages)
- Each eventLink must be a direct link to a specific event, not a search or listing page
- Return between 5 and 10 events maximum
- Do not repeat events
- Do not include events that have already passed

Example format:
[
  {
    "title": "Sunburn Arena ft. Martin Garrix",
    "eventLink": "https://in.bookmyshow.com/events/sunburn-arena-ft-martin-garrix/ET00123456",
    "city": "${city}",
    "platform": "BookMyShow"
  }
]`;

  try {
    const { text, error } = await callGemini(apiKey, prompt);

    if (error) {
      return NextResponse.json({ error }, { status: 502 });
    }

    const events = extractJsonArray(text ?? "");

    if (!events) {
      console.error("Failed to parse Gemini response. Raw text:", text?.slice(0, 500));
      return NextResponse.json(
        { error: "Gemini returned an unexpected format. Please try again." },
        { status: 502 }
      );
    }

    const sanitised = events
      .filter((e) => e && typeof e === "object")
      .map((e) => ({
        title: String(e.title ?? "").trim(),
        eventLink: String(e.eventLink ?? "").trim(),
        city: String(e.city ?? city).trim(),
        platform: String(e.platform ?? "Other").trim(),
      }))
      .filter((e) => {
        if (!e.title || !e.eventLink) return false;
        try { new URL(e.eventLink); return true; } catch { return false; }
      });

    return NextResponse.json({ events: sanitised });
  } catch (err: any) {
    console.error("Gemini discover error:", err);
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}