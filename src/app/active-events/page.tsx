"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useCRMStore } from "@/hooks/useCRMStore";
import type { CRMItem } from "@/types/crm";

/* ------------------ Filters ------------------ */

type PlatformFilter = "All" | "BookMyShow" | "District" | "SortMyScene" | "Other";

function matchesQuery(item: CRMItem, q: string) {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;

  return [
    item.title,
    item.orgName,
    item.eventName,
    item.platform,
    item.eventType,
    item.city,
    item.venue,
    item.manager,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(needle);
}

function formatTime(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleString();
}

export default function ActiveEventsPage() {
  const router = useRouter();

  const { items, selected, selectedId, selectItem, updateItem } = useCRMStore();

  const [query, setQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("All");
  const [managerFilter, setManagerFilter] = useState<string>("All");

  const managers = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => i.manager && set.add(i.manager));
    return Array.from(set).sort();
  }, [items]);

  const activeItems = useMemo(() => {
    return items
      .filter((i) => i.stage === "ACTIVE" && !i.disabled)
      .filter((i) => (platformFilter === "All" ? true : i.platform === platformFilter))
      .filter((i) => (managerFilter === "All" ? true : i.manager === managerFilter))
      .filter((i) => matchesQuery(i, query));
  }, [items, platformFilter, managerFilter, query]);

  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <div className="text-lg font-semibold">Organizer Onboarding</div>

          <nav className="flex rounded-full bg-white/5 p-1">
            <Link
              href="/onboarding"
              className="rounded-full px-3 py-1 text-sm text-white/60 hover:text-white"
            >
              Onboarding
            </Link>
            <Link
              href="/active-events"
              className="rounded-full bg-white/10 px-3 py-1 text-sm"
            >
              Active Events
            </Link>
            <Link
              href="/disabled"
              className="rounded-full px-3 py-1 text-sm text-white/60 hover:text-white"
            >
              Disabled
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 px-4 py-2 text-sm font-medium"
              onClick={() => router.push("/onboarding?new=1")}
            >
              + New Event
            </button>

            <button
              type="button"
              className="rounded-full bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 disabled:opacity-40"
              disabled={!selected}
              onClick={async () => {
                if (!selected) return;
                const reason = prompt("Disable reason? (optional)") ?? "";
                const now = new Date().toISOString();

                await updateItem(
                  {
                    ...selected,
                    disabled: true,
                    disabledReason: reason || undefined,
                    disabledAt: now,
                  } as any,
                  `Lead disabled${reason ? `: ${reason}` : ""}`
                );

                selectItem(null);
                router.push("/disabled");
              }}
            >
              Disable Selected
            </button>

            <div className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-xs">
              JD
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
          />

          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value as PlatformFilter)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
          >
            <option value="All">All platforms</option>
            <option value="BookMyShow">BookMyShow</option>
            <option value="District">District</option>
            <option value="SortMyScene">SortMyScene</option>
            <option value="Other">Other</option>
          </select>

          <select
            value={managerFilter}
            onChange={(e) => setManagerFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
          >
            <option value="All">All managers</option>
            {managers.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-medium text-white/70">ACTIVE EVENTS</div>
          <div className="text-sm font-medium text-white/40">{activeItems.length} items</div>
        </div>

        <div className="space-y-4">
          {activeItems.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => selectItem(item.id)}
                    className="block w-full text-left"
                    title="Open details"
                  >
                    <div className="truncate text-base font-semibold">{item.title}</div>
                  </button>
                  <div className="mt-1 text-sm text-white/50">
                    Found on {item.platform} • {item.eventType}
                  </div>
                  <div className="mt-2 text-xs text-white/40">AM: {item.manager}</div>
                </div>

                <div className="text-xs text-white/40">
                  Updated: {formatTime((item as any).updatedAt)}
                </div>
              </div>
            </div>
          ))}

          {activeItems.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/60">
              No Active Events yet. Complete all onboarding steps to move items here.
            </div>
          ) : null}
        </div>

        {/* simple right drawer preview */}
        {selected ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-lg font-semibold">{selected.title}</div>
                <div className="mt-1 text-sm text-white/50">
                  {selected.platform} • {selected.eventType} • AM: {selected.manager}
                </div>
              </div>
              <button
                type="button"
                className="rounded-full bg-white/5 px-3 py-1 text-sm text-white/70 hover:bg-white/10"
                onClick={() => selectItem(null)}
              >
                ✕
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
