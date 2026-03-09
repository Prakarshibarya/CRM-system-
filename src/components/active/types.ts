export type ActiveStepKey =
  | "listingDone"
  | "listingSharedVerified"
  | "ebDiscountSuggested"
  | "promoRateCardShared"
  | "micrositeCreated"
  | "promoOrDiscountAsked"
  | "firstSalesUpdated"
  | "eventDatePartnerReminder";

export type ActiveStepMeta = {
  checked: boolean;
  updatedAt?: string;
  note?: string;
};

export const ACTIVE_EVENT_STEPS: {
  key: ActiveStepKey;
  label: string;
  short: string;
}[] = [
  { key: "listingDone", label: "Listing done", short: "Listing" },
  { key: "listingSharedVerified", label: "Listing shared & verified", short: "Verified" },
  { key: "ebDiscountSuggested", label: "Suggest EB discounts", short: "EB discount" },
  { key: "promoRateCardShared", label: "Share courtesy promo rate card", short: "Rate card" },
  { key: "micrositeCreated", label: "Create and share microsite", short: "Microsite" },
  { key: "promoOrDiscountAsked", label: "Ask for promo or customer discounts", short: "Promo ask" },
  { key: "firstSalesUpdated", label: "Update when first ticket sales happen", short: "Sales update" },
  { key: "eventDatePartnerReminder", label: "On event date, ask them to check partners", short: "Partner reminder" },
];