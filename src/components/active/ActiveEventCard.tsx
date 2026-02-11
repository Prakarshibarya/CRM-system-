"use client";

import type { CRMItem } from "@/types/crm";
import LeadCard from "@/components/lead/LeadCard";
import MilestoneGrid from "@/components/active/MileStoneGrid";
import type { MilestoneKey } from "@/components/active/MilestoneModal";

type Props = {
  item: CRMItem;

  // open right drawer
  onOpen: (id: string) => void;

  // open milestone modal
  onMilestoneClick: (itemId: string, key: MilestoneKey) => void;
};

export default function ActiveEventCard({ item, onOpen, onMilestoneClick }: Props) {
  const active = item.active ?? {};

  const doneCount = [
    "orgVerified",
    "discountAsked",
    "promoCardShared",
    "mysiteMade",
    "mysiteGiven",
    "promoFollowUp",
    "discountFollowUp",
    "firstSalesUpdate",
  ].filter((k) => (active as any)[k]?.checked).length;

  const statusText = doneCount === 8 ? "All steps done" : "Continue checklist";

  return (
    <LeadCard item={item} onOpen={onOpen} statusText={statusText}>
      <MilestoneGrid
        itemId={item.id}
        active={active as any}
        onClick={onMilestoneClick}
      />
    </LeadCard>
  );
}
