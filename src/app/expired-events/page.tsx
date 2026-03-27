"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CRMItem } from "@/types/crm";
import { useCRMStore } from "@/hooks/useCRMStore";
import { SidebarDrawer } from "@/components/layout/Sidebardrawer";
import ActiveEventCard from "@/components/active/ActiveEventCard";

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

/* ------------------ Loading Skeleton ------------------ */

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="h-28 w-full animate-pulse rounded-2xl border border-white/10 bg-white/5"
        />
      ))}
    </div>
  );
}

/* ------------------ Error Banner ------------------ */

function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
      <span>⚠ {message}</span>
      <button
        type="button"
        onClick={onRetry}
        className="ml-4 rounded-lg bg-red-500/20 px-3 py-1 text-xs font-medium text-red-300 hover:bg-red-500/30"
      >
        Retry
      </button>
    </div>
  );
}

/* ------------------ Page ------------------ */

export default function ExpiredEventsPage() {
  // ✅ CHANGE 1: Pull loading, error, refreshItems from store
  const { items, selected, selectItem, updateItem, loading, error, refreshItems } =
    useCRMStore();

  const [query, setQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("All");
  const [managerFilter, setManagerFilter] = useState<string>("All");

  // ✅ CHANGE 2: Fetch fresh data from DB on mount
  useEffect(() => {
    refreshItems();
  }, []);

  const managers = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => i.manager && set.add(i.manager));
    return Array.from(set).sort();
  }, [items]);

  const expiredItems = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return items
      .filter((i) => i.stage === "ACTIVE" && !i.disabled)
      .filter((i) => {
        if (!i.endDate) return false;
        const end = new Date(i.endDate);
        end.setHours(0, 0, 0, 0);
        return end < today;
      })
      .filter((i) => (platformFilter === "All" ? true : i.platform === platformFilter))
      .filter((i) => (managerFilter === "All" ? true : i.manager === managerFilter))
      .filter((i) => matchesQuery(i, query));
  }, [items, platformFilter, managerFilter, query]);

  function openDrawer(id: string) {
    selectItem(id);
  }

  function closeDrawer() {
    selectItem(null);
  }

  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
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
              className="rounded-full px-3 py-1 text-sm text-white/60 hover:text-white"
            >
              Active Events
            </Link>
            <Link
              href="/disabled"
              className="rounded-full px-3 py-1 text-sm text-white/60 hover:text-white"
            >
              Disabled
            </Link>
            <Link
              href="/expired-events"
              className="rounded-full bg-white/10 px-3 py-1 text-sm"
            >
              Expired Events
            </Link>
            
          </nav>

          {/* ✅ CHANGE 3: Refresh button in header */}
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => refreshItems()}
              disabled={loading}
              className="rounded-full bg-white/5 px-3 py-2 text-xs text-white/50 hover:bg-white/10 disabled:opacity-40"
              title="Refresh"
            >
              {loading ? "↻ Loading..." : "↻ Refresh"}
            </button>

            <div className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-xs">
              JD
            </div>
          </div>
        </div>
      </header>

      <SidebarDrawer
        open={!!selected}
        item={selected}
        onClose={closeDrawer}
        onUpdated={async (updatedItem) => {
          await updateItem(updatedItem);
        }}
      />

      <section className="mx-auto max-w-7xl px-4 py-6">
        {/* Filters */}
        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Organizer / Event / City"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40"
          />

          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value as PlatformFilter)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
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
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          >
            <option value="All">All managers</option>
            {managers.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Section heading */}
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-medium text-white/70">EXPIRED EVENTS</div>
          {/* ✅ CHANGE 4: Show dash while loading instead of stale count */}
          <div className="text-sm font-medium text-white/40">
            {loading ? "—" : `${expiredItems.length} items`}
          </div>
        </div>

        {/* ✅ CHANGE 5: Error banner with retry */}
        {error && !loading && (
          <div className="mb-4">
            <ErrorBanner message={error} onRetry={refreshItems} />
          </div>
        )}

        {/* ✅ CHANGE 6: Loading skeleton vs content */}
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <div className="space-y-4">
            {expiredItems.map((item) => (
              <ActiveEventCard
                key={item.id}
                item={item}
                onOpen={openDrawer}
                onMilestoneClick={() => {}}
              />
            ))}

            {expiredItems.length === 0 && !error && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/60">
                No expired events yet.
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}