/* ================================
   Core CRM Types
================================ */

export type Stage = "ONBOARDING" | "ACTIVE";

/* ---------- Activity ---------- */

export type ActivityItem = {
  at: string;           // ISO timestamp
  text: string;         // description of the change
  by?: string;          // name of the user who made the change (stored but not shown in item sidebar)
  itemId?: string;      // which CRM item (used in history view)
  itemTitle?: string;   // denormalized title for history view
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
  discountValue?: string;
  promoAccepted?: "Yes" | "No";
};

/* ---------- CRM Item ---------- */

export type CRMItem = {
  id: string;

  title: string;

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

  stage: Stage;

  disabled?: boolean;
  disabledReason?: string;
  disabledAt?: string;

  onboarding: Record<OnboardingKey, OnboardingMeta>;
  active: Record<MilestoneKey, ActiveMeta>;

  activity: ActivityItem[];
};