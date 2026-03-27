"use client";

import LeadCard from "@/components/lead/LeadCard";
import OnboardingSteps from "@/components/onboarding/OnboardingSteps";
import type { CRMItem } from "@/types/crm";
import type { OnboardingKey } from "@/components/onboarding/types";

type Props = {
  item: CRMItem;

  onOpen: (id: string) => void;

  onStepClick: (itemId: string, key: OnboardingKey) => void;
};

export default function OnboardingCard({ item, onOpen, onStepClick }: Props) {
  const onboarding = item.onboarding ?? {};

  const doneCount = (["contactDetails", "commissionSettled", "partnerCreated"] as OnboardingKey[]).filter(
    (k) => (onboarding as any)[k]?.checked
  ).length;

  const statusText = doneCount === 3 ? "Ready to move to Active Events" : "Complete onboarding steps";

  return (
    <LeadCard item={item} onOpen={onOpen} statusText={statusText}>
      <OnboardingSteps
        onboarding={onboarding as any}
        onOpen={(key: OnboardingKey) => onStepClick(item.id, key)}
      />
    </LeadCard>
  );
}
