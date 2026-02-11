import { MilestoneKey } from "@/types/crm";

export type ActiveMilestoneConfig = {
  key: MilestoneKey;
  label: string;
  short: string;

  requiresComment: boolean;

  // conditional rules
  requiresDiscountValue?: boolean;
  requiresPromotion?: boolean;
};

export const ACTIVE_MILESTONES: ActiveMilestoneConfig[] = [
  {
    key: "orgVerified",
    label: "Org listing verified",
    short: "Org verified",
    requiresComment: true,
  },
  {
    key: "discountAsked",
    label: "Discount asked",
    short: "Discount",
    requiresComment: true,
    requiresDiscountValue: true,
  },
  {
    key: "promoCardShared",
    label: "Promo card shared",
    short: "Promo card",
    requiresComment: true,
    requiresPromotion: true,
  },
  {
    key: "mysiteMade",
    label: "MySite made",
    short: "MySite made",
    requiresComment: true,
  },
  {
    key: "mysiteGiven",
    label: "MySite given",
    short: "MySite given",
    requiresComment: true,
  },
  {
    key: "promoFollowUp",
    label: "Promo follow up",
    short: "Promo follow",
    requiresComment: true,
    requiresPromotion: true,
  },
  {
    key: "discountFollowUp",
    label: "Discount follow up",
    short: "Disc follow",
    requiresComment: true,
    requiresDiscountValue: true,
  },
  {
    key: "firstSalesUpdate",
    label: "First sales update",
    short: "1st sales",
    requiresComment: true,
  },
];
