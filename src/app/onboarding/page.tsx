"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import LeftSearchPanel from "../../components/layout/LeftSearchPanel";
import OnboardingCard from "../../components/onboarding/OnboardingCard";
import OnboardingStepModal, {
  type OnboardingKey,
  type OnboardingMeta,
} from "../../components/onboarding/OnboardingStepModal";
import { SidebarDrawer } from "../../components/layout/Sidebardrawer";

import { useCRMStore } from "@/hooks/useCRMStore";
import type { CRMItem } from "@/types/crm";
import {
  loadItems,
  saveItems,
  createItemInDB,
  updateItemInDB, // ✅ add this
  seedIfEmpty,
  updateItem,
  addItem,
  generateId,
  loadItemsFromDB,
} from "../../lib/store";


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
  }) => Promise<void> | void;
}) {
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState<
    "BookMyShow" | "District" | "SortMyScene" | "Other"
  >("Other");
  const [eventType, setEventType] = useState("Other");
  const [manager, setManager] = useState("JD");

  const [orgName, setOrgName] = useState("");
  const [eventName, setEventName] = useState("");
  const [city, setCity] = useState("");
  const [venue, setVenue] = useState("");
  const [eventLink, setEventLink] = useState("");

  // reset when opened
  useEffect(() => {
    if (!open) return;
    setTitle("");
    setPlatform("Other");
    setEventType("Other");
    setManager("JD");
    setOrgName("");
    setEventName("");
    setCity("");
    setVenue("");
    setEventLink("");
  }, [open]);

  if (!open) return null;

  const canSave = title.trim().length > 2 && manager.trim().length > 0;

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
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Sunburn Goa — EDM Night"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
              />
            </Field>
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

          <Field label="Account Manager (required)">
            <input
              value={manager}
              onChange={(e) => setManager(e.target.value)}
              placeholder="e.g., JD"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
            />
          </Field>

          <Field label="Organizer Name">
            <input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g., ABC Events"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
            />
          </Field>

          <Field label="Event Name">
            <input
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g., Winter Carnival"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
            />
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
            <Field label="Event Link">
              <input
                value={eventLink}
                onChange={(e) => setEventLink(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
              />
            </Field>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={() =>
              onSave({
                title: title.trim(),
                platform,
                eventType: eventType.trim() || "Other",
                manager: manager.trim() || "JD",
                orgName: orgName.trim() || undefined,
                eventName: eventName.trim() || undefined,
                city: city.trim() || undefined,
                venue: venue.trim() || undefined,
                eventLink: eventLink.trim() || undefined,
              })
            }
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-40"
          >
            Save Lead
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------ Page ------------------ */

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ✅ shared store (DB-backed)
  const {
    items,
    selected,
    selectedId,
    selectItem,
    addItem: addItemToStore,
    updateItem: updateItemInStore,
  } = useCRMStore();
  //const [items, setItems] = useState<CRMItem[]>([]);

  // Left panel filters
  const [query, setQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("All");
  const [managerFilter, setManagerFilter] = useState<string>("All");

  // Step modal
  const [stepModalOpen, setStepModalOpen] = useState(false);
  const [modalItemId, setModalItemId] = useState<string | null>(null);
  const [modalKey, setModalKey] = useState<OnboardingKey>("contactDetails");
  const [modalCurrent, setModalCurrent] = useState<OnboardingMeta | undefined>(
    undefined
  );

  // New Lead modal
  const [newLeadOpen, setNewLeadOpen] = useState(false);

  // Auto-open New Lead modal if /onboarding?new=1
  useEffect(() => {
    const v = searchParams.get("new");
    if (v === "1") {
      setNewLeadOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // 1) Build next onboarding state
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

  // 2) ✅ Optimistic UI (instant ticks + sidebar update)
  updateItemInStore(updatedItem);

  // 3) Persist to DB (background)
  try {
    await updateItemInDB(updatedItem);

    // 4) Navigate if onboarding completed
    if (allDone) {
      router.push("/active-events");
    }
  } catch (e) {
    console.error("Failed to persist onboarding step:", e);
  }
}

  
  



async function disableSelected() {
  if (!selected) return;

  const reason = prompt("Disable reason? (optional)") ?? "";
  const now = new Date().toISOString();

  const updated: CRMItem = {
    ...selected,
    disabled: true,
    disabledReason: reason || undefined,
    disabledAt: now,
  };

  // optimistic UI
  const optimistic = items.map((x) => (x.id === updated.id ? updated : x));
  saveItems(optimistic);
  saveItems(optimistic);

  // DB persist
  try {
    const saved = await updateItemInDB(updated);
    const next = optimistic.map((x) => (x.id === saved.id ? saved : x));
    saveItems(next);
    saveItems(next);
    router.push("/disabled");
  } catch (e) {
    console.error("Disable failed:", e);
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
}) {
  // defaults for checklists
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

    onboarding: onboardingDefaults as any,
    active: activeDefaults as any,

    disabled: false,
  } as any);

  // open drawer on the newly created item
  if (created?.id) selectItem(created.id);

  // close modal and remove ?new=1
  setNewLeadOpen(false);
  router.replace("/onboarding");
}


  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <div className="text-lg font-semibold">Organizer Onboarding</div>

          <nav className="flex rounded-full bg-white/5 p-1">
            <Link
              href="/onboarding"
              className="rounded-full bg-white/10 px-3 py-1 text-sm"
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
          </nav>
          

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 px-4 py-2 text-sm font-medium"
              onClick={() => setNewLeadOpen(true)}
            >
              + New Lead
            </button>
            {/* <button
                type="button"
                className="rounded-full bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
                onClick={() => {
                  if (!selected) return;
                  const reason = prompt("Disable reason? (optional)") ?? "";
                  const now = new Date().toISOString();
                  updateItemInStore(
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

      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr] items-start">
          {/* LEFT */}
          <LeftSearchPanel
            className="lg:mt-9"
            query={query}
            onQueryChange={setQuery}
            platform={platformFilter}
            onPlatformChange={setPlatformFilter}
            manager={managerFilter}
            onManagerChange={setManagerFilter}
            managers={managers}
          />

          {/* RIGHT */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-medium text-white/70">ORGANIZER / EVENT</div>
              <div className="text-sm font-medium text-white/40">ONBOARDING CHECKLIST</div>
            </div>

            <div className="space-y-4">
              {onboardingItems.map((item) => (
                <OnboardingCard
                  key={item.id}
                  item={item}
                  onOpen={openDrawer}
                  onStepClick={openStep}
                />
              ))}

              {onboardingItems.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/60">
                  No items in Onboarding. Create a new lead to start.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

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
        onUpdated={(updatedItem) => {
          const next = items.map((x) => (x.id === updatedItem.id ? updatedItem : x));
          saveItems(next);
          saveItems(next);
        }}
      />


      <NewLeadModal
        open={newLeadOpen}
        onClose={() => {
          setNewLeadOpen(false);
          router.replace("/onboarding");
        }}
        onSave={handleCreateNewLead}
      />
    </main>
  );
}
