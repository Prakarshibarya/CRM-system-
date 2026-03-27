"use client";

import { useState } from "react";

export default function DiscoverEventsPage() {

  const [events, setEvents] = useState<any[]>([]);

  async function fetchEvents() {

    const res = await fetch("/api/discover/bookmyshow");
    const data = await res.json();

    setEvents(data);
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">

      <h1 className="text-xl font-semibold mb-4">
        Discover Events
      </h1>

      <button
        onClick={fetchEvents}
        className="rounded bg-fuchsia-500 px-4 py-2"
      >
        Fetch BookMyShow Events
      </button>

      <div className="mt-6 space-y-4">

        {events.map((event, i) => (
          <div
            key={i}
            className="rounded border border-white/10 p-4 bg-black/40"
          >
            <div className="font-semibold">{event.title}</div>
            <div className="text-sm text-white/60">
              {event.city} • {event.venue}
            </div>

            <button
              className="mt-2 text-sm text-fuchsia-400"
            >
              Create Lead
            </button>

          </div>
        ))}

      </div>

    </main>
  );
}