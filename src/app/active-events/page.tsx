"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { saveItems } from "@/lib/store";
import { useCRMStore } from "@/hooks/useCRMStore";
import type { CRMItem } from "@/types/crm";
import { SidebarDrawer } from "@/components/layout/Sidebardrawer";
import ActiveEventCard from "@/components/active/ActiveEventCard";
import MilestoneModal, { type MilestoneKey } from "@/components/active/MilestoneModal";

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

export default function ActiveEventsPage() {
  const router = useRouter();

  const { items, selected, selectItem, updateItem } = useCRMStore();

  const [query, setQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("All");
  const [managerFilter, setManagerFilter] = useState<string>("All");

  const [milestoneOpen, setMilestoneOpen] = useState(false);
  const [milestoneItemId, setMilestoneItemId] = useState<string | null>(null);
  const [milestoneKey, setMilestoneKey] = useState<MilestoneKey | null>(null);

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

  const milestoneItem = useMemo(() => {
    if (!milestoneItemId) return null;
    return items.find((i) => i.id === milestoneItemId) ?? null;
  }, [items, milestoneItemId]);

  function handleMilestoneClick(itemId: string, key: MilestoneKey) {
    setMilestoneItemId(itemId);
    setMilestoneKey(key);
    setMilestoneOpen(true);
  }
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

            {/* <button
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
            </button> */}

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
      onUpdated={(updatedItem) => {
        const next = items.map((x) => (x.id === updatedItem.id ? updatedItem : x));
        saveItems(next);
      }}
    />

      <section className="mx-auto max-w-7xl px-4 py-6">
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
      className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40"
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
      className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40"
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
      <ActiveEventCard
        key={item.id}
        item={item}
        onOpen={openDrawer}
        onMilestoneClick={handleMilestoneClick}
      />
    ))}

    {activeItems.length === 0 ? (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/60">
        No Active Events yet. Complete all onboarding steps to move items here.
      </div>
    ) : null}
  </div>
</section>

      {milestoneOpen && milestoneItem && milestoneKey ? (
          <MilestoneModal
            open={milestoneOpen}
            milestoneKey={milestoneKey}
            milestoneLabel={
              {
                orgVerified: "Listing shared & verified by organizer",
                discountAsked: "EB discount suggested",
                promoCardShared: "Courtesy promo rate card shared",
                mysiteMade: "Microsite created",
                mysiteGiven: "Microsite shared with organizer",
                promoFollowUp: "Asked if promo is needed",
                discountFollowUp: "Asked for customer discounts",
                firstSalesUpdate: "First ticket sales update sent",
              }[milestoneKey]
            }
            current={(milestoneItem.active as any)?.[milestoneKey]}
            onClose={() => {
              setMilestoneOpen(false);
              setMilestoneItemId(null);
              setMilestoneKey(null);
            }}
            onSave={async (result) => {
              const currentActive = (milestoneItem.active ?? {}) as Record<string, any>;

              await updateItem(
                {
                  ...milestoneItem,
                  active: {
                    ...currentActive,
                    [result.key]: result,
                  },
                } as any,
                `Active milestone updated: ${result.key}`
              );

              setMilestoneOpen(false);
              setMilestoneItemId(null);
              setMilestoneKey(null);
            }}
          />
        ) : null}
    </main>
  );
}