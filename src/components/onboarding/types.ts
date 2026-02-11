export type OnboardingKey = "contactDetails" | "commissionSettled" | "partnerCreated";

export type OnboardingStepMeta = {
  checked: boolean;
  updatedAt?: string; // ISO
  comment?: string;

  // step-specific
  commissionValue?: string;
  partnerEmail?: string;
};
