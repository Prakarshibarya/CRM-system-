/* ================================
   Core CRM Types
================================ */

export type Stage = "ONBOARDING" | "ACTIVE";

/* ---------- Activity ---------- */

export type ActivityItem = {
  at: string; // ISO timestamp
  text: string;
};

/* ---------- Meta base ---------- */

export type StepMeta = {
  checked: boolean;
  updatedAt?: string;
  comment?: string;
};

/* ---------- Onboarding ---------- */

export type OnboardingKey =
  | "contactDetails"
  | "commissionSettled"
  | "partnerCreated";

export type OnboardingMeta = StepMeta & {
  commissionValue?: string;
  partnerEmail?: string;
};

/* ---------- Active Events ---------- */

export type MilestoneKey =
  | "orgVerified"
  | "discountAsked"
  | "promoCardShared"
  | "mysiteMade"
  | "mysiteGiven"
  | "promoFollowUp"
  | "discountFollowUp"
  | "firstSalesUpdate";

export type ActiveMeta = StepMeta & {
  // discount
  discountValue?: string;

  // promotion
  promoAccepted?: "Yes" | "No";
};

/* ---------- CRM Item ---------- */

export type CRMItem = {
  id: string;

  // display
  title: string;

  // org / event details
  orgName?: string;
  eventName?: string;
  platform: string;
  eventType: string;
  city?: string;
  venue?: string;
  eventLink?: string;
  startDate?: string;
  endDate?: string;
  sourceType?: "Venue" | "Organizer";

  manager: string;

  // lifecycle
  stage: Stage;

  // flags
  disabled?: boolean;
  disabledReason?: string;
  disabledAt?: string;

  // steps
  onboarding: Record<OnboardingKey, OnboardingMeta>;
  active: Record<MilestoneKey, ActiveMeta>;

  // history
  activity: ActivityItem[];
};
