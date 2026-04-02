"use client";
import { Suspense } from "react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { notifySlack } from "@/lib/notifySlack";
import OnboardingCard from "../../components/onboarding/OnboardingCard";
import OnboardingStepModal, {
  type OnboardingKey,
  type OnboardingMeta,
} from "../../components/onboarding/OnboardingStepModal";
import { SidebarDrawer } from "../../components/layout/Sidebardrawer";

import { useCRMStore } from "@/hooks/useCRMStore";
import type { CRMItem } from "@/types/crm";
import { DiscoverEventsModal } from "@/components/discovery/DiscoverEventsModal";

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
          className="h-24 w-full animate-pulse rounded-2xl border border-white/10 bg-white/5"
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

/* ------------------ New Lead Modal ------------------ */

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-sm text-white/60">{label}</div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function NewLeadModal({
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
  const [eventType, setEventType] = useState("Other");
  const [manager, setManager] = useState("JD");
  //const [discoverOpen, setDiscoverOpen] = useState(false);

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
    if (!manager.trim()) nextErrors.manager = "Account manager is required.";

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
            <div className="text-lg font-semibold">Create New Lead</div>
            <div className="mt-1 text-sm text-white/50">
              Fill details → Save → it will appear in the list and open in the drawer.
            </div>
          </div>
          <button
            className="rounded-full bg-white/5 px-3 py-1 text-sm text-white/70 hover:bg-white/10"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Title (required)">
              <input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((p) => ({ ...p, title: undefined }));
                }}
                placeholder="e.g., Sunburn Goa — EDM Night"
                className={`w-full rounded-xl border bg-black/40 px-3 py-2 text-sm ${
                  errors.title ? "border-red-500/60" : "border-white/10"
                }`}
              />
            </Field>
            {errors.title && (
              <div className="mt-1 text-xs text-red-400">{errors.title}</div>
            )}
          </div>

          <Field label="Platform">
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
          </Field>

          <Field label="Event Type">
            <input
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              placeholder="Music / Comedy / Tech / etc."
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
            />
          </Field>

          <div>
            <Field label="Account Manager (required)">
              <input
                value={manager}
                onChange={(e) => {
                  setManager(e.target.value);
                  if (errors.manager) setErrors((p) => ({ ...p, manager: undefined }));
                }}
                placeholder="e.g., JD"
                className={`w-full rounded-xl border bg-black/40 px-3 py-2 text-sm ${
                  errors.manager ? "border-red-500/60" : "border-white/10"
                }`}
              />
            </Field>
            {errors.manager && (
              <div className="mt-1 text-xs text-red-400">{errors.manager}</div>
            )}
          </div>

          <Field label="Organizer Name">
            <input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g., ABC Events"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
            />
          </Field>

          <Field label="Start Date">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (errors.endDate) setErrors((p) => ({ ...p, endDate: undefined }));
              }}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
            />
          </Field>

          <div>
            <Field label="End Date">
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
            </Field>
            {errors.endDate && (
              <div className="mt-1 text-xs text-red-400">{errors.endDate}</div>
            )}
          </div>

          <Field label="Source Type">
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value as "Venue" | "Organizer")}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
            >
              <option value="Organizer">Organizer</option>
              <option value="Venue">Venue</option>
            </select>
          </Field>

          <Field label="City">
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g., Bangalore"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
            />
          </Field>

          <Field label="Venue">
            <input
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g., Phoenix Mall"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Event Link (required)">
              <input
                value={eventLink}
                onChange={(e) => {
                  setEventLink(e.target.value);
                  if (errors.eventLink) setErrors((p) => ({ ...p, eventLink: undefined }));
                }}
                placeholder="https://..."
                className={`w-full rounded-xl border bg-black/40 px-3 py-2 text-sm ${
                  errors.eventLink ? "border-red-500/60" : "border-white/10"
                }`}
              />
            </Field>
            {errors.eventLink && (
              <div className="mt-1 text-xs text-red-400">{errors.eventLink}</div>
            )}
          </div>
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
            {saving ? "Saving..." : "Save Lead"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------ Page Inner (uses useSearchParams) ------------------ */

function OnboardingPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    items,
    selected,
    selectItem,
    loading,
    error,
    refreshItems,
    addItem: addItemToStore,
    updateItem: updateItemInStore,
    sessionUser,
  } = useCRMStore();

  const [query, setQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("All");
  const [managerFilter, setManagerFilter] = useState<string>("All");

  const [stepModalOpen, setStepModalOpen] = useState(false);
  const [modalItemId, setModalItemId] = useState<string | null>(null);
  const [modalKey, setModalKey] = useState<OnboardingKey>("contactDetails");
  const [modalCurrent, setModalCurrent] = useState<OnboardingMeta | undefined>(undefined);

  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [creatingLead, setCreatingLead] = useState(false);
  const [discoverOpen, setDiscoverOpen] = useState(false);

  useEffect(() => {
    refreshItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const v = searchParams.get("new");
    if (v === "1") setNewLeadOpen(true);
  }, [searchParams]);

  const managers = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => i.manager && set.add(i.manager));
    return Array.from(set).sort();
  }, [items]);

  const onboardingItems = useMemo(() => {
    return items
      .filter((i) => i.stage === "ONBOARDING" && !i.disabled)
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

  function openStep(itemId: string, key: OnboardingKey) {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const current = (item.onboarding?.[key] || { checked: false }) as OnboardingMeta;
    setModalItemId(itemId);
    setModalKey(key);
    setModalCurrent(current);
    setStepModalOpen(true);
  }

  function closeStep() {
    setStepModalOpen(false);
    setModalItemId(null);
    setModalCurrent(undefined);
  }

  async function saveStep(meta: OnboardingMeta) {
    if (!modalItemId) return;

    const now = meta.updatedAt || new Date().toISOString();
    const item = items.find((i) => i.id === modalItemId);
    if (!item) return;

    const onboarding = (item.onboarding || {}) as Record<string, OnboardingMeta>;

    const nextOnboarding: Record<string, OnboardingMeta> = {
      ...onboarding,
      [modalKey]: { ...meta, checked: true, updatedAt: now },
    };

    const allDone =
      !!nextOnboarding.contactDetails?.checked &&
      !!nextOnboarding.commissionSettled?.checked &&
      !!nextOnboarding.partnerCreated?.checked;

    const label =
      modalKey === "contactDetails"
        ? "Contact details found"
        : modalKey === "commissionSettled"
        ? "Commission settled"
        : "Partner created";

    const updatedItem: CRMItem = {
      ...item,
      stage: allDone ? "ACTIVE" : item.stage,
      onboarding: nextOnboarding,
      activity: [
        ...(allDone ? [{ at: now, text: "Moved to Active Events" }] : []),
        { at: now, text: `Onboarding: ${label}` },
        ...(item.activity || []),
      ],
    };

    try {
      await updateItemInStore(updatedItem);
      await notifySlack({
        event: "onboarding_step_completed",
        item: {
          title: updatedItem.title,
          orgName: updatedItem.orgName,
          eventName: updatedItem.eventName,
          manager: updatedItem.manager,
          platform: updatedItem.platform,
          city: updatedItem.city,
          venue: updatedItem.venue,
          startDate: updatedItem.startDate,
          endDate: updatedItem.endDate,
          sourceType: updatedItem.sourceType,
        },
        stepName: label,
        extra:
          modalKey === "commissionSettled"
            ? { "Commission Value": meta.commissionValue }
            : modalKey === "partnerCreated"
            ? { "Partner Email": meta.partnerEmail }
            : {},
      });
      if (allDone) router.push("/active-events");
    } catch (e) {
      console.error("Failed to persist onboarding step:", e);
    }
  }

  async function handleCreateNewLead(payload: {
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
      setCreatingLead(true);

      const onboardingDefaults = {
        contactDetails: { checked: false },
        commissionSettled: { checked: false },
        partnerCreated: { checked: false },
      };

      const activeDefaults = {
        orgVerified: { checked: false },
        discountAsked: { checked: false },
        promoCardShared: { checked: false },
        mysiteMade: { checked: false },
        mysiteGiven: { checked: false },
        promoFollowUp: { checked: false },
        discountFollowUp: { checked: false },
        firstSalesUpdate: { checked: false },
      };

      const created = await addItemToStore({
        title: payload.title,
        platform: payload.platform,
        eventType: payload.eventType,
        manager: payload.manager,
        stage: "ONBOARDING",
        orgName: payload.orgName,
        eventName: payload.eventName,
        city: payload.city,
        venue: payload.venue,
        eventLink: payload.eventLink,
        startDate: payload.startDate,
        endDate: payload.endDate,
        sourceType: payload.sourceType,
        onboarding: onboardingDefaults as any,
        active: activeDefaults as any,
        disabled: false,
      } as any);

      await notifySlack({
        event: "lead_created",
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

      if (created?.id) {
        selectItem(created.id);
      }

      setNewLeadOpen(false);
    } finally {
      setCreatingLead(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <div className="text-lg font-semibold">Organizer Onboarding</div>

          <nav className="flex rounded-full bg-white/5 p-1">
            <Link href="/onboarding" className="rounded-full bg-white/10 px-3 py-1 text-sm">
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
              className="rounded-full px-3 py-1 text-sm text-white/60 hover:text-white"
            >
              Expired Events
            </Link>
          </nav>

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

            <button
              type="button"
              className="rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 px-4 py-2 text-sm font-medium"
              onClick={() => setNewLeadOpen(true)}
            >
              + New Lead
            </button>
            <button
              type="button"
              onClick={() => setDiscoverOpen(true)}
              className="rounded-full bg-white/5 px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/10 border border-white/10"
            >
              🔍 Discover Events
            </button>

            <button
              type="button"
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                window.location.href = "/login";
              }}
              className="rounded-full bg-white/5 px-3 py-2 text-xs text-white/50 hover:bg-white/10"
            >
              Logout
          </button>
          </div>
        </div>
      </header>

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

        {error && !loading && (
          <div className="mb-4">
            <ErrorBanner message={error} onRetry={refreshItems} />
          </div>
        )}

        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-medium text-white/70">ORGANIZER / EVENT</div>
          <div className="text-sm font-medium text-white/40">
            {loading ? "—" : `${onboardingItems.length} items`}
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : (
          <div className="space-y-4">
            {onboardingItems.map((item) => (
              <OnboardingCard
                key={item.id}
                item={item}
                onOpen={openDrawer}
                onStepClick={openStep}
              />
            ))}

            {onboardingItems.length === 0 && !error && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/60">
                No items in Onboarding. Create a new lead to start.
              </div>
            )}
          </div>
        )}
      </section>
      <DiscoverEventsModal
  open={discoverOpen}
  onClose={() => setDiscoverOpen(false)}
  onImport={async (events) => {
    for (const event of events) {
      await addItemToStore({
        title: event.title,
        platform: event.platform as any,
        eventType: event.eventType,
        manager: sessionUser?.name ?? "AUTO",
        stage: "ONBOARDING",
        eventName: event.eventName,
        city: event.city,
        venue: event.venue,
        eventLink: event.eventLink,
        startDate: event.startDate,
        onboarding: { contactDetails: { checked: false }, commissionSettled: { checked: false }, partnerCreated: { checked: false } } as any,
        active: { orgVerified: { checked: false }, discountAsked: { checked: false }, promoCardShared: { checked: false }, mysiteMade: { checked: false }, mysiteGiven: { checked: false }, promoFollowUp: { checked: false }, discountFollowUp: { checked: false }, firstSalesUpdate: { checked: false } } as any,
        disabled: false,
      } as any);
    }
    await refreshItems();
  }}
/>

      <OnboardingStepModal
        open={stepModalOpen}
        stepKey={modalKey}
        current={modalCurrent}
        onClose={closeStep}
        onSave={async (meta: OnboardingMeta) => {
          await saveStep(meta);
          closeStep();
        }}
      />

      <SidebarDrawer
        open={!!selected}
        item={selected}
        onClose={closeDrawer}
        onUpdated={async (updatedItem) => {
          await updateItemInStore(updatedItem);
        }}
      />

      <NewLeadModal
        open={newLeadOpen}
        onClose={() => {
          if (creatingLead) return;
          setNewLeadOpen(false);
        }}
        onSave={handleCreateNewLead}
        saving={creatingLead}
      />
    </main>
  );
}

/* ------------------ Default Export with Suspense ------------------ */

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <OnboardingPageInner />
    </Suspense>
  );
}