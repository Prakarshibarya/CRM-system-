import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { chromium } from "playwright";

export async function POST(req: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const url: string = body?.url ?? "https://in.bookmyshow.com/explore/events-bangalore";

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  });

  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForTimeout(3000);

    // Scroll to trigger lazy loading
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout(800);
    }

    const allLinks = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("a[href]"))
        .map((a) => ({
          href: (a as HTMLAnchorElement).href,
          text: (a as HTMLAnchorElement).innerText?.trim().slice(0, 80) || "",
        }))
        .filter((l) => l.href.startsWith("http"));
    });

    const pageTitle = await page.title();
    const bodyText = await page.evaluate(() =>
      document.body.innerText.slice(0, 500)
    );

    return NextResponse.json({
      url,
      pageTitle,
      bodyPreview: bodyText,
      totalLinks: allLinks.length,
      links: allLinks.slice(0, 50), // first 50 links
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    await browser.close();
  }
}