import re
import time
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException
from webdriver_manager.chrome import ChromeDriverManager


DISTRICT_BASE_URL = "https://www.district.in/events"

CITY_ALIASES = {
    "bangalore": ["bangalore", "bengaluru"],
    "bengaluru": ["bangalore", "bengaluru"],
    "mumbai": ["mumbai"],
    "delhi": ["delhi", "new delhi", "ncr"],
    "hyderabad": ["hyderabad"],
    "chennai": ["chennai"],
    "pune": ["pune"],
    "kolkata": ["kolkata"],
    "goa": ["goa"],
}


def _get_driver():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1440,2200")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--no-sandbox")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)
    options.add_argument(
        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
    )

    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)
    driver.set_page_load_timeout(45)
    return driver


def _clean_text(text: str) -> str:
    if not text:
        return ""
    text = text.replace("\n", " ").replace("\r", " ")
    text = text.replace("â¹", "₹").replace("â", "-")
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r"\s*₹[\d,]+.*$", "", text).strip()
    text = re.sub(r"\s*Book tickets?.*$", "", text, flags=re.IGNORECASE).strip()
    return text


def _normalize_href(href: str) -> str:
    if href.startswith("/"):
        return f"https://www.district.in{href}"
    return href


def _is_valid_event_link(href: str) -> bool:
    if not href:
        return False

    href = _normalize_href(href)

    if "district.in" not in href:
        return False
    if "/events/" not in href:
        return False
    if "/artist" in href:
        return False

    last = href.rstrip("/").split("/")[-1].lower()

    bad_keywords = [
        "music-in-",
        "comedy-shows-in-",
        "sports-events-in-",
        "performances-in-",
        "food-drinks-in-",
        "fests-fairs-in-",
        "screenings-in-",
        "fitness-events-in-",
        "pet-in-",
        "art-exhibitions-in-",
        "conferences-in-",
        "expos-in-",
        "openmics-in-",
    ]

    if any(k in last for k in bad_keywords):
        return False

    return True


def _belongs_to_city(text: str, href: str, city: str) -> bool:
    aliases = CITY_ALIASES.get(city.lower(), [city.lower()])
    hay = f"{text} {href}".lower()
    return any(alias in hay for alias in aliases)


def _set_city(driver, city: str) -> bool:
    aliases = CITY_ALIASES.get(city.lower(), [city.lower()])
    wait = WebDriverWait(driver, 15)

    location_openers = [
        (By.XPATH, "//button[contains(., 'Location')]"),
        (By.XPATH, "//button[contains(., 'Select Location')]"),
        (By.XPATH, "//*[contains(text(), 'Select Location')]"),
        (By.XPATH, "//*[contains(text(), 'Location')]"),
        (By.XPATH, "//div[contains(., 'Select Location')]"),
    ]

    opened = False
    for locator in location_openers:
        try:
            elem = wait.until(EC.element_to_be_clickable(locator))
            driver.execute_script("arguments[0].click();", elem)
            opened = True
            print("[District] Location selector opened")
            break
        except Exception:
            continue

    if not opened:
        print("[District] Could not open location selector")
        return False

    time.sleep(2)

    for alias in aliases:
        city_locators = [
            (By.XPATH, f"//*[contains(translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'), '{alias}')]"),
            (By.XPATH, f"//button[contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'), '{alias}')]"),
            (By.XPATH, f"//div[contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'), '{alias}')]"),
            (By.XPATH, f"//span[contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'), '{alias}')]"),
        ]

        for locator in city_locators:
            try:
                elem = wait.until(EC.element_to_be_clickable(locator))
                driver.execute_script("arguments[0].click();", elem)
                print(f"[District] Selected city: {alias}")
                time.sleep(4)
                return True
            except Exception:
                continue

    print("[District] Could not find city option")
    return False


def scrape_district(city: str) -> list[dict]:
    print("### REAL DISTRICT SCRAPER RUNNING ###")
    print(f"[District] Scraping for city: {city}")

    driver = None

    try:
        driver = _get_driver()
        driver.get(DISTRICT_BASE_URL)

        WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        time.sleep(4)

        city_set = _set_city(driver, city)
        if not city_set:
            print("[District] City selection failed")
            return []

        for _ in range(5):
            try:
                driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(1.5)
            except WebDriverException:
                break

        html = driver.page_source

        with open("district_debug.html", "w", encoding="utf-8") as f:
            f.write(html)

        soup = BeautifulSoup(html, "html.parser")

        events = []
        seen = set()

        for a in soup.find_all("a", href=True):
            href = _normalize_href(a["href"].strip())

            if not _is_valid_event_link(href):
                continue

            text = _clean_text(a.get_text(" ", strip=True))

            if len(text) < 4:
                slug = href.rstrip("/").split("/")[-1].split("?")[0]
                text = re.sub(r"[-_]+", " ", slug).strip().title()
                text = _clean_text(text)

            if len(text) < 4:
                continue

            if not _belongs_to_city(text, href, city):
                continue

            key = (text.lower(), href)
            if key in seen:
                continue
            seen.add(key)

            events.append({
                "title": text[:140],
                "eventName": text[:140],
                "platform": "District",
                "eventType": "Event",
                "city": city,
                "venue": "—",
                "eventLink": href,
                "startDate": None,
            })

        print(f"[District] Final extracted events: {len(events)}")
        return events

    except TimeoutException:
        print("[District] Timed out")
        return []
    except Exception as e:
        print(f"[District] Failed: {e}")
        return []
    finally:
        if driver:
            try:
                driver.quit()
            except Exception:
                pass