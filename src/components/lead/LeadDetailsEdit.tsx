"use client";

import { useEffect, useMemo, useState } from "react";
import type { CRMItem } from "@/types/crm";

type Props = {
  item: CRMItem;
  onCancel: () => void;
  onSave: (updated: CRMItem) => void;
};

export default function LeadDetailsEdit({ item, onCancel, onSave }: Props) {
  // local form state
  const [orgName, setOrgName] = useState(item.orgName || "");
  const [eventName, setEventName] = useState(item.eventName || "");
  const [platform, setPlatform] = useState(item.platform || "");
  const [eventType, setEventType] = useState(item.eventType || "");
  const [eventLink, setEventLink] = useState(item.eventLink || "");
  const [city, setCity] = useState(item.city || "");
  const [venue, setVenue] = useState(item.venue || "");
  const [manager, setManager] = useState(item.manager || "");

  // if item changes (select different lead), reset the form
  useEffect(() => {
    setOrgName(item.orgName || "");
    setEventName(item.eventName || "");
    setPlatform(item.platform || "");
    setEventType(item.eventType || "");
    setEventLink(item.eventLink || "");
    setCity(item.city || "");
    setVenue(item.venue || "");
    setManager(item.manager || "");
  }, [item.id]); // important: only reset when the selected item changes

  const computedTitle = useMemo(() => {
    const o = (orgName || item.orgName || "Unknown").trim();
    const e = (eventName || item.eventName || "Event").trim();
    return `${o} — ${e}`;
  }, [orgName, eventName, item.orgName, item.eventName]);

  const canSave = useMemo(() => {
    return !!manager.trim() && !!(orgName.trim() || item.orgName) && !!(eventName.trim() || item.eventName);
  }, [manager, orgName, eventName, item.orgName, item.eventName]);

  function handleSave() {
    const updated: CRMItem = {
      ...item,
      orgName: orgName.trim(),
      eventName: eventName.trim(),
      platform: (platform.trim() || item.platform).trim(),
      eventType: (eventType.trim() || item.eventType).trim(),
      eventLink: eventLink.trim(),
      city: city.trim(),
      venue: venue.trim(),
      manager: (manager.trim() || item.manager).trim(),
      title: computedTitle,
    };

    onSave(updated);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Edit Lead Details</div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/70 hover:bg-white/10"
        >
          Close
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3">
        <Row2>
          <Field label="Org Name" value={orgName} setValue={setOrgName} placeholder="ABC Events" />
          <Field label="Event Name" value={eventName} setValue={setEventName} placeholder="NYE Party" />
        </Row2>

        <Row2>
          <Field label="Platform" value={platform} setValue={setPlatform} placeholder="BookMyShow / District" />
          <Field label="Event Type" value={eventType} setValue={setEventType} placeholder="Music / Comedy" />
        </Row2>

        <Field
          label="Event Link"
          value={eventLink}
          setValue={setEventLink}
          placeholder="https://..."
        />

        <Row2>
          <Field label="City" value={city} setValue={setCity} placeholder="Mumbai" />
          <Field label="Venue" value={venue} setValue={setVenue} placeholder="AntiSocial" />
        </Row2>

        <Field
          label="Account Manager"
          value={manager}
          setValue={setManager}
          placeholder="JD"
        />

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            disabled={!canSave}
            onClick={handleSave}
            className="flex-1 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-40"
          >
            Save
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl bg-white/5 px-3 py-2 text-sm text-white/70 hover:bg-white/10"
          >
            Cancel
          </button>
        </div>

        <div className="text-[11px] text-white/35">
          Title preview: <span className="text-white/60">{computedTitle}</span>
        </div>
      </div>
    </div>
  );
}

/* ---------------- UI helpers ---------------- */

function Row2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>;
}

function Field({
  label,
  value,
  setValue,
  placeholder,
}: {
  label: string;
  value: string;
  setValue: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <div className="text-xs text-white/50">{label}</div>
      <input
        className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
