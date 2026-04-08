"use client";

import { useState } from "react";
import type { ScrapedEvent } from "@/lib/scrapers/BookMyShow";

type Props = {
  open: boolean;
  onClose: () => void;
  onImport: (events: ScrapedEvent[]) => Promise<void>;
};

export function DiscoverEventsModal({ open, onClose, onImport }: Props) {
  const [city, setCity] = useState("Bangalore");
  const [scraping, setScraping] = useState(false);
  const [importing, setImporting] = useState(false);
  const [events, setEvents] = useState<ScrapedEvent[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");
  const [scraped, setScraped] = useState(false);

  async function handleScrape() {
    if (!city.trim()) return;
    setScraping(true);
    setError("");
    setEvents([]);
    setSelected(new Set());
    setScraped(false);

    try {
      const res = await fetch("/api/discover/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: city.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Scraping failed.");
        return;
      }

      setEvents(data.events ?? []);
      // Select all by default
      setSelected(new Set((data.events ?? []).map((_: any, i: number) => i)));
      setScraped(true);
    } catch {
      setError("Failed to connect to scraper. Please try again.");
    } finally {
      setScraping(false);
    }
  }

  async function handleImport() {
    const toImport = events.filter((_, i) => selected.has(i));
    if (toImport.length === 0) return;

    setImporting(true);
    try {
      await onImport(toImport);
      onClose();
    } finally {
      setImporting(false);
    }
  }

  function toggleSelect(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === events.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(events.map((_, i) => i)));
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#0B0B10] shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-white/10">
          <div>
            <div className="text-lg font-semibold">Discover Events</div>
            <div className="mt-1 text-sm text-white/50">
              Scrape new events from BookMyShow, District, and SortMyScene
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/5 px-3 py-1 text-sm text-white/70 hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        {/* City input + trigger */}
        <div className="flex gap-3 p-5 border-b border-white/10">
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter city (e.g. Bangalore)"
            className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
            disabled={scraping}
          />
          <button
            type="button"
            onClick={handleScrape}
            disabled={scraping || !city.trim()}
            className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-500 px-4 py-2 text-sm font-medium disabled:opacity-40"
          >
            {scraping ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">↻</span> Scraping...
              </span>
            ) : (
              "🔍 Discover"
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-5 mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            ⚠ {error}
          </div>
        )}

        {/* Loading state */}
        {scraping && (
          <div className="flex flex-col items-center justify-center py-12 text-white/50 text-sm gap-3">
            <div className="text-3xl animate-bounce">🔍</div>
            <div>Scraping BookMyShow, District, SortMyScene...</div>
            <div className="text-xs text-white/30">This may take 20-40 seconds</div>
          </div>
        )}

        {/* Results */}
        {scraped && !scraping && (
          <>
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
              <div className="text-sm text-white/60">
                {events.length === 0
                  ? "No new events found"
                  : `${events.length} new events found — ${selected.size} selected`}
              </div>
              {events.length > 0 && (
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-xs text-white/50 hover:text-white"
                >
                  {selected.size === events.length ? "Deselect all" : "Select all"}
                </button>
              )}
            </div>

            <div className="overflow-y-auto flex-1">
              {events.length === 0 ? (
                <div className="p-8 text-center text-sm text-white/40">
                  All events from this city are already in your CRM, or no events were found.
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {events.map((event, i) => (
                    <div
                      key={i}
                      onClick={() => toggleSelect(i)}
                      className={`flex items-start gap-3 px-5 py-3 cursor-pointer hover:bg-white/5 transition-colors ${
                        selected.has(i) ? "bg-white/5" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <div
                        className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border ${
                          selected.has(i)
                            ? "border-fuchsia-500 bg-fuchsia-500"
                            : "border-white/20 bg-transparent"
                        }`}
                      >
                        {selected.has(i) && (
                          <span className="text-xs text-white">✓</span>
                        )}
                      </div>

                      {/* Event details */}
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{event.title}</div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-white/50">
                          <span className="rounded-full bg-white/5 px-2 py-0.5">
                            {event.platform}
                          </span>
                          {event.venue && event.venue !== "—" && (
                            <span>📍 {event.venue}</span>
                          )}
                          {event.eventType && event.eventType !== "Event" && (
                            <span>🎭 {event.eventType}</span>
                          )}
                          {event.startDate && (
                            <span>📅 {event.startDate}</span>
                          )}
                        </div>
                        <a
                          href={event.eventLink}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="mt-0.5 block truncate text-xs text-fuchsia-400 hover:underline"
                        >
                          {event.eventLink}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        {scraped && events.length > 0 && (
          <div className="flex items-center justify-between gap-3 border-t border-white/10 p-4">
            <div className="text-sm text-white/40">
              {selected.size} event{selected.size !== 1 ? "s" : ""} will be imported as leads
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={selected.size === 0 || importing}
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-40"
              >
                {importing ? "Importing..." : `Import ${selected.size} Lead${selected.size !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}