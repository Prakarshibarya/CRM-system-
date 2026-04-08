"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { notifySlack } from "@/lib/notifySlack";
import DisableLeadModal from "@/components/lead/DisableLeadModal";
import type { CRMItem } from "@/types/crm";

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
  onUpdated?: (updatedItem: CRMItem) => Promise<void> | void;
};

function formatTime(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleString();
}

function StepBadge({ checked }: { checked?: boolean }) {
  return (
    <div
      className={`px-2 py-1 text-xs rounded-full border ${
        checked
          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/20"
          : "bg-white/5 text-white/40 border-white/10"
      }`}
    >
      {checked ? "Done" : "Pending"}
    </div>
  );
}

export function SidebarDrawer({ open, item, onClose, onUpdated }: SidebarDrawerProps) {
  const router = useRouter();
  const selected = item ?? null;

  const [editMode, setEditMode] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventNameChanged, setEventNameChanged] = useState(false); // ✅ NEW
  const [platform, setPlatform] = useState("");
  const [eventType, setEventType] = useState("");
  const [eventLink, setEventLink] = useState("");
  const [city, setCity] = useState("");
  const [venue, setVenue] = useState("");
  const [manager, setManager] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sourceType, setSourceType] = useState<"Venue" | "Organizer">("Organizer");

  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [errors, setErrors] = useState<{
    eventLink?: string;
    manager?: string;
    endDate?: string;
  }>({});

  useEffect(() => {
    if (!selected) return;

    setEditMode(false);
    setOrgName(selected.orgName || "");
    setEventName(selected.eventName || "");
    setEventNameChanged(false); // ✅ Reset on new item
    setPlatform(selected.platform || "");
    setEventType(selected.eventType || "");
    setEventLink(selected.eventLink || "");
    setCity(selected.city || "");
    setVenue(selected.venue || "");
    setManager(selected.manager || "");
    setStartDate(selected.startDate || "");
    setEndDate(selected.endDate || "");
    setSourceType(selected.sourceType || "Organizer");
    setErrors({});
    setDisableModalOpen(false);
  }, [selected?.id]);

  const badgeTone: BadgeTone = useMemo(() => {
    if (!selected) return "neutral";
    return selected.stage === "ACTIVE" ? "green" : "purple";
  }, [selected]);

  function isValidUrl(value: string) {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  function validateEditForm() {
    const nextErrors: {
      eventLink?: string;
      manager?: string;
      endDate?: string;
    } = {};

    if (!eventLink.trim()) {
      nextErrors.eventLink = "Event link is required.";
    } else if (!isValidUrl(eventLink.trim())) {
      nextErrors.eventLink = "Enter a valid URL.";
    }

    if (!manager.trim()) {
      nextErrors.manager = "Manager is required.";
    }

    if (startDate && endDate && endDate < startDate) {
      nextErrors.endDate = "End date cannot be before start date.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function confirmDisable(reason: string) {
    if (!selected || saving) return;

    const now = new Date().toISOString();

    const updated: CRMItem = {
      ...selected,
      disabled: true,
      disabledReason: reason,
      disabledAt: now,
      activity: [
        { at: now, text: `Lead disabled: ${reason}` },
        ...(selected.activity || []),
      ],
    };

    try {
      setSaving(true);
      await onUpdated?.(updated);
      await notifySlack({
        event: "lead_disabled",
        item: {
          title: updated.title,
          orgName: updated.orgName,
          eventName: updated.eventName,
          manager: updated.manager,
          platform: updated.platform,
          city: updated.city,
          venue: updated.venue,
          startDate: updated.startDate,
          endDate: updated.endDate,
          sourceType: updated.sourceType,
          disabledReason: updated.disabledReason,
        },
      });
      setDisableModalOpen(false);
      onClose();
      router.push("/disabled");
    } catch (e) {
      console.error("Disable failed:", e);
    } finally {
      setSaving(false);
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
                disabled={saving}
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

              {/* Onboarding Summary */}
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold">Onboarding Progress</div>
                <div className="mt-3 space-y-3 text-sm">
                  {Object.entries(selected.onboarding || {}).map(([key, value]: any) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="text-white/70 capitalize">
                        {key === "contactDetails" && "Contact Details"}
                        {key === "commissionSettled" && "Commission Settled"}
                        {key === "partnerCreated" && "Partner Created"}
                      </div>
                      <div className="flex items-center gap-2">
                        {value?.commissionValue && (
                          <span className="text-xs text-white/50">{value.commissionValue}</span>
                        )}
                        {value?.partnerEmail && (
                          <span className="text-xs text-white/50">{value.partnerEmail}</span>
                        )}
                        <StepBadge checked={value?.checked} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* View mode */}
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

                  <div>
                    <div className="text-white/40">Start Date</div>
                    <div className="truncate">{selected.startDate || "—"}</div>
                  </div>

                  <div>
                    <div className="text-white/40">End Date</div>
                    <div className="truncate">{selected.endDate || "—"}</div>
                  </div>

                  <div className="col-span-2">
                    <div className="text-white/40">Source Type</div>
                    <div className="truncate">{selected.sourceType || "—"}</div>
                  </div>

                  <div className="col-span-2">
                    <div className="text-white/40">Account Manager</div>
                    <div className="truncate">{selected.manager}</div>
                  </div>

                  {selected.stage === "ONBOARDING" && !selected.disabled ? (
                    <div className="col-span-2 pt-2">
                      <button
                        type="button"
                        disabled={saving}
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
                /* Edit mode */
                <div className="mt-4 grid grid-cols-1 gap-3">

                  {/* Org + Event */}
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
                        onChange={(e) => {
                          setEventName(e.target.value);
                          setEventNameChanged(true); // ✅ Mark as changed
                        }}
                      />
                    </div>
                  </div>

                  {/* Platform + Event Type */}
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

                  {/* Event Link */}
                  <div>
                    <div className="text-xs text-white/50">
                      Event Link <span className="text-red-400">*</span>
                    </div>
                    <input
                      className={`mt-1 w-full rounded-xl border bg-black/40 px-3 py-2 text-sm ${
                        errors.eventLink ? "border-red-500/60" : "border-white/10"
                      }`}
                      value={eventLink}
                      onChange={(e) => {
                        setEventLink(e.target.value);
                        if (errors.eventLink)
                          setErrors((p) => ({ ...p, eventLink: undefined }));
                      }}
                      placeholder="https://..."
                    />
                    {errors.eventLink && (
                      <div className="mt-1 text-xs text-red-400">{errors.eventLink}</div>
                    )}
                  </div>

                  {/* City + Venue */}
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

                  {/* Start + End Date */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <div className="text-xs text-white/50">Start Date</div>
                      <input
                        type="date"
                        className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          if (errors.endDate)
                            setErrors((p) => ({ ...p, endDate: undefined }));
                        }}
                      />
                    </div>
                    <div>
                      <div className="text-xs text-white/50">End Date</div>
                      <input
                        type="date"
                        className={`mt-1 w-full rounded-xl border bg-black/40 px-3 py-2 text-sm ${
                          errors.endDate ? "border-red-500/60" : "border-white/10"
                        }`}
                        value={endDate}
                        onChange={(e) => {
                          setEndDate(e.target.value);
                          if (errors.endDate)
                            setErrors((p) => ({ ...p, endDate: undefined }));
                        }}
                      />
                      {errors.endDate && (
                        <div className="mt-1 text-xs text-red-400">{errors.endDate}</div>
                      )}
                    </div>
                  </div>

                  {/* Source Type */}
                  <div>
                    <div className="text-xs text-white/50">Source Type</div>
                    <select
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
                      value={sourceType}
                      onChange={(e) =>
                        setSourceType(e.target.value as "Venue" | "Organizer")
                      }
                    >
                      <option value="Organizer">Organizer</option>
                      <option value="Venue">Venue</option>
                    </select>
                  </div>

                  {/* Account Manager */}
                  <div>
                    <div className="text-xs text-white/50">
                      Account Manager <span className="text-red-400">*</span>
                    </div>
                    <input
                      className={`mt-1 w-full rounded-xl border bg-black/40 px-3 py-2 text-sm ${
                        errors.manager ? "border-red-500/60" : "border-white/10"
                      }`}
                      value={manager}
                      onChange={(e) => {
                        setManager(e.target.value);
                        if (errors.manager)
                          setErrors((p) => ({ ...p, manager: undefined }));
                      }}
                    />
                    {errors.manager && (
                      <div className="mt-1 text-xs text-red-400">{errors.manager}</div>
                    )}
                  </div>

                  {/* Save / Cancel */}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      disabled={saving}
                      className="flex-1 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-40"
                      onClick={async () => {
                        if (!selected || saving) return;
                        if (!validateEditForm()) return;

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
                          manager: manager.trim(),
                          startDate: startDate || undefined,
                          endDate: endDate || undefined,
                          sourceType,
                          // ✅ Only rebuild title if user explicitly changed the event name
                         title: eventNameChanged
                            ? eventName.trim() || selected.title
                            : selected.title,
                            activity: [
                            { at: now, text: "Details edited" },
                            ...(selected.activity || []),
                          ],
                        };

                        try {
                          setSaving(true);
                          await onUpdated?.(updated);
                          setEditMode(false);
                        } catch (e) {
                          console.error("Update failed:", e);
                        } finally {
                          setSaving(false);
                        }
                      }}
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>

                    <button
                      type="button"
                      disabled={saving}
                      className="flex-1 rounded-xl bg-white/5 px-3 py-2 text-sm text-white/70 hover:bg-white/10 disabled:opacity-40"
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

            {/* Disable Modal */}
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