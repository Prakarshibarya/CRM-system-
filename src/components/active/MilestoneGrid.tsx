"use client";

import { MilestoneKey, MilestoneMeta } from "./MilestoneModal";

const MILESTONES: {
  key: MilestoneKey;
  label: string;
  short: string;
}[] = [
  { key: "orgVerified", label: "Listing shared & verified by organizer", short: "Verified" },
  { key: "discountAsked", label: "EB discount suggested", short: "EB discount" },
  { key: "promoCardShared", label: "Courtesy promo rate card shared", short: "Rate card" },
  { key: "mysiteMade", label: "Microsite created", short: "Microsite made" },
  { key: "mysiteGiven", label: "Microsite shared with organizer", short: "Microsite given" },
  { key: "promoFollowUp", label: "Asked if promo is needed", short: "Promo asked" },
  { key: "discountFollowUp", label: "Asked for customer discounts", short: "Discount asked" },
  { key: "firstSalesUpdate", label: "First ticket sales update sent", short: "1st sales" },
];

function formatTime(iso?: string) {
  if (!iso) return "Not done";
  return new Date(iso).toLocaleDateString();
}

function TickDot({ checked }: { checked: boolean }) {
  return (
    <span
      className={[
        "grid h-5 w-5 place-items-center rounded-full border text-[11px] shrink-0",
        checked
          ? "border-emerald-400/70 bg-emerald-400/15 text-emerald-300"
          : "border-white/20 text-white/30",
      ].join(" ")}
    >
      {checked ? "✓" : ""}
    </span>
  );
}

type Props = {
  itemId: string;
  active: Record<string, MilestoneMeta>;
  onClick: (itemId: string, key: MilestoneKey) => void;
};

export default function MilestoneGrid({ itemId, active, onClick }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {MILESTONES.map((m) => {
        const meta = active[m.key] || { checked: false };

        return (
          <button
            key={m.key}
            type="button"
            onClick={() => onClick(itemId, m.key)}
            title={m.label}
            className={[
              "w-full rounded-xl border px-3 py-2",
              "flex items-center gap-2",
              "bg-black/35 hover:bg-black/45",
              meta.checked ? "border-emerald-400/30" : "border-white/10",
            ].join(" ")}
          >
            <TickDot checked={!!meta.checked} />

            <div className="min-w-0 text-left">
              <div className="text-[12px] text-white/80 leading-tight">
                {m.short}
              </div>
              <div className="text-[10px] text-white/35">
                {formatTime(meta.updatedAt)}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}