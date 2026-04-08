from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
import time
import re
import os


BMS_CITY_SLUGS = {
    "bangalore": "bangalore",
    "bengaluru": "bangalore",
    "mumbai": "mumbai",
    "delhi": "ncr",
    "hyderabad": "hyderabad",
    "chennai": "chennai",
    "pune": "pune",
    "kolkata": "kolkata",
    "ahmedabad": "ahmedabad",
    "goa": "goa",
}


def _get_driver():
    options = Options()

    # keep headless off for debugging first
    # options.add_argument("--headless=new")

    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1400,2200")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)
    options.add_argument(
        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
    )

    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)
    driver.set_page_load_timeout(60)
    return driver


def _clean_text(text: str) -> str:
    if not text:
        return ""
    text = text.replace("\n", " ").replace("\r", " ")
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r"\s*book tickets?.*$", "", text, flags=re.IGNORECASE).strip()
    return text


def _valid_bms_link(href: str) -> bool:
    if not href:
        return False
    if href.startswith("/"):
        href = f"https://in.bookmyshow.com{href}"
    if "bookmyshow.com" not in href:
        return False
    if "/explore/" in href:
        return False
    if not any(x in href for x in ["/events/", "/activities/", "/plays/", "/sports/", "/comedy-shows/", "/music-shows/"]):
        return False
    return True


def _parse_bms_html(html: str, city: str) -> list[dict]:
    soup = BeautifulSoup(html, "html.parser")
    events = []
    seen = set()

    for a in soup.find_all("a", href=True):
        href = a["href"].strip()

        if href.startswith("/"):
            href = f"https://in.bookmyshow.com{href}"

        if not _valid_bms_link(href):
            continue

        if href in seen:
            continue
        seen.add(href)

        title = _clean_text(a.get_text(" ", strip=True))
        if len(title) < 4:
            img = a.find("img")
            if img:
                title = _clean_text(img.get("alt", ""))

        if len(title) < 4:
            slug = href.rstrip("/").split("/")[-1].split("?")[0]
            title = re.sub(r"[-_]+", " ", slug).strip().title()

        if len(title) < 4:
            continue

        events.append({
            "title": title[:140],
            "eventName": title[:140],
            "platform": "BookMyShow",
            "eventType": "Event",
            "city": city,
            "venue": "—",
            "eventLink": href,
            "startDate": None,
        })

    return events


def scrape_bookmyshow(city: str) -> list[dict]:
    print(f"[BMS] Scraping for city: {city}")
    slug = BMS_CITY_SLUGS.get(city.lower(), city.lower())
    url = f"https://in.bookmyshow.com/explore/events-{slug}"
    print(f"[BMS] URL: {url}")

    os.makedirs("debug_html", exist_ok=True)

    driver = None
    try:
        driver = _get_driver()
        driver.get(url)

        WebDriverWait(driver, 30).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )

        time.sleep(6)

        for _ in range(8):
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(2)

        print("[BMS] Current URL:", driver.current_url)
        print("[BMS] Page title:", driver.title)

        html = driver.page_source
        with open("debug_html/bms.html", "w", encoding="utf-8") as f:
            f.write(html)

        events = _parse_bms_html(html, city)
        print(f"[BMS] Found {len(events)} events")
        return events

    except Exception as e:
        print(f"[BMS] Failed: {e}")
        raise
    finally:
        if driver:
            driver.quit()