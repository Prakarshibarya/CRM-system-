"use client";

import { useEffect, useMemo, useState } from "react";

export type MilestoneKey =
  | "orgVerified"
  | "discountAsked"
  | "promoCardShared"
  | "mysiteMade"
  | "mysiteGiven"
  | "promoFollowUp"
  | "discountFollowUp"
  | "firstSalesUpdate";

export type PromotionPackage = "Platinum" | "Gold" | "Silver" | "Bronze" | "Plus+";
export type PromotionType = "Regular" | "Bigscale";

export type MilestoneMeta = {
  checked: boolean;
  updatedAt?: string; // ISO
  comment?: string;

  // promo
  promoAccepted?: "Yes" | "No";
  promoPackage?: PromotionPackage;
  promoType?: PromotionType;
  promoPrice?: string;
  promoImpressions?: string;

  // discount
  discountValue?: string;
};

export type MilestoneModalResult = {
  key: MilestoneKey;
  checked: true;
  updatedAt: string;
  comment: string;

  // promo
  promoAccepted?: "Yes" | "No";
  promoPackage?: PromotionPackage;
  promoType?: PromotionType;
  promoPrice?: string;
  promoImpressions?: string;

  // discount
  discountValue?: string;
};

type Props = {
  open: boolean;
  milestoneKey: MilestoneKey;
  milestoneLabel: string;
  current?: MilestoneMeta;

  onClose: () => void;
  onSave: (result: MilestoneModalResult) => void;
};

export default function MilestoneModal({
  open,
  milestoneKey,
  milestoneLabel,
  current,
  onClose,
  onSave,
}: Props) {
  const [comment, setComment] = useState("");

  // discount
  const [discountValue, setDiscountValue] = useState("");

  // promo
  const [promoAccepted, setPromoAccepted] = useState<"Yes" | "No">("Yes");
  const [promoPackage, setPromoPackage] = useState<PromotionPackage>("Gold");
  const [promoType, setPromoType] = useState<PromotionType>("Regular");
  const [promoPrice, setPromoPrice] = useState("");
  const [promoImpressions, setPromoImpressions] = useState("");

  const isDiscount = milestoneKey === "discountAsked" || milestoneKey === "discountFollowUp";
  const isPromo = milestoneKey === "promoCardShared" || milestoneKey === "promoFollowUp";

  // Prefill when opening or switching milestone
  useEffect(() => {
    if (!open) return;

    setComment(current?.comment || "");
    setDiscountValue(current?.discountValue || "");

    setPromoAccepted(current?.promoAccepted || "Yes");
    setPromoPackage(current?.promoPackage || "Gold");
    setPromoType(current?.promoType || "Regular");
    setPromoPrice(current?.promoPrice || "");
    setPromoImpressions(current?.promoImpressions || "");
  }, [open, milestoneKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const canSave = useMemo(() => {
    if (!comment.trim()) return false;

    if (isDiscount) return !!discountValue.trim();

    if (isPromo) {
      if (promoAccepted === "No") return true;
      return !!promoPrice.trim() && !!promoImpressions.trim();
    }

    return true;
  }, [comment, discountValue, isDiscount, isPromo, promoAccepted, promoPrice, promoImpressions]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#0B0B10] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">{milestoneLabel}</div>
            <div className="mt-1 text-sm text-white/50">
              Save captures timestamp + comment.
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/5 px-3 py-1 text-sm text-white/70 hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Promo section */}
          {isPromo && (
            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-medium text-white/70">
                Promotion accepted?
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  className={[
                    "rounded-full px-4 py-2 text-sm",
                    promoAccepted === "Yes"
                      ? "bg-fuchsia-500 text-black"
                      : "bg-white/5 text-white/70 hover:bg-white/10",
                  ].join(" ")}
                  onClick={() => setPromoAccepted("Yes")}
                >
                  Yes
                </button>

                <button
                  type="button"
                  className={[
                    "rounded-full px-4 py-2 text-sm",
                    promoAccepted === "No"
                      ? "bg-fuchsia-500 text-black"
                      : "bg-white/5 text-white/70 hover:bg-white/10",
                  ].join(" ")}
                  onClick={() => setPromoAccepted("No")}
                >
                  No
                </button>
              </div>

              {promoAccepted === "Yes" && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-sm text-white/60">Package</div>
                    <select
                      value={promoPackage}
                      onChange={(e) => setPromoPackage(e.target.value as PromotionPackage)}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
                    >
                      <option value="Platinum">Platinum</option>
                      <option value="Gold">Gold</option>
                      <option value="Silver">Silver</option>
                      <option value="Bronze">Bronze</option>
                      <option value="Plus+">Plus+</option>
                    </select>
                  </div>

                  <div>
                    <div className="text-sm text-white/60">Type</div>
                    <select
                      value={promoType}
                      onChange={(e) => setPromoType(e.target.value as PromotionType)}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
                    >
                      <option value="Regular">Regular</option>
                      <option value="Bigscale">Bigscale</option>
                    </select>
                  </div>

                  <div>
                    <div className="text-sm text-white/60">Price</div>
                    <input
                      value={promoPrice}
                      onChange={(e) => setPromoPrice(e.target.value)}
                      placeholder="e.g., 25000"
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <div className="text-sm text-white/60">Impressions</div>
                    <input
                      value={promoImpressions}
                      onChange={(e) => setPromoImpressions(e.target.value)}
                      placeholder="e.g., 50000"
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Discount section */}
          {isDiscount && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-medium text-white/70">Discount value</div>
              <input
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder="e.g., 15% or 200 off"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
              />
            </div>
          )}

          {/* Comments (always required) */}
          <div>
            <div className="text-sm font-medium text-white/70">Comments</div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write what the organizer said..."
              className="mt-2 h-28 w-full resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!canSave}
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-40"
            onClick={() => {
              const now = new Date().toISOString();

              onSave({
                key: milestoneKey,
                checked: true,
                updatedAt: now,
                comment: comment.trim(),

                ...(isDiscount ? { discountValue: discountValue.trim() } : {}),

                ...(isPromo
                  ? promoAccepted === "No"
                    ? { promoAccepted: "No" as const }
                    : {
                        promoAccepted: "Yes" as const,
                        promoPackage,
                        promoType,
                        promoPrice: promoPrice.trim(),
                        promoImpressions: promoImpressions.trim(),
                      }
                  : {}),
              });

              onClose();
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
