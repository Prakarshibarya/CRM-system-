"use client";

import { useEffect, useMemo, useState } from "react";

export type OnboardingKey = "contactDetails" | "commissionSettled" | "partnerCreated";

export type OnboardingStepMeta = {
  checked: boolean;
  updatedAt?: string; // ISO
  comment?: string;

  // commission
  commissionValue?: string;

  // partner
  partnerEmail?: string;
};

export type OnboardingStepModalResult = {
  key: OnboardingKey;
  checked: true;
  updatedAt: string;
  comment: string;
  commissionValue?: string;
  partnerEmail?: string;
};

type Props = {
  open: boolean;
  stepKey: OnboardingKey;
  stepLabel: string;

  // current saved meta (if already checked, to prefill)
  current?: OnboardingStepMeta;

  onClose: () => void;
  onSave: (result: OnboardingStepModalResult) => void;
};

export default function OnboardingStepModal({
  open,
  stepKey,
  stepLabel,
  current,
  onClose,
  onSave,
}: Props) {
  const [comment, setComment] = useState("");
  const [commissionValue, setCommissionValue] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");

  // Prefill when opening or when switching step
  useEffect(() => {
    if (!open) return;

    setComment(current?.comment || "");
    setCommissionValue(current?.commissionValue || "");
    setPartnerEmail(current?.partnerEmail || "");
  }, [open, stepKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const needsCommission = stepKey === "commissionSettled";
  const needsPartnerEmail = stepKey === "partnerCreated";

  const canSave = useMemo(() => {
    if (!comment.trim()) return false;
    if (needsCommission && !commissionValue.trim()) return false;
    if (needsPartnerEmail && !partnerEmail.trim()) return false;
    return true;
  }, [comment, commissionValue, partnerEmail, needsCommission, needsPartnerEmail]);

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
            <div className="text-lg font-semibold">{stepLabel}</div>
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
          {needsCommission && (
            <Field
              label="Commission (amount or %)"
              value={commissionValue}
              onChange={setCommissionValue}
              placeholder="e.g., 5% or ₹5000"
            />
          )}

          {needsPartnerEmail && (
            <Field
              label="Partner email ID"
              value={partnerEmail}
              onChange={setPartnerEmail}
              placeholder="e.g., organizer@gmail.com"
            />
          )}

          <div>
            <div className="text-sm font-medium text-white/70">Comments</div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What happened / what did the organizer say?"
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
                key: stepKey,
                checked: true,
                updatedAt: now,
                comment: comment.trim(),
                commissionValue: needsCommission ? commissionValue.trim() : undefined,
                partnerEmail: needsPartnerEmail ? partnerEmail.trim() : undefined,
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

/* ------------ small helper ------------ */

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <div className="text-sm font-medium text-white/70">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
      />
    </div>
  );
}
