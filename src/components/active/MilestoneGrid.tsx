"use client";

import { MilestoneKey, MilestoneMeta } from "./MilestoneModal";

const MILESTONES: {
  key: MilestoneKey;
  label: string;
  short: string;
}[] = [
  { key: "orgVerified", label: "Org listing verified", short: "Org verified" },
  { key: "discountAsked", label: "Discount asked", short: "Discount" },
  { key: "promoCardShared", label: "Promo card shared", short: "Promo card" },
  { key: "mysiteMade", label: "MySite made", short: "MySite made" },
  { key: "mysiteGiven", label: "MySite given", short: "MySite given" },
  { key: "promoFollowUp", label: "Promo follow up", short: "Promo follow" },
  { key: "discountFollowUp", label: "Discount follow up", short: "Disc follow" },
  { key: "firstSalesUpdate", label: "First sales update", short: "1st sales" },
];

function formatTime(iso?: string) {
  if (!iso) return "Not done";
  return new Date(iso).toLocaleString();
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
              "w-full rounded-xl border px-3 py-3",
              "flex items-center gap-2",
              "bg-black/35 hover:bg-black/45",
              meta.checked
                ? "border-emerald-400/30"
                : "border-white/10",
            ].join(" ")}
          >
            <TickDot checked={!!meta.checked} />

            <div className="min-w-0">
              <div className="truncate text-[12px] text-white/80">
                {m.short}
              </div>
              <div className="truncate text-[10px] text-white/35">
                {formatTime(meta.updatedAt)}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
