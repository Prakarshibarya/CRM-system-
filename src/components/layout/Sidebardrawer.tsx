"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { saveItems, updateItem, updateItemInDB, type CRMItem } from "@/lib/store";
import DisableLeadModal from "@/components/lead/DisableLeadModal";

type BadgeTone = "neutral" | "green" | "purple";

function toneClass(tone: BadgeTone) {
  if (tone === "green")
    return "bg-emerald-400/15 text-emerald-300 border-emerald-400/20";
  if (tone === "purple")
    return "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/20";
  return "bg-white/5 text-white/70 border-white/10";
}

export type SidebarDrawerProps = {
  open: boolean;
  item?: CRMItem | null;
  onClose: () => void;

  // ✅ IMPORTANT: parent should update list using the updated item
  onUpdated?: (updatedItem: CRMItem) => void;
};

function formatTime(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleString();
}

export function SidebarDrawer({ open, item, onClose, onUpdated }: SidebarDrawerProps) {
  const router = useRouter();
  const selected = item ?? null;

  const [editMode, setEditMode] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [eventName, setEventName] = useState("");
  const [platform, setPlatform] = useState("");
  const [eventType, setEventType] = useState("");
  const [eventLink, setEventLink] = useState("");
  const [city, setCity] = useState("");
  const [venue, setVenue] = useState("");
  const [manager, setManager] = useState("");

  // ✅ modal state
  const [disableModalOpen, setDisableModalOpen] = useState(false);

  useEffect(() => {
    if (!selected) return;

    setEditMode(false);
    setOrgName(selected.orgName || "");
    setEventName(selected.eventName || "");
    setPlatform(selected.platform || "");
    setEventType(selected.eventType || "");
    setEventLink(selected.eventLink || "");
    setCity(selected.city || "");
    setVenue(selected.venue || "");
    setManager(selected.manager || "");

    setDisableModalOpen(false);
  }, [selected?.id]);

  const badgeTone: BadgeTone = useMemo(() => {
    if (!selected) return "neutral";
    return selected.stage === "ACTIVE" ? "green" : "purple";
  }, [selected]);

  async function confirmDisable(reason: string) {
    if (!selected) return;

    const now = new Date().toISOString();

    const updated: CRMItem = {
      ...selected,
      disabled: true,
      disabledReason: reason,
      disabledAt: now,
      activity: [{ at: now, text: `Lead disabled: ${reason}` }, ...(selected.activity || [])],
    };

    // ✅ optimistic UI update (parent list)
    onUpdated?.(updated);

    // ✅ also update local storage immediately
    const next = updateItem(updated);
    saveItems(next);

    try {
      // ✅ persist to DB
      await updateItemInDB(updated);

      // close modal + drawer, go to disabled page
      setDisableModalOpen(false);
      onClose();
      router.push("/disabled");
    } catch (e) {
      console.error("Disable failed:", e);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <aside className="absolute right-0 top-0 h-full w-[380px] border-l border-white/10 bg-[#07070A] p-5 overflow-y-auto">
        {!selected ? (
          <div className="text-white/70">No item selected.</div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-lg font-semibold">{selected.title}</div>

                <div
                  className={[
                    "mt-2 inline-flex rounded-full border px-3 py-1 text-xs",
                    toneClass(badgeTone),
                  ].join(" ")}
                >
                  {selected.stage === "ACTIVE" ? "Active Event" : "Onboarding"}
                </div>
              </div>

              <button
                type="button"
                className="rounded-full bg-white/5 px-3 py-1 text-sm text-white/70 hover:bg-white/10"
                onClick={onClose}
              >
                ✕
              </button>
            </div>

            {/* Details */}
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Details</div>
                <button
                  type="button"
                  className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/70 hover:bg-white/10"
                  onClick={() => setEditMode((v) => !v)}
                >
                  {editMode ? "Close" : "Edit"}
                </button>
              </div>

              {!editMode ? (
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div className="col-span-2">
                    <div className="text-white/40">Org</div>
                    <div className="truncate">{selected.orgName || "—"}</div>
                  </div>

                  <div className="col-span-2">
                    <div className="text-white/40">Event</div>
                    <div className="truncate">{selected.eventName || "—"}</div>
                  </div>

                  <div>
                    <div className="text-white/40">Platform</div>
                    <div className="truncate">{selected.platform}</div>
                  </div>

                  <div>
                    <div className="text-white/40">Event Type</div>
                    <div className="truncate">{selected.eventType}</div>
                  </div>

                  <div className="col-span-2">
                    <div className="text-white/40">Event Link</div>
                    {selected.eventLink ? (
                      <a
                        className="truncate text-fuchsia-300 hover:underline"
                        href={selected.eventLink}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {selected.eventLink}
                      </a>
                    ) : (
                      <div className="truncate text-white/70">—</div>
                    )}
                  </div>

                  <div>
                    <div className="text-white/40">City</div>
                    <div className="truncate">{selected.city || "—"}</div>
                  </div>

                  <div>
                    <div className="text-white/40">Venue</div>
                    <div className="truncate">{selected.venue || "—"}</div>
                  </div>

                  <div className="col-span-2">
                    <div className="text-white/40">Account Manager</div>
                    <div className="truncate">{selected.manager}</div>
                  </div>

                  {/* ✅ Disable button only in drawer */}
                  {selected.stage === "ONBOARDING" && !selected.disabled ? (
                    <div className="col-span-2 pt-2">
                      <button
                        type="button"
                        className="w-full rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200 hover:bg-red-500/15"
                        onClick={() => setDisableModalOpen(true)}
                      >
                        Disable Lead (unable to find contact)
                      </button>
                      <div className="mt-2 text-xs text-white/40">
                        Disabled leads move to the Disabled page.
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-1 gap-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <div className="text-xs text-white/50">Org Name</div>
                      <input
                        className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                      />
                    </div>
                    <div>
                      <div className="text-xs text-white/50">Event Name</div>
                      <input
                        className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <div className="text-xs text-white/50">Platform</div>
                      <input
                        className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value)}
                      />
                    </div>
                    <div>
                      <div className="text-xs text-white/50">Event Type</div>
                      <input
                        className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-white/50">Event Link</div>
                    <input
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
                      value={eventLink}
                      onChange={(e) => setEventLink(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <div className="text-xs text-white/50">City</div>
                      <input
                        className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </div>
                    <div>
                      <div className="text-xs text-white/50">Venue</div>
                      <input
                        className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
                        value={venue}
                        onChange={(e) => setVenue(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-white/50">Account Manager</div>
                    <input
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
                      value={manager}
                      onChange={(e) => setManager(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      className="flex-1 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-white/90"
                      onClick={() => {
                        const now = new Date().toISOString();

                        const updated: CRMItem = {
                          ...selected,
                          orgName: orgName.trim(),
                          eventName: eventName.trim(),
                          platform: platform.trim() || selected.platform,
                          eventType: eventType.trim() || selected.eventType,
                          eventLink: eventLink.trim(),
                          city: city.trim(),
                          venue: venue.trim(),
                          manager: manager.trim() || selected.manager,
                          title: `${(orgName.trim() || selected.orgName || "Unknown")} — ${
                            (eventName.trim() || selected.eventName || "Event")
                          }`,
                          activity: [{ at: now, text: "Details edited" }, ...(selected.activity || [])],
                        };

                        const next = updateItem(updated);
                        saveItems(next);
                        onUpdated?.(updated);
                        setEditMode(false);
                      }}
                    >
                      Save
                    </button>

                    <button
                      type="button"
                      className="flex-1 rounded-xl bg-white/5 px-3 py-2 text-sm text-white/70 hover:bg-white/10"
                      onClick={() => setEditMode(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Activity */}
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold">Activity Timeline</div>
              <div className="mt-3 space-y-2">
                {(selected.activity || []).slice(0, 10).map((a, idx) => (
                  <div key={idx} className="rounded-xl border border-white/10 bg-black/30 p-3">
                    <div className="text-xs text-white/40">{formatTime(a.at)}</div>
                    <div className="mt-1 text-sm text-white/80">{a.text}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ✅ Modal */}
            <DisableLeadModal
              open={disableModalOpen}
              onClose={() => setDisableModalOpen(false)}
              onConfirm={confirmDisable}
            />
          </>
        )}
      </aside>
    </div>
  );
}
