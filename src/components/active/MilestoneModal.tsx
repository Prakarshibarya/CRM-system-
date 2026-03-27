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

export type MilestoneMeta = {
  checked: boolean;
  updatedAt?: string;
  comment?: string;

  // promo
  promoAccepted?: "Yes" | "No";

  // discount
  discountValue?: string;
};

export type MilestoneModalResult = {
  key: MilestoneKey;
  checked: true;
  updatedAt: string;
  comment?: string;

  // promo
  promoAccepted?: "Yes" | "No";

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
  const [discountValue, setDiscountValue] = useState("");
  const [promoAccepted, setPromoAccepted] = useState<"Yes" | "No">("Yes");
  const [errors, setErrors] = useState<{
    discountValue?: string;
  }>({});

  const isDiscount =
    milestoneKey === "discountAsked" || milestoneKey === "discountFollowUp";

  const isPromo =
    milestoneKey === "promoCardShared" || milestoneKey === "promoFollowUp";

  useEffect(() => {
    if (!open) return;

    setComment(current?.comment || "");
    setDiscountValue(current?.discountValue || "");
    setPromoAccepted(current?.promoAccepted || "Yes");
    setErrors({});
  }, [open, milestoneKey, current]);

  function isValidNumber(value: string) {
    return /^\d+(\.\d+)?$/.test(value);
  }

  const canSave = useMemo(() => {
    if (isDiscount) return !!discountValue.trim();
    return true;
  }, [discountValue, isDiscount]);

  function validateBeforeSave() {
    const nextErrors: { discountValue?: string } = {};

    if (isDiscount) {
      if (!discountValue.trim()) {
        nextErrors.discountValue = "Discount value is required.";
      } else if (!isValidNumber(discountValue.trim())) {
        nextErrors.discountValue = "Enter numbers only.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

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
              Saving this action stores the timestamp automatically.
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
          {isPromo ? (
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
            </div>
          ) : null}

          {isDiscount ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-medium text-white/70">
                Discount value
              </div>
              <input
                value={discountValue}
                onChange={(e) => {
                  setDiscountValue(e.target.value);
                  if (errors.discountValue) {
                    setErrors((prev) => ({
                      ...prev,
                      discountValue: undefined,
                    }));
                  }
                }}
                placeholder="e.g. 15"
                className={`mt-2 w-full rounded-xl border bg-black/40 px-3 py-2 text-sm ${
                  errors.discountValue ? "border-red-500/60" : "border-white/10"
                }`}
              />
              {errors.discountValue ? (
                <div className="mt-1 text-xs text-red-400">
                  {errors.discountValue}
                </div>
              ) : null}
            </div>
          ) : null}

          {!isPromo && !isDiscount ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              Mark this milestone as completed. The action time will be stored automatically.
            </div>
          ) : null}

          <div>
            <div className="text-sm font-medium text-white/70">
              Comments (optional)
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a note only if needed"
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
              if (!validateBeforeSave()) return;

              const now = new Date().toISOString();

              onSave({
                key: milestoneKey,
                checked: true,
                updatedAt: now,
                ...(comment.trim() ? { comment: comment.trim() } : {}),
                ...(isDiscount ? { discountValue: discountValue.trim() } : {}),
                ...(isPromo ? { promoAccepted } : {}),
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