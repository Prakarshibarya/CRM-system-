"use client";

import type { CRMItem } from "@/types/crm";
import MilestoneGrid from "@/components/active/MilestoneGrid";
import type { MilestoneKey } from "@/components/active/MilestoneModal";

type Props = {
  item: CRMItem;
  onOpen: (id: string) => void;
  onMilestoneClick: (itemId: string, key: MilestoneKey) => void;
};

const MILESTONE_ORDER: { key: MilestoneKey; label: string }[] = [
  { key: "orgVerified", label: "Listing shared & verified" },
  { key: "discountAsked", label: "EB discount suggested" },
  { key: "promoCardShared", label: "Courtesy promo rate card shared" },
  { key: "mysiteMade", label: "Microsite created" },
  { key: "mysiteGiven", label: "Microsite shared with organizer" },
  { key: "promoFollowUp", label: "Asked if promo is needed" },
  { key: "discountFollowUp", label: "Asked for customer discounts" },
  { key: "firstSalesUpdate", label: "First ticket sales update sent" },
];

function getNextStep(active: Record<string, any>) {
  const next = MILESTONE_ORDER.find((step) => !active?.[step.key]?.checked);
  return next?.label ?? "All milestones completed";
}

export default function ActiveEventCard({ item, onOpen, onMilestoneClick }: Props) {
  const active = item.active ?? {};
  const doneCount = MILESTONE_ORDER.filter((step) => active?.[step.key]?.checked).length;
  const nextStep = getNextStep(active);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)_84px]">
        <button
          type="button"
          onClick={() => onOpen(item.id)}
          className="min-w-0 text-left"
          title="Open details"
        >
          <div className="truncate text-lg font-semibold text-white">
            {item.title}
          </div>

          <div className="mt-1 truncate text-sm text-white/50">
            Found on {item.platform} • {item.eventType}
          </div>

          <div className="mt-3 text-sm text-fuchsia-400">
            Next step: {nextStep}
          </div>

          <div className="mt-2 text-xs text-white/40">
            AM: {item.manager}
          </div>
        </button>

        <div className="min-w-0">
          <div className="mb-3 text-xs font-medium text-white/45">
            ACTIVE EVENT PROGRESS — <span className="text-white/65">{doneCount}/8</span>
          </div>

          <MilestoneGrid
            itemId={item.id}
            active={active as any}
            onClick={onMilestoneClick}
          />
        </div>

      
      </div>
    </div>
  );
}