import { OnboardingKey } from "@/types/crm";

export type OnboardingStepConfig = {
  key: OnboardingKey;
  label: string;
  short: string;

  // UI rules
  requiresComment: boolean;

  // conditional fields
  requiresCommissionValue?: boolean;
  requiresPartnerEmail?: boolean;
};

export const ONBOARDING_STEPS: OnboardingStepConfig[] = [
  {
    key: "contactDetails",
    label: "Contact details found",
    short: "Contact",
    requiresComment: true,
  },
  {
    key: "commissionSettled",
    label: "Commission settled",
    short: "Commission",
    requiresComment: true,
    requiresCommissionValue: true,
  },
  {
    key: "partnerCreated",
    label: "Partner created",
    short: "Partner",
    requiresComment: true,
    requiresPartnerEmail: true,
  },
];
