"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCRMStore } from "@/hooks/useCRMStore";
import type { CRMItem } from "@/types/crm";
import { SidebarDrawer } from "@/components/layout/Sidebardrawer";
import ActiveEventCard from "@/components/active/ActiveEventCard";
import MilestoneModal, { type MilestoneKey } from "@/components/active/MilestoneModal";
import { notifySlack } from "@/lib/notifySlack";

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

/* ------------------ Loading Skeleton ------------------ */

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
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

/* ------------------ New Event Modal ------------------ */

function NewEventModal({
  open,
  onClose,
  onSave,
  saving = false,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (payload: {
    title: string;
    platform: "BookMyShow" | "District" | "SortMyScene" | "Other";
    eventType: string;
    manager: string;
    orgName?: string;
    eventName?: string;
    city?: string;
    venue?: string;
    eventLink?: string;
    startDate?: string;
    endDate?: string;
    sourceType?: "Venue" | "Organizer";
  }) => Promise<void> | void;
  saving?: boolean;
}) {
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState<
    "BookMyShow" | "District" | "SortMyScene" | "Other"
  >("Other");
  const [eventType, setEventType] = useState("");
  const [manager, setManager] = useState("JD");

  const [orgName, setOrgName] = useState("");
  const [eventName, setEventName] = useState("");
  const [city, setCity] = useState("");
  const [venue, setVenue] = useState("");
  const [eventLink, setEventLink] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sourceType, setSourceType] = useState<"Venue" | "Organizer">("Organizer");

  const [errors, setErrors] = useState<{
    title?: string;
    manager?: string;
    eventLink?: string;
    endDate?: string;
  }>({});

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setPlatform("Other");
    setEventType("");
    setManager("");
    setOrgName("");
    setEventName("");
    setCity("");
    setVenue("");
    setEventLink("");
    setStartDate("");
    setEndDate("");
    setSourceType("Organizer");
    setErrors({});
  }, [open]);

  if (!open) return null;

  function isValidUrl(value: string) {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  function validateForm() {
    const nextErrors: {
      title?: string;
      manager?: string;
      eventLink?: string;
      endDate?: string;
    } = {};

    if (!title.trim()) nextErrors.title = "Title is required.";
    if (!manager.trim()) nextErrors.manager = "Manager is required.";

    if (!eventLink.trim()) {
      nextErrors.eventLink = "Event link is required.";
    } else if (!isValidUrl(eventLink.trim())) {
      nextErrors.eventLink = "Enter a valid URL.";
    }

    if (startDate && endDate && endDate < startDate) {
      nextErrors.endDate = "End date cannot be before start date.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  const canSave =
    title.trim().length > 0 &&
    manager.trim().length > 0 &&
    eventLink.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0B0B10] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Create New Event</div>
            <div className="mt-1 text-sm text-white/50">
              This will add a new event directly to Active Events.
            </div>
          </div>

          <button
            className="rounded-full bg-white/5 px-3 py-1 text-sm text-white/70 hover:bg-white/10 disabled:opacity-40"
            onClick={onClose}
            type="button"
            disabled={saving}
          >
            ✕
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Title */}
          <div className="sm:col-span-2">
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((p) => ({ ...p, title: undefined }));
              }}
              placeholder="Title"
              className={`w-full rounded-xl border bg-black/40 px-3 py-2 text-sm ${
                errors.title ? "border-red-500/60" : "border-white/10"
              }`}
            />
            {errors.title && (
              <div className="mt-1 text-xs text-red-400">{errors.title}</div>
            )}
          </div>

          {/* Platform */}
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as any)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
          >
            <option>BookMyShow</option>
            <option>District</option>
            <option>SortMyScene</option>
            <option>Other</option>
          </select>

          {/* Event Type */}
          <input
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            placeholder="Event Type"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
          />

          {/* Manager */}
          <div>
            <input
              value={manager}
              onChange={(e) => {
                setManager(e.target.value);
                if (errors.manager) setErrors((p) => ({ ...p, manager: undefined }));
              }}
              placeholder="Manager"
              className={`w-full rounded-xl border bg-black/40 px-3 py-2 text-sm ${
                errors.manager ? "border-red-500/60" : "border-white/10"
              }`}
            />
            {errors.manager && (
              <div className="mt-1 text-xs text-red-400">{errors.manager}</div>
            )}
          </div>

          {/* Org Name */}
          <input
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="Organizer Name"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
          />

          {/* Event Name */}
          <input
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="Event Name"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
          />

          {/* City */}
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
          />

          {/* Venue */}
          <input
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="Venue"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
          />

          {/* Event Link */}
          <div className="sm:col-span-2">
            <input
              value={eventLink}
              onChange={(e) => {
                setEventLink(e.target.value);
                if (errors.eventLink) setErrors((p) => ({ ...p, eventLink: undefined }));
              }}
              placeholder="Event Link"
              className={`w-full rounded-xl border bg-black/40 px-3 py-2 text-sm ${
                errors.eventLink ? "border-red-500/60" : "border-white/10"
              }`}
            />
            {errors.eventLink && (
              <div className="mt-1 text-xs text-red-400">{errors.eventLink}</div>
            )}
          </div>

          {/* Start Date */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              if (errors.endDate) setErrors((p) => ({ ...p, endDate: undefined }));
            }}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
          />

          {/* End Date */}
          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                if (errors.endDate) setErrors((p) => ({ ...p, endDate: undefined }));
              }}
              className={`w-full rounded-xl border bg-black/40 px-3 py-2 text-sm ${
                errors.endDate ? "border-red-500/60" : "border-white/10"
              }`}
            />
            {errors.endDate && (
              <div className="mt-1 text-xs text-red-400">{errors.endDate}</div>
            )}
          </div>

          {/* Source Type */}
          <select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value as any)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
          >
            <option value="Organizer">Organizer</option>
            <option value="Venue">Venue</option>
          </select>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSave || saving}
            onClick={() => {
              if (!validateForm()) return;
              onSave({
                title: title.trim(),
                platform,
                eventType: eventType.trim() || "Other",
                manager: manager.trim(),
                orgName: orgName.trim() || undefined,
                eventName: eventName.trim() || undefined,
                city: city.trim() || undefined,
                venue: venue.trim() || undefined,
                eventLink: eventLink.trim(),
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                sourceType,
              });
            }}
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-40"
          >
            {saving ? "Saving..." : "Save Event"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------ Page ------------------ */

export default function ActiveEventsPage() {
  // ✅ Pull loading, error, refreshItems from store
  const { items, selected, selectItem, addItem, updateItem, loading, error, refreshItems } =
    useCRMStore();

  const [query, setQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("All");
  const [managerFilter, setManagerFilter] = useState<string>("All");

  const [milestoneOpen, setMilestoneOpen] = useState(false);
  const [milestoneItemId, setMilestoneItemId] = useState<string | null>(null);
  const [milestoneKey, setMilestoneKey] = useState<MilestoneKey | null>(null);

  const [newEventOpen, setNewEventOpen] = useState(false);
  const [creatingEvent, setCreatingEvent] = useState(false);

  // ✅ Fetch on mount
  useEffect(() => {
    refreshItems();
  }, []);

  const managers = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => i.manager && set.add(i.manager));
    return Array.from(set).sort();
  }, [items]);

  const activeItems = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return items
      .filter((i) => i.stage === "ACTIVE" && !i.disabled)
      .filter((i) => {
        if (!i.endDate) return true;
        const end = new Date(i.endDate);
        end.setHours(0, 0, 0, 0);
        return end >= today;
      })
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

  async function handleCreateNewEvent(payload: {
    title: string;
    platform: "BookMyShow" | "District" | "SortMyScene" | "Other";
    eventType: string;
    manager: string;
    orgName?: string;
    eventName?: string;
    city?: string;
    venue?: string;
    eventLink?: string;
    startDate?: string;
    endDate?: string;
    sourceType?: "Venue" | "Organizer";
  }) {
    try {
      setCreatingEvent(true);

      await notifySlack({
        event: "event_created",
        item: {
          title: payload.title,
          orgName: payload.orgName,
          eventName: payload.eventName,
          manager: payload.manager,
          platform: payload.platform,
          city: payload.city,
          venue: payload.venue,
          startDate: payload.startDate,
          endDate: payload.endDate,
          sourceType: payload.sourceType,
        },
      });

      await addItem({
        title: payload.title,
        platform: payload.platform,
        eventType: payload.eventType,
        manager: payload.manager,
        stage: "ACTIVE",
        orgName: payload.orgName,
        eventName: payload.eventName,
        city: payload.city,
        venue: payload.venue,
        eventLink: payload.eventLink,
        onboarding: {
          contactDetails: { checked: true, updatedAt: new Date().toISOString() },
          commissionSettled: { checked: true, updatedAt: new Date().toISOString() },
          partnerCreated: { checked: true, updatedAt: new Date().toISOString() },
        } as any,
        active: {
          orgVerified: { checked: false },
          discountAsked: { checked: false },
          promoCardShared: { checked: false },
          mysiteMade: { checked: false },
          mysiteGiven: { checked: false },
          promoFollowUp: { checked: false },
          discountFollowUp: { checked: false },
          firstSalesUpdate: { checked: false },
        } as any,
        disabled: false,
        activity: [
          { at: new Date().toISOString(), text: "Event created directly in Active" },
        ],
        startDate: payload.startDate,
        endDate: payload.endDate,
        sourceType: payload.sourceType,
      } as any);

      // ✅ Sync store from DB after creation
      await refreshItems();

      setNewEventOpen(false);
    } finally {
      setCreatingEvent(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Header */}
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
            <Link
              href="/expired-events"
              className="rounded-full px-3 py-1 text-sm text-white/60 hover:text-white"
            >
              Expired Events
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {/* ✅ Manual refresh button */}
            <button
              type="button"
              onClick={() => refreshItems()}
              disabled={loading}
              className="rounded-full bg-white/5 px-3 py-2 text-xs text-white/50 hover:bg-white/10 disabled:opacity-40"
              title="Refresh"
            >
              {loading ? "↻ Loading..." : "↻ Refresh"}
            </button>

            <button
              type="button"
              className="rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 px-4 py-2 text-sm font-medium"
              onClick={() => setNewEventOpen(true)}
            >
              + New Event
            </button>

            <div className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-xs">
              JD
            </div>
          </div>
        </div>
      </header>

      {/* Drawer */}
      <SidebarDrawer
        open={!!selected}
        item={selected}
        onClose={closeDrawer}
        onUpdated={async (updatedItem) => {
          await updateItem(updatedItem);
        }}
      />

      {/* Body */}
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
          <div className="text-sm font-medium text-white/70">ACTIVE EVENTS</div>
          <div className="text-sm font-medium text-white/40">
            {loading ? "—" : `${activeItems.length} items`}
          </div>
        </div>

        {/* ✅ Error state */}
        {error && !loading && (
          <div className="mb-4">
            <ErrorBanner message={error} onRetry={refreshItems} />
          </div>
        )}

        {/* ✅ Loading skeleton */}
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <div className="space-y-4">
            {activeItems.map((item) => (
              <ActiveEventCard
                key={item.id}
                item={item}
                onOpen={openDrawer}
                onMilestoneClick={handleMilestoneClick}
              />
            ))}

            {activeItems.length === 0 && !error && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/60">
                No Active Events yet. Complete all onboarding steps to move items here.
              </div>
            )}
          </div>
        )}
      </section>

      {/* Milestone Modal */}
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

            await notifySlack({
              event: "milestone_updated",
              item: {
                title: milestoneItem.title,
                orgName: milestoneItem.orgName,
                eventName: milestoneItem.eventName,
                manager: milestoneItem.manager,
                platform: milestoneItem.platform,
                city: milestoneItem.city,
                venue: milestoneItem.venue,
                startDate: milestoneItem.startDate,
                endDate: milestoneItem.endDate,
                sourceType: milestoneItem.sourceType,
              },
              stepName: result.key,
              extra: {
                "Discount Value": result.discountValue,
                "Promo Accepted": result.promoAccepted,
              },
            });

            setMilestoneOpen(false);
            setMilestoneItemId(null);
            setMilestoneKey(null);
          }}
        />
      ) : null}

      {/* New Event Modal */}
      <NewEventModal
        open={newEventOpen}
        onClose={() => setNewEventOpen(false)}
        onSave={handleCreateNewEvent}
        saving={creatingEvent}
      />
    </main>
  );
}