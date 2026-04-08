from fastapi import FastAPI
from pydantic import BaseModel
import traceback

from scraper.scrapers.bookmyshow import scrape_bookmyshow
from scraper.scrapers.district import scrape_district
from scraper.scrapers.sortmyscene import scrape_sortmyscene

app = FastAPI()


class ScrapeRequest(BaseModel):
    city: str


@app.post("/scrape")
def scrape(req: ScrapeRequest):
    city = req.city.strip()

    result = {
        "events": [],
        "total": 0,
        "city": city,
        "breakdown": {
            "bookmyshow": 0,
            "district": 0,
            "sortmyscene": 0,
        },
        "debug": {}
    }

    try:
        bms = scrape_bookmyshow(city)
        result["events"].extend(bms)
        result["breakdown"]["bookmyshow"] = len(bms)
        result["debug"]["bookmyshow"] = {"status": "ok", "count": len(bms)}
    except Exception as e:
        result["debug"]["bookmyshow"] = {
            "status": "error",
            "error": str(e),
            "trace": traceback.format_exc(),
        }

    try:
        district_events = scrape_district(city)
        result["events"].extend(district_events)
        result["breakdown"]["district"] = len(district_events)
        result["debug"]["district"] = {"status": "ok", "count": len(district_events)}
    except Exception as e:
        result["debug"]["district"] = {
            "status": "error",
            "error": str(e),
            "trace": traceback.format_exc(),
        }

    try:
        sms = scrape_sortmyscene(city)
        result["events"].extend(sms)
        result["breakdown"]["sortmyscene"] = len(sms)
        result["debug"]["sortmyscene"] = {"status": "ok", "count": len(sms)}
    except Exception as e:
        result["debug"]["sortmyscene"] = {
            "status": "error",
            "error": str(e),
            "trace": traceback.format_exc(),
        }

    result["total"] = len(result["events"])
    return result