"use client";

import type { CRMItem } from "@/types/crm";

type Props = {
  item: CRMItem;
  onEdit: () => void;
  onDisable: () => void;
};

export default function LeadDetailsView({ item, onEdit, onDisable }: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Lead Details</div>
        <button
          onClick={onEdit}
          className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/70 hover:bg-white/10"
        >
          Edit
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <Field label="Org" value={item.orgName} span />
        <Field label="Event" value={item.eventName} span />
        <Field label="Platform" value={item.platform} />
        <Field label="Event Type" value={item.eventType} />
        <Field label="City" value={item.city} />
        <Field label="Venue" value={item.venue} />
        <Field label="Account Manager" value={item.manager} span />

        <div className="col-span-2 pt-2">
          <button
            onClick={onDisable}
            className="w-full rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200 hover:bg-red-500/15"
          >
            Disable Lead
          </button>
          <div className="mt-2 text-xs text-white/40">
            Disabled leads will be hidden from lists.
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  span,
}: {
  label: string;
  value?: string;
  span?: boolean;
}) {
  return (
    <div className={span ? "col-span-2" : ""}>
      <div className="text-white/40">{label}</div>
      <div className="truncate">{value || "—"}</div>
    </div>
  );
}
